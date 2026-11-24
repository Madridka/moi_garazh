import type { Car, Expense, OilChange, Refuel } from '@/stores/garage/types'

export const createDemoCar = (): Car => {
  const oilChanges: OilChange[] = [
    { id: 'oil-1', date: '2025-10-07', odometer: 102040, oil: 'Toyota Castle SN 0W-20', comment: 'Масло и фильтр. Справочный объём по руководству — 3,7 л.' },
    { id: 'oil-2', date: '2026-04-09', odometer: 107810, oil: 'Toyota Castle SN 0W-20', comment: 'Заменён масляный фильтр. Справочный объём — 3,7 л.' },
    { id: 'oil-3', date: '2026-10-22', odometer: 114030, oil: 'Toyota Castle SN 0W-20', comment: 'Заменены масляный фильтр и шайба сливной пробки. Справочный объём — 3,7 л.' },
  ]

  const stops: [date: string, km: number, litres: number, price: number, full: boolean][] = [
    ['2025-10-02', 101940, 29, 59.4, true],
    ['2025-10-20', 102560, 29.5, 60.1, true],
    ['2025-11-05', 103110, 28, 61.2, true],
    ['2025-11-26', 103580, 27.2, 62.4, true],
    ['2025-12-10', 103930, 18, 62.9, false],
    ['2025-12-27', 104480, 34, 63.5, true],
    ['2026-01-13', 104950, 31.1, 63.8, true],
    ['2026-02-02', 105430, 28.2, 64.2, true],
    ['2026-02-19', 105920, 29.5, 64.8, true],
    ['2026-03-07', 106420, 29, 65.1, true],
    ['2026-03-24', 106960, 29.8, 65.4, true],
    ['2026-04-03', 107430, 22.4, 65.8, true],
    ['2026-04-18', 108010, 28.6, 66.2, true],
    ['2026-05-10', 108640, 28, 66.4, true],
    ['2026-05-28', 109240, 26.4, 66.9, true],
    ['2026-06-19', 109920, 30.2, 67.2, true],
    ['2026-07-09', 110550, 29, 67.5, true],
    ['2026-07-27', 111180, 28.8, 68.1, true],
    ['2026-08-12', 111550, 14, 68.4, false],
    ['2026-08-31', 112250, 33.2, 69, true],
    ['2026-09-19', 112950, 31.8, 69.4, true],
    ['2026-10-09', 113660, 34, 69.8, true],
    ['2026-10-29', 114180, 30, 70.3, false],
    ['2026-11-19', 114810, 34.2, 71.1, true],
  ]

  const refuels: Refuel[] = stops.map(([date, odometer, litres, price, fullTank], index) => ({
    id: `fuel-${index + 1}`,
    kind: 'fuel',
    date,
    odometer,
    amount: Math.round(litres * price * 100),
    litrePrice: Math.round(price * 100),
    fullTank,
    comment: fullTank ? '' : 'Частичная заправка',
  }))

  const costs: [date: string, km: number, rubles: number, category: Expense['category'], comment: string][] = [
    ['2025-10-07', 102040, 6850, 'Ремонт', 'Моторное масло, фильтр и работа'],
    ['2025-10-23', 102680, 2400, 'Прочее', 'Сезонный шиномонтаж'],
    ['2025-11-14', 103340, 750, 'Мойка', 'Кузов и коврики'],
    ['2025-12-28', 104500, 520, 'Прочее', 'Зимняя омывающая жидкость'],
    ['2026-02-10', 105650, 950, 'Мойка', 'Комплексная мойка'],
    ['2026-03-28', 107120, 1850, 'Ремонт', 'Замена салонного фильтра'],
    ['2026-04-09', 107810, 7200, 'Ремонт', 'Моторное масло, фильтр и работа'],
    ['2026-05-16', 108880, 1100, 'Мойка', 'Комплексная мойка'],
    ['2026-07-03', 110350, 9400, 'Ремонт', 'Передние колодки и работа'],
    ['2026-09-09', 112570, 1660, 'Прочее', 'Комплект передних щёток'],
    ['2026-10-22', 114030, 7650, 'Ремонт', 'Моторное масло, фильтр, шайба и работа'],
    ['2026-11-03', 114350, 850, 'Мойка', 'Кузов и коврики'],
  ]

  const expenses: Expense[] = costs.map(([date, odometer, rubles, category, comment], index) => ({
    id: `expense-${index + 1}`,
    kind: 'expense',
    date,
    odometer,
    amount: rubles * 100,
    category,
    comment,
  }))

  return {
    id: 'demo-toyota-aqua',
    demo: true,
    make: 'Toyota',
    model: 'Aqua L',
    name: 'Toyota Aqua',
    year: '2017',
    plate: 'А000АА 154',
    vehicleNumber: 'NHP10-0000000',
    calculateFuel: true,
    notes: [
      { id: 'note-engine', title: 'Двигатель', value: '1NZ-FXE · 1,5 л · гибрид' },
      { id: 'note-drive', title: 'Привод', value: 'Передний (FF)' },
      { id: 'note-tank', title: 'Бак', value: '36 л' },
      { id: 'note-body', title: 'Код кузова', value: 'DAA-NHP10 · японский рынок' },
      { id: 'note-oil', title: 'Моторное масло', value: 'Toyota 0W-20\nСправочный объём при замене — 3,4 л без фильтра, 3,7 л с фильтром.' },
    ],
    oilChanges,
    entries: [...refuels, ...expenses],
  }
}
