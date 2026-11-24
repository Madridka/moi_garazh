<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGarageFormat } from '@/composables/useGarageFormat'
import { fuelLitres } from '@/stores/garage/methods'
import { categories } from '@/stores/garage/types'
import type { Entry, Refuel } from '@/stores/garage/types'

const props = defineProps<{
  entries: readonly Entry[]
  fuel: readonly Refuel[]
  fuelOnly: boolean
  calculateFuel: boolean
  readings: ReadonlyMap<string, number>
}>()
const { t } = useI18n()
const { formatMoney, formatNumber, formatCategory, formatLitres, formatConsumption } = useGarageFormat()

const totals = computed(() => {
  const breakdown = { fuel: 0, Ремонт: 0, Мойка: 0, Прочее: 0 }
  for (const entry of props.entries) breakdown[entry.kind === 'fuel' ? 'fuel' : entry.category] += entry.amount
  return breakdown
})
const grandTotal = computed(() => Object.values(totals.value).reduce((sum, value) => sum + value, 0))
const totalLitres = computed(() => props.fuel.reduce((sum, entry) => sum + fuelLitres(entry), 0))
const latestReading = computed(() => {
  const latest = props.fuel.find(({ id }) => props.readings.has(id))
  return latest ? props.readings.get(latest.id) : undefined
})
</script>

<template>
  <details class="statistics">
    <summary>
      <span class="pi pi-chart-bar" aria-hidden="true"></span>
      {{ t('journal.stats') }}
      <span class="stats-chevron pi pi-angle-down" aria-hidden="true"></span>
    </summary>
    <div class="statistics-content">
      <dl class="facts-grid">
        <div class="stats-total">
          <dt>{{ t(fuelOnly ? 'journal.fuelTotal' : 'journal.total') }}</dt>
          <dd>{{ formatMoney(fuelOnly ? totals.fuel : grandTotal) }}</dd>
        </div>
        <template v-if="fuelOnly">
          <div><dt>{{ t('journal.fillCount') }}</dt><dd>{{ formatNumber(fuel.length) }}</dd></div>
          <div><dt>{{ t('journal.fillVolume') }}</dt><dd>{{ formatLitres(totalLitres) }}</dd></div>
          <div v-if="latestReading !== undefined">
            <dt>{{ t('journal.latestConsumption') }}</dt><dd>{{ formatConsumption(latestReading) }}</dd>
          </div>
        </template>
        <template v-else>
          <div><dt>{{ t('journal.fuelCategory') }}</dt><dd>{{ formatMoney(totals.fuel) }}</dd></div>
          <div v-for="category in categories" :key="category">
            <dt>{{ formatCategory(category) }}</dt><dd>{{ formatMoney(totals[category]) }}</dd>
          </div>
        </template>
      </dl>
      <p v-if="fuelOnly && calculateFuel && latestReading === undefined" class="muted">
        {{ t('journal.consumptionHint') }}
      </p>
    </div>
  </details>
</template>
