<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGarageFormat } from '@/composables/useGarageFormat'
import { newestFirst, profileName, vehicleName } from '@/stores/garage/methods'
import type { Car, Note, OilChange } from '@/stores/garage/types'

import Button from 'primevue/button'

const props = defineProps<{ car: Car }>()
const emit = defineEmits<{
  edit: []
  note: [note?: Note]
  oil: [record?: OilChange]
}>()
const { t } = useI18n()
const { formatDate, formatDistance } = useGarageFormat()
const oilChanges = computed(() => newestFirst(props.car.oilChanges))
const facts = computed(() => [
  { label: 'vehicle.makeModel', value: vehicleName(props.car) },
  { label: 'vehicle.year', value: props.car.year },
  { label: 'vehicle.plate', value: props.car.plate },
  { label: 'vehicle.vehicleNumber', value: props.car.vehicleNumber },
  { label: 'vehicle.calculateFuel', value: t(props.car.calculateFuel ? 'vehicle.enabled' : 'vehicle.disabled') },
])
</script>

<template>
  <div class="page-stack">
    <h1>{{ t('vehicle.title') }}</h1>

    <section class="panel section-stack" aria-labelledby="vehicle-profile">
      <div class="section-heading">
        <div class="section-identity">
          <span class="icon-tile pi pi-car" aria-hidden="true"></span>
          <div>
            <p class="muted">{{ t('vehicle.profile') }}</p>
            <h2 id="vehicle-profile">{{ profileName(car) }}</h2>
          </div>
        </div>
        <Button class="button button-secondary" type="button" :label="t('common.edit')" @click="emit('edit')" />
      </div>
      <dl class="facts-grid">
        <div v-for="fact in facts" :key="fact.label">
          <dt>{{ t(fact.label) }}</dt><dd>{{ fact.value || t('common.empty') }}</dd>
        </div>
      </dl>
    </section>

    <section class="section-stack" aria-labelledby="notes-title">
      <div class="section-heading">
        <h2 id="notes-title">{{ t('vehicle.notes') }}</h2>
        <Button class="button button-secondary" type="button" icon="pi pi-plus" :label="t('vehicle.addNote')" @click="emit('note')" />
      </div>
      <ul v-if="car.notes.length" class="record-list">
        <li v-for="note in car.notes" :key="note.id">
          <Button type="button" class="record-row" @click="emit('note', note)">
            <span class="record-content">
              <strong>{{ note.title }}</strong>
              <span v-if="note.value" class="record-comment">{{ note.value }}</span>
            </span>
          </Button>
        </li>
      </ul>
      <p v-else class="empty-inline">{{ t('vehicle.noNotes') }}</p>
    </section>

    <section class="section-stack" aria-labelledby="oil-title">
      <div class="section-heading">
        <h2 id="oil-title">{{ t('vehicle.oil') }}</h2>
        <Button class="button button-secondary" type="button" icon="pi pi-plus" :label="t('vehicle.addOil')" @click="emit('oil')" />
      </div>
      <ul v-if="oilChanges.length" class="record-list">
        <li v-for="(record, index) in oilChanges" :key="record.id">
          <Button type="button" class="record-row" @click="emit('oil', record)">
            <span class="record-content">
              <span v-if="index === 0" class="reading">{{ t('vehicle.latestOil') }}</span>
              <strong>{{ record.oil }}</strong>
              <span class="muted">{{ formatDate(record.date) }} · {{ formatDistance(record.odometer) }}</span>
              <span v-if="record.comment" class="record-comment">{{ record.comment }}</span>
            </span>
          </Button>
        </li>
      </ul>
      <p v-else class="empty-inline">{{ t('vehicle.noOil') }}</p>
    </section>
  </div>
</template>
