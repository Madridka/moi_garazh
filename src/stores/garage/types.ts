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

export interface JournalLine {
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

export type GarageError = 'load' | 'conflict' | 'missing' | 'save'
