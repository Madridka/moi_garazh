<script setup lang="ts">
import { computed } from 'vue'
import { formatDate, formatNumber, newestFirst, vehicleName } from './domain'
import type { Car, Note, OilChange } from './domain'

const props = defineProps<{ car: Car }>()
const emit = defineEmits<{
  edit: []
  note: [note?: Note]
  oil: [record?: OilChange]
}>()

const oilChanges = computed(() => newestFirst(props.car.oilChanges))
</script>

<template>
  <div class="page-stack">
    <div class="page-heading">
      <h1>Авто</h1>
      <button type="button" class="button button-secondary" @click="emit('edit')">Редактировать</button>
    </div>

    <section class="section-stack" aria-label="Данные автомобиля">
      <dl class="vehicle-facts">
        <div><dt>Марка и модель</dt><dd>{{ vehicleName(car) }}</dd></div>
        <div><dt>Год выпуска</dt><dd>{{ car.year || '—' }}</dd></div>
        <div><dt>Госномер</dt><dd>{{ car.plate || '—' }}</dd></div>
        <div><dt>VIN / номер кузова</dt><dd>{{ car.vehicleNumber || '—' }}</dd></div>
        <div><dt>Расчёт расхода</dt><dd>{{ car.calculateFuel ? 'Включён' : 'Выключен' }}</dd></div>
      </dl>
      <div v-if="car.demo" class="source-links">
        <a href="https://toyota.jp/ucar/catalog/brand-TOYOTA/car-AQUA/201706/10110398/" target="_blank" rel="noopener noreferrer">Характеристики Toyota</a>
        <a href="https://manual.toyota.jp/pdf/aqua/aqua_201711.pdf" target="_blank" rel="noopener noreferrer">Руководство Toyota</a>
      </div>
    </section>

    <section class="section-stack" aria-labelledby="oil-title">
      <div class="section-heading">
        <h2 id="oil-title">Масло</h2>
        <button type="button" class="button button-secondary" @click="emit('oil')"><span class="plus" aria-hidden="true">+</span> Записать замену</button>
      </div>
      <ul v-if="oilChanges.length" class="record-list">
        <li v-for="(record, index) in oilChanges" :key="record.id">
          <button type="button" class="record-row" @click="emit('oil', record)">
            <span class="record-content">
              <span v-if="index === 0" class="record-meta latest-label">Последняя замена</span>
              <strong>{{ record.oil }}</strong>
              <span class="record-meta">{{ formatDate(record.date) }} · {{ formatNumber(record.odometer) }} км</span>
              <span v-if="record.comment" class="record-comment">{{ record.comment }}</span>
            </span>
          </button>
        </li>
      </ul>
      <p v-else class="empty-inline">Замен масла пока нет.</p>
    </section>

    <section class="section-stack" aria-labelledby="notes-title">
      <div class="section-heading">
        <h2 id="notes-title">Свои поля</h2>
        <button type="button" class="button button-secondary" @click="emit('note')"><span class="plus" aria-hidden="true">+</span> Добавить поле</button>
      </div>
      <ul v-if="car.notes.length" class="record-list">
        <li v-for="note in car.notes" :key="note.id">
          <button type="button" class="record-row" @click="emit('note', note)">
            <span class="record-content"><strong>{{ note.title }}</strong><span v-if="note.value" class="record-comment">{{ note.value }}</span></span>
          </button>
        </li>
      </ul>
      <p v-else class="empty-inline">Здесь можно записать длину дворников, размер шин и другие сведения.</p>
    </section>
  </div>
</template>
