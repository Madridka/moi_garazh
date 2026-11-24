import { defineStore } from 'pinia'
import { shallowRef } from 'vue'
import { useDemoStore } from '@/stores/demo/demo'
import type { Editor, EditorValue } from '@/stores/garage/editor.types'
import { createId } from '@/stores/garage/methods'
import { createGarageStorage, emptyGarage, RecordMissingError } from '@/stores/garage/storage'
import type { Garage, GarageError } from '@/stores/garage/types'

const recordIndex = <Record extends { id: string }>(records: Record[], id: string) => {
  const index = records.findIndex((record) => record.id === id)
  if (index < 0) throw new RecordMissingError()
  return index
}

const upsert = <Record extends { id: string }>(records: Record[], value: Record, editing: boolean) => {
  if (editing) records[recordIndex(records, value.id)] = value
  else records.push(value)
}

const remove = <Record extends { id: string }>(records: Record[], id: string) => {
  records.splice(recordIndex(records, id), 1)
}

export const useGarageStore = defineStore('garage', () => {
  const demoStore = useDemoStore()
  const storage = createGarageStorage(demoStore.createDemoCar)
  const garage = shallowRef(emptyGarage())
  const loadError = shallowRef<GarageError | null>(null)

  const reload = () => {
    const result = storage.load()
    loadError.value = result.error ?? null
    if (result.garage) garage.value = result.garage
  }

  const save = (change: (draft: Garage) => void): GarageError | null => {
    if (loadError.value) return loadError.value
    const result = storage.save(change)
    if (result.garage) garage.value = result.garage
    if (result.error === 'load') loadError.value = result.error
    return result.error ?? null
  }

  const makePrimary = (carId: string) => save((draft) => {
    recordIndex(draft.cars, carId)
    draft.primaryCarId = carId
  })

  const saveRecord = (active: Editor, data: EditorValue): { error: GarageError | null; addedCarId?: string } => {
    if (active.kind !== data.kind) return { error: 'save' as const }
    const originalId = active.record?.id
    let addedCarId: string | undefined

    const error = save((draft) => {
      const id = originalId ?? createId()
      if (active.kind === 'profile' && data.kind === 'profile') {
        if (originalId) {
          Object.assign(draft.cars[recordIndex(draft.cars, originalId)], data.value)
        } else {
          draft.cars.push({ ...data.value, id, notes: [], entries: [], oilChanges: [] })
          addedCarId = id
        }
        return
      }

      if (active.kind === 'profile') return
      const car = draft.cars[recordIndex(draft.cars, active.carId)]
      if (data.kind === 'entry') upsert(car.entries, { ...data.value, id }, Boolean(originalId))
      if (data.kind === 'note') upsert(car.notes, { ...data.value, id }, Boolean(originalId))
      if (data.kind === 'oil') upsert(car.oilChanges, { ...data.value, id }, Boolean(originalId))
    })

    return { error, addedCarId: error ? undefined : addedCarId }
  }

  const removeRecord = (active: Editor, replacement: string): GarageError | null => {
    if (!active.record || (active.kind === 'profile' && active.record.demo)) return 'missing'
    const { id } = active.record

    return save((draft) => {
      if (active.kind === 'profile') {
        remove(draft.cars, id)
        if (draft.primaryCarId === id) {
          if (draft.cars.length) recordIndex(draft.cars, replacement)
          draft.primaryCarId = draft.cars.length ? replacement : null
        }
        return
      }

      const car = draft.cars[recordIndex(draft.cars, active.carId)]
      if (active.kind === 'entry') remove(car.entries, id)
      if (active.kind === 'note') remove(car.notes, id)
      if (active.kind === 'oil') remove(car.oilChanges, id)
    })
  }

  reload()
  return { garage, loadError, reload, makePrimary, saveRecord, removeRecord }
})
