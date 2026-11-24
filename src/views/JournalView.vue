<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGarageFormat } from '@/composables/useGarageFormat'
import { fuelConsumption, fuelLitres, newestFirst } from '@/stores/garage/methods'
import type { Car, Entry, Refuel } from '@/stores/garage/types'

import Button from 'primevue/button'

import JournalStats from '@/components/JournalStats.vue'

const props = defineProps<{ car: Car }>()
const emit = defineEmits<{ add: [kind: Entry['kind']]; edit: [entry: Entry] }>()
const { t } = useI18n()
const { formatMoney, formatDate, formatDistance, formatLitres, formatConsumption, formatCategory, formatNumber } = useGarageFormat()

const filters = ['all', 'fuel'] as const
const pageSize = 10
const filter = ref<(typeof filters)[number]>('all')
const page = ref(1)
const listHeading = ref<HTMLHeadingElement | null>(null)
const sorted = computed(() => newestFirst(props.car.entries))
const fuel = computed(() => sorted.value.filter((entry): entry is Refuel => entry.kind === 'fuel'))
const entries = computed(() => filter.value === 'fuel' ? fuel.value : sorted.value)
const readings = computed(() => props.car.calculateFuel ? fuelConsumption(props.car.entries) : new Map<string, number>())
const pageCount = computed(() => Math.max(1, Math.ceil(entries.value.length / pageSize)))
const visibleEntries = computed(() => entries.value.slice((page.value - 1) * pageSize, page.value * pageSize))

watch(pageCount, (count) => { page.value = Math.min(page.value, count) })

const setFilter = (next: typeof filter.value) => {
  if (next === filter.value) return
  filter.value = next
  page.value = 1
}

const turnPage = async (next: number) => {
  page.value = next
  await nextTick()
  listHeading.value?.focus()
}
</script>

<template>
  <div class="page-stack">
    <div class="page-heading">
      <h1>{{ t('journal.title') }}</h1>
      <Button class="button button-primary" type="button" icon="pi pi-plus" :label="t('common.add')"
        @click="emit('add', filter === 'fuel' ? 'fuel' : 'expense')" />
    </div>

    <div class="segmented" role="group" :aria-label="t('journal.filter')">
      <Button v-for="item in filters" :key="item" type="button" :aria-pressed="filter === item"
        :label="t(`journal.${item}`)" @click="setFilter(item)" />
    </div>

    <JournalStats :entries="car.entries" :fuel="fuel" :fuel-only="filter === 'fuel'"
      :calculate-fuel="car.calculateFuel" :readings="readings" />

    <section class="section-stack" aria-labelledby="journal-title">
      <h2 id="journal-title" ref="listHeading" tabindex="-1">{{ t(filter === 'fuel' ? 'journal.fuelHistory' : 'journal.history') }}</h2>
      <ul v-if="visibleEntries.length" class="record-list">
        <li v-for="entry in visibleEntries" :key="entry.id">
          <Button type="button" class="record-row" @click="emit('edit', entry)">
            <span class="record-icon pi" :class="entry.kind === 'fuel' ? 'pi-gauge' : 'pi-wallet'" aria-hidden="true"></span>
            <span class="record-content">
              <strong>{{ entry.kind === 'fuel' ? t('journal.fuelEntry') : formatCategory(entry.category) }}</strong>
              <span class="muted">{{ formatDate(entry.date) }} · {{ formatDistance(entry.odometer) }}</span>
              <span v-if="entry.comment" class="record-comment">{{ entry.comment }}</span>
            </span>
            <span class="record-value">
              <strong>{{ formatMoney(entry.amount) }}</strong>
              <template v-if="entry.kind === 'fuel'">
                <span class="muted">{{ formatLitres(fuelLitres(entry)) }} · {{ t('units.litrePrice', { value: formatMoney(entry.litrePrice) }) }}</span>
                <span class="muted">{{ t(entry.fullTank ? 'journal.fullTank' : 'journal.partialTank') }}</span>
                <span v-if="readings.has(entry.id)" class="reading">{{ formatConsumption(readings.get(entry.id)!) }}</span>
              </template>
            </span>
          </Button>
        </li>
      </ul>
      <p v-else class="empty-inline">{{ t(filter === 'fuel' ? 'journal.emptyFuel' : 'journal.empty') }}</p>

      <nav v-if="pageCount > 1" class="pagination" :aria-label="t('journal.pagination')">
        <Button class="button button-secondary" type="button" :label="t('common.back')" :disabled="page === 1"
          @click="turnPage(page - 1)" />
        <span class="muted" aria-live="polite">{{ t('journal.page', { current: formatNumber(page), total: formatNumber(pageCount) }) }}</span>
        <Button class="button button-secondary" type="button" :label="t('common.next')" :disabled="page === pageCount"
          @click="turnPage(page + 1)" />
      </nav>
    </section>
  </div>
</template>
