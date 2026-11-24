import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import type { App } from 'vue'
import { i18n } from '@/plugins/i18n'
import 'primeicons/primeicons.css'

export const registerPlugins = (app: App) => {
  app.use(createPinia())
  app.use(i18n)
  app.use(PrimeVue, { unstyled: true })
}
