export const categories = ['Ремонт', 'Мойка', 'Прочее'] as const
export type Category = (typeof categories)[number]

export interface Profile {
  make: string
  model: string
  name: string
  year: string
  plate: string
  vehicleNumber: string
  calculateFuel: boolean
}

export interface Note {
  id: string
  title: string
  value: string
}

export interface OilChange {
  id: string
  oil: string
  date: string
  odometer: number
  comment: string
}

interface JournalLine {
  id: string
  date: string
  odometer: number
  amount: number
  comment: string
}

export interface Expense extends JournalLine {
  kind: 'expense'
  category: Category
}

export interface Refuel extends JournalLine {
  kind: 'fuel'
  litrePrice: number
  fullTank: boolean
}

export type Entry = Expense | Refuel

export interface Car extends Profile {
  id: string
  demo?: true
  notes: Note[]
  oilChanges: OilChange[]
  entries: Entry[]
}

export interface Garage {
  version: 1
  primaryCarId: string | null
  cars: Car[]
}

const rubles = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 2 })
const number = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 })
const consumption = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const dates = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

export const formatMoney = (kopecks: number) => rubles.format(kopecks / 100)
export const formatNumber = (value: number) => number.format(value)
export const formatConsumption = (value: number) => consumption.format(value)
export const formatDate = (value: string) => dates.format(new Date(`${value}T00:00:00Z`))
export const vehicleName = (car: Profile) => `${car.make} ${car.model}`
export const profileName = (car: Profile) => car.name || vehicleName(car)
export const fuelLitres = (entry: Refuel) => entry.amount / entry.litrePrice

export function createId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function today(): string {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function parseMoney(value: string): number | null {
  const input = value.trim()
  if (!/^(?:\d+(?:[.,]\d{1,2})?|[.,]\d{1,2})$/.test(input)) return null
  const [whole, decimal = ''] = input.split(/[.,]/)
  const kopecks = Number(whole) * 100 + Number(decimal.padEnd(2, '0'))
  return Number.isSafeInteger(kopecks) && kopecks > 0 ? kopecks : null
}

export function parseOdometer(value: string): number | null {
  const input = value.trim()
  if (!/^\d+$/.test(input)) return null
  const odometer = Number(input)
  return Number.isSafeInteger(odometer) ? odometer : null
}

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return false
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function chronological(a: JournalDate, b: JournalDate): number {
  return a.date.localeCompare(b.date) || a.odometer - b.odometer
}

type JournalDate = Pick<JournalLine, 'date' | 'odometer'>

export function newestFirst<T extends JournalDate>(records: T[]): T[] {
  return [...records].reverse().sort((a, b) => chronological(b, a))
}

export function fuelConsumption(entries: Entry[]): Map<string, number> {
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
