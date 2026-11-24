<script setup lang="ts">
import { computed, ref } from 'vue'
import { categories, formatConsumption, formatDate, formatMoney, formatNumber, fuelConsumption, fuelLitres, newestFirst } from './domain'
import type { Car, Entry } from './domain'

const props = defineProps<{ car: Car }>()
const emit = defineEmits<{
  add: [kind: Entry['kind']]
  edit: [entry: Entry]
}>()

const tab = ref<'all' | 'fuel'>('all')
const sorted = computed(() => newestFirst(props.car.entries))
const fuel = computed(() => sorted.value.filter((entry) => entry.kind === 'fuel'))
const entries = computed(() => tab.value === 'fuel' ? fuel.value : sorted.value)
const readings = computed(() => props.car.calculateFuel
  ? fuelConsumption(props.car.entries)
  : new Map<string, number>(),
)
const latestReading = computed(() => fuel.value.map(({ id }) => readings.value.get(id)).find((value) => value !== undefined))
const totals = computed(() => {
  const breakdown = { fuel: 0, Ремонт: 0, Мойка: 0, Прочее: 0 }
  for (const entry of props.car.entries) {
    const key = entry.kind === 'fuel' ? 'fuel' : entry.category
    breakdown[key] += entry.amount
  }
  return breakdown
})
const grandTotal = computed(() => Object.values(totals.value).reduce((sum, value) => sum + value, 0))
const totalLitres = computed(() => fuel.value.reduce((sum, entry) => sum + fuelLitres(entry), 0))
</script>

<template>
  <div class="page-stack">
    <div class="page-heading">
      <h1>Траты</h1>
      <button class="button button-primary" type="button" @click="emit('add', tab === 'fuel' ? 'fuel' : 'expense')">
        <span class="plus" aria-hidden="true">+</span> Добавить
      </button>
    </div>

    <div class="segmented" role="group" aria-label="Вид журнала">
      <button type="button" :aria-pressed="tab === 'all'" @click="tab = 'all'">Все траты</button>
      <button type="button" :aria-pressed="tab === 'fuel'" @click="tab = 'fuel'">Заправки</button>
    </div>

    <section class="summary" aria-label="Итоги за всё время">
      <div class="summary-total">
        <p class="summary-label">{{ tab === 'all' ? 'Траты за всё время' : 'На топливо за всё время' }}</p>
        <p class="total-value">{{ formatMoney(tab === 'all' ? grandTotal : totals.fuel) }}</p>
      </div>
      <dl v-if="tab === 'all'" class="summary-breakdown">
        <div><dt>Топливо</dt><dd>{{ formatMoney(totals.fuel) }}</dd></div>
        <div v-for="category in categories" :key="category"><dt>{{ category }}</dt><dd>{{ formatMoney(totals[category]) }}</dd></div>
      </dl>
      <dl v-else class="summary-breakdown">
        <div><dt>Заправок</dt><dd>{{ formatNumber(fuel.length) }}</dd></div>
        <div><dt>Залито</dt><dd>{{ formatNumber(totalLitres) }} л</dd></div>
        <div v-if="latestReading !== undefined" class="reading-stat"><dt>Последний расход</dt><dd>{{ formatConsumption(latestReading) }} л/100 км</dd></div>
      </dl>
    </section>

    <p v-if="tab === 'fuel' && car.calculateFuel && latestReading === undefined" class="field-hint">
      Расход появится после двух полных заправок с разным пробегом.
    </p>

    <section class="section-stack" aria-labelledby="journal-title">
      <div class="section-heading"><h2 id="journal-title">{{ tab === 'all' ? 'Журнал' : 'История заправок' }}</h2></div>
      <ul v-if="entries.length" class="record-list">
        <li v-for="entry in entries" :key="entry.id">
          <button type="button" class="record-row" @click="emit('edit', entry)">
            <span class="record-mark" :class="{ 'record-mark-fuel': entry.kind === 'fuel' }" aria-hidden="true"></span>
            <span class="record-content">
              <strong>{{ entry.kind === 'fuel' ? 'Заправка' : entry.category }}</strong>
              <span class="record-meta">{{ formatDate(entry.date) }} · {{ formatNumber(entry.odometer) }} км</span>
              <span v-if="entry.comment" class="record-comment">{{ entry.comment }}</span>
            </span>
            <span class="record-value">
              <strong>{{ formatMoney(entry.amount) }}</strong>
              <template v-if="entry.kind === 'fuel'">
                <span class="record-meta">{{ formatNumber(fuelLitres(entry)) }} л · {{ formatMoney(entry.litrePrice) }}/л</span>
                <span class="record-meta">{{ entry.fullTank ? 'Полный бак' : 'Частичная' }}</span>
                <span v-if="readings.has(entry.id)" class="reading">{{ formatConsumption(readings.get(entry.id)!) }} л/100 км</span>
              </template>
            </span>
          </button>
        </li>
      </ul>
      <p v-else class="empty-inline">{{ tab === 'all' ? 'В журнале пока нет записей.' : 'Заправок пока нет.' }}</p>
    </section>
  </div>
</template>
