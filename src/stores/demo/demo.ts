import { defineStore } from 'pinia'
import { createDemoCar } from '@/stores/demo/methods'

export const useDemoStore = defineStore('demo', () => ({ createDemoCar }))
