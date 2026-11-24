import { shallowRef } from 'vue'
import type { Garage } from './domain'

const storageKey = 'moy-garazh:auto:garage'

function emptyGarage(): Garage {
  return { version: 1, primaryCarId: null, cars: [] }
}

function readGarage(raw: string | null): Garage {
  if (raw === null) return emptyGarage()
  const saved = JSON.parse(raw) as Garage | null
  if (saved?.version !== 1 || !Array.isArray(saved.cars)) throw new Error('Invalid garage data')
  if (!saved.cars.every((car) => car && typeof car.id === 'string'
    && typeof car.make === 'string' && typeof car.model === 'string'
    && Array.isArray(car.entries) && Array.isArray(car.oilChanges) && Array.isArray(car.notes))) {
    throw new Error('Invalid car data')
  }
  const primaryCarId = saved.cars.some((car) => car.id === saved.primaryCarId)
    ? saved.primaryCarId
    : saved.cars[0]?.id ?? null
  return { ...saved, primaryCarId }
}

export function useGarage() {
  const garage = shallowRef<Garage>(emptyGarage())
  const loadError = shallowRef('')
  let savedRaw: string | null = null

  function reload(): boolean {
    try {
      const raw = localStorage.getItem(storageKey)
      garage.value = readGarage(raw)
      savedRaw = raw
      loadError.value = ''
      return true
    } catch {
      loadError.value = 'Не удалось открыть данные гаража в этом браузере.'
      return false
    }
  }

  function save(change: (draft: Garage) => void): string {
    if (loadError.value) return loadError.value

    try {
      if (localStorage.getItem(storageKey) !== savedRaw) {
        if (!reload()) return loadError.value
        return 'Данные обновились в другой вкладке. Проверьте запись и повторите действие.'
      }
      const next = structuredClone(garage.value)
      change(next)
      const raw = JSON.stringify(next)
      localStorage.setItem(storageKey, raw)
      garage.value = next
      savedRaw = raw
      return ''
    } catch (error) {
      if (error instanceof RecordMissingError) return 'Эта запись была удалена. Закройте форму и обновите список.'
      return 'Не удалось сохранить данные в браузере. Проверьте доступ к хранилищу и свободное место.'
    }
  }

  reload()
  return { garage, loadError, reload, save }
}

export class RecordMissingError extends Error {}
