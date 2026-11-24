<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { profileName, vehicleName } from '@/stores/garage/methods'
import type { Car } from '@/stores/garage/types'

import Button from 'primevue/button'

defineProps<{ cars: Car[]; primaryCarId: string | null }>()
const emit = defineEmits<{ add: []; select: [car: Car]; edit: [car: Car]; primary: [car: Car] }>()
const { t } = useI18n()
</script>

<template>
  <div class="page-stack">
    <div class="page-heading">
      <h1>{{ t('garage.title') }}</h1>
      <Button class="button button-primary" type="button" icon="pi pi-plus" :label="t('garage.add')" @click="emit('add')" />
    </div>
    <ul class="garage-list">
      <li v-for="car in cars" :key="car.id" class="panel garage-card">
        <div class="garage-card-info">
          <h2>{{ profileName(car) }}</h2>
          <p v-if="car.name || car.year" class="muted">{{ [car.name && vehicleName(car), car.year].filter(Boolean).join(' · ') }}</p>
          <div v-if="car.id === primaryCarId || car.demo" class="garage-labels">
            <span v-if="car.id === primaryCarId" class="badge">{{ t('garage.primary') }}</span>
            <span v-if="car.demo" class="badge">{{ t('garage.demo') }}</span>
          </div>
        </div>
        <div class="garage-actions">
          <Button type="button" class="button button-secondary" :label="t('common.open')" @click="emit('select', car)" />
          <Button type="button" class="button button-quiet" :label="t('common.edit')" @click="emit('edit', car)" />
          <Button v-if="car.id !== primaryCarId" type="button" class="button button-quiet"
            :label="t('garage.makePrimary')" @click="emit('primary', car)" />
        </div>
      </li>
    </ul>
  </div>
</template>
