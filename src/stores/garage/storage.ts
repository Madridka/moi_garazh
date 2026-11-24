import type { Car, Garage } from '@/stores/garage/types'

type CreateDemoCar = () => Car

const storageKey = 'moy-garazh:auto:garage'

export const emptyGarage = (): Garage => ({ version: 1, primaryCarId: null, cars: [] })

export class RecordMissingError extends Error {}

const readGarage = (raw: string | null, createDemoCar: CreateDemoCar): Garage => {
  const saved = raw === null ? emptyGarage() : JSON.parse(raw) as Garage | null
  if (saved?.version !== 1 || !Array.isArray(saved.cars)) throw new Error('Invalid garage data')
  if (!saved.cars.every((car) => car && typeof car.id === 'string'
    && typeof car.make === 'string' && typeof car.model === 'string'
    && Array.isArray(car.entries) && Array.isArray(car.oilChanges) && Array.isArray(car.notes))) {
    throw new Error('Invalid car data')
  }
  const cars = saved.cars.some((car) => car.demo) ? saved.cars : [...saved.cars, createDemoCar()]
  const primaryCarId = cars.some((car) => car.id === saved.primaryCarId)
    ? saved.primaryCarId
    : cars[0].id
  return { ...saved, cars, primaryCarId }
}

export const createGarageStorage = (createDemoCar: CreateDemoCar) => {
  let savedRaw: string | null = null

  const load = () => {
    try {
      const raw = localStorage.getItem(storageKey)
      const garage = readGarage(raw, createDemoCar)
      savedRaw = raw
      return { garage }
    } catch {
      return { error: 'load' as const }
    }
  }

  const save = (change: (draft: Garage) => void) => {
    try {
      if (localStorage.getItem(storageKey) !== savedRaw) {
        const result = load()
        if (result.error) return result
        return { garage: result.garage, error: 'conflict' as const }
      }
      const next = readGarage(savedRaw, createDemoCar)
      change(next)
      const raw = JSON.stringify(next)
      localStorage.setItem(storageKey, raw)
      savedRaw = raw
      return { garage: next }
    } catch (error) {
      return { error: error instanceof RecordMissingError ? 'missing' as const : 'save' as const }
    }
  }

  return { load, save }
}
