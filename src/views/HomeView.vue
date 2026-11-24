<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGarageFormat } from '@/composables/useGarageFormat'
import { latestOdometer, monthlyExpenses, profileName, today, vehicleName } from '@/stores/garage/methods'
import type { Car } from '@/stores/garage/types'

import Button from 'primevue/button'

const props = defineProps<{ car: Car }>()
const emit = defineEmits<{ add: []; journal: [] }>()
const { t } = useI18n()
const { formatMoney, formatDistance } = useGarageFormat()

const total = computed(() => monthlyExpenses(props.car.entries, today().slice(0, 7)))
const odometer = computed(() => latestOdometer(props.car))
const carDetails = computed(() =>
  [props.car.name && vehicleName(props.car), props.car.year, props.car.plate].filter(Boolean).join(' · '),
)
</script>

<template>
  <div class="page-stack overview">
    <h1>{{ t('home.title') }}</h1>
    <section class="overview-card" aria-labelledby="active-car">
      <div class="overview-vehicle">
        <span class="icon-tile pi pi-car" aria-hidden="true"></span>
        <div class="overview-vehicle-info">
          <p id="active-car" class="muted">{{ t('home.activeCar') }}</p>
          <h2>{{ profileName(car) }}</h2>
          <p v-if="carDetails" class="muted">{{ carDetails }}</p>
        </div>
      </div>
      <dl class="overview-metrics">
        <div>
          <dt>{{ t('home.month') }}</dt>
          <dd>{{ formatMoney(total) }}</dd>
        </div>
        <div>
          <dt>{{ t('home.odometer') }}</dt>
          <dd>{{ odometer === undefined ? t('common.empty') : formatDistance(odometer) }}</dd>
        </div>
      </dl>
      <div class="overview-actions">
        <Button class="button button-primary" type="button" icon="pi pi-plus" :label="t('common.add')" @click="emit('add')" />
        <Button class="button button-quiet" type="button" :label="t('home.journal')" @click="emit('journal')" />
      </div>
    </section>
  </div>
</template>
