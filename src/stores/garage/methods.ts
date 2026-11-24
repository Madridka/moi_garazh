import type { Car, Entry, JournalLine, Profile, Refuel } from '@/stores/garage/types'

export const vehicleName = (car: Profile) => `${car.make} ${car.model}`
export const profileName = (car: Profile) => car.name || vehicleName(car)
export const fuelLitres = (entry: Refuel) => entry.amount / entry.litrePrice

export const createId = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export const today = (): string => {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export const parseMoney = (value: string): number | null => {
  const input = value.trim()
  if (!/^(?:\d+(?:[.,]\d{1,2})?|[.,]\d{1,2})$/.test(input)) return null
  const [whole, decimal = ''] = input.split(/[.,]/)
  const kopecks = Number(whole) * 100 + Number(decimal.padEnd(2, '0'))
  return Number.isSafeInteger(kopecks) && kopecks > 0 ? kopecks : null
}

export const parseOdometer = (value: string): number | null => {
  const input = value.trim()
  if (!/^\d+$/.test(input)) return null
  const odometer = Number(input)
  return Number.isSafeInteger(odometer) ? odometer : null
}

export const isValidDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return false
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

type JournalDate = Pick<JournalLine, 'date' | 'odometer'>

const chronological = (first: JournalDate, second: JournalDate): number =>
  first.date.localeCompare(second.date) || first.odometer - second.odometer

export const newestFirst = <Record extends JournalDate>(records: readonly Record[]): Record[] =>
  [...records].reverse().sort((first, second) => chronological(second, first))

export const monthlyExpenses = (entries: readonly Entry[], month: string): number =>
  entries.reduce((total, entry) => entry.date.slice(0, 7) === month ? total + entry.amount : total, 0)

export const latestOdometer = (car: Car): number | undefined =>
  newestFirst<JournalDate>([...car.entries, ...car.oilChanges])[0]?.odometer

export const fuelConsumption = (entries: readonly Entry[]): Map<string, number> => {
  const readings = new Map<string, number>()
  const fuel = entries.filter((entry): entry is Refuel => entry.kind === 'fuel').sort(chronological)
  let previousFull: number | null = null
  let litres = 0

  for (const entry of fuel) {
    litres += fuelLitres(entry)
    if (!entry.fullTank) continue

    if (previousFull !== null && entry.odometer > previousFull) {
      readings.set(entry.id, (litres * 100) / (entry.odometer - previousFull))
    }
    previousFull = entry.odometer
    litres = 0
  }

  return readings
}
