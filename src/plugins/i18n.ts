import { createI18n } from 'vue-i18n'
import { ru } from '@/lang/ru'

export const i18n = createI18n({
  legacy: false,
  locale: 'ru-RU',
  fallbackLocale: 'ru-RU',
  messages: { 'ru-RU': ru },
  numberFormats: {
    'ru-RU': {
      money: { style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 2 },
      decimal: { maximumFractionDigits: 2 },
      consumption: { minimumFractionDigits: 1, maximumFractionDigits: 1 },
    },
  },
  datetimeFormats: {
    'ru-RU': {
      journal: { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' },
    },
  },
})
