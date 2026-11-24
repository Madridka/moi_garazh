import { useI18n } from 'vue-i18n'
import type { Category } from '@/stores/garage/types'

export const useGarageFormat = () => {
  const { t, n, d } = useI18n()

  return {
    formatMoney: (kopecks: number) => n(kopecks / 100, 'money'),
    formatNumber: (value: number) => n(value, 'decimal'),
    formatDate: (value: string) => d(new Date(`${value}T00:00:00Z`), 'journal'),
    formatDistance: (value: number) => t('units.distance', { value: n(value, 'decimal') }),
    formatLitres: (value: number) => t('units.litres', { value: n(value, 'decimal') }),
    formatConsumption: (value: number) => t('units.consumption', { value: n(value, 'consumption') }),
    formatCategory: (category: Category) => t(`categories.${category}`),
  }
}
