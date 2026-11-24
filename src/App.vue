<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import EditorDialog from './EditorDialog.vue'
import ExpensesView from './ExpensesView.vue'
import VehicleView from './VehicleView.vue'
import { createDemo } from './demo'
import { profileName, vehicleName } from './domain'
import type { Car, Entry, Note, OilChange } from './domain'
import type { Editor, EditorValue } from './editor'
import { RecordMissingError, useGarage } from './garage'

type Page = 'expenses' | 'vehicle' | 'garage'

const { garage, loadError, reload, save } = useGarage()
const page = ref<Page>('expenses')
const viewedId = ref<string | null>(null)
const editor = shallowRef<Editor | null>(null)
const editorError = ref('')
const pageError = ref('')

const primary = computed(() => garage.value.cars.find(({ id }) => id === garage.value.primaryCarId))
const current = computed(() => garage.value.cars.find(({ id }) => id === viewedId.value) ?? primary.value)
const demo = computed(() => garage.value.cars.find((car) => car.demo))

function show(next: Page) {
  if (next === page.value) return
  page.value = next
  pageError.value = ''
  window.scrollTo(0, 0)
}

function openCar(car: Car) {
  viewedId.value = car.id === garage.value.primaryCarId ? null : car.id
  show('expenses')
}

function makePrimary(car: Car) {
  pageError.value = save((draft) => { draft.primaryCarId = car.id })
  if (!pageError.value && viewedId.value === car.id) viewedId.value = null
}

function addDemo() {
  if (demo.value) {
    openCar(demo.value)
    return
  }

  const car = createDemo()
  pageError.value = save((draft) => {
    draft.cars.push(car)
    draft.primaryCarId ??= car.id
  })
  if (!pageError.value) openCar(car)
}

function open(next: Editor) {
  editorError.value = ''
  pageError.value = ''
  editor.value = next
}

function editEntry(kind: Entry['kind'], record?: Entry) {
  if (current.value) open({ kind: 'entry', carId: current.value.id, initialKind: kind, record })
}

function editNote(record?: Note) {
  if (current.value) open({ kind: 'note', carId: current.value.id, record })
}

function editOil(record?: OilChange) {
  if (current.value) open({ kind: 'oil', carId: current.value.id, record })
}

function close() {
  editor.value = null
  editorError.value = ''
}

function replace<T extends { id: string }>(records: T[], id: string | undefined, value: T) {
  if (!id) {
    records.push(value)
    return
  }
  const index = records.findIndex((record) => record.id === id)
  if (index < 0) throw new RecordMissingError()
  records[index] = value
}

function saveEditor(data: EditorValue) {
  const active = editor.value
  if (!active || active.kind !== data.kind) return
  const originalId = active.record?.id
  const id = originalId ?? crypto.randomUUID()

  editorError.value = save((draft) => {
    if (active.kind === 'profile' && data.kind === 'profile') {
      if (originalId) {
        const car = draft.cars.find((car) => car.id === originalId)
        if (!car) throw new RecordMissingError()
        Object.assign(car, data.value)
      } else {
        draft.cars.push({ ...data.value, id, notes: [], entries: [], oilChanges: [] })
        draft.primaryCarId ??= id
      }
      return
    }

    if (active.kind === 'profile') return
    const car = draft.cars.find((car) => car.id === active.carId)
    if (!car) throw new RecordMissingError()
    if (data.kind === 'entry') replace(car.entries, originalId, { ...data.value, id })
    if (data.kind === 'note') replace(car.notes, originalId, { ...data.value, id })
    if (data.kind === 'oil') replace(car.oilChanges, originalId, { ...data.value, id })
  })

  if (editorError.value) return
  close()
  if (data.kind === 'profile' && !originalId) {
    const added = garage.value.cars.find((car) => car.id === id)
    if (added) openCar(added)
  }
}

function remove<T extends { id: string }>(records: T[], id: string) {
  const index = records.findIndex((record) => record.id === id)
  if (index < 0) throw new RecordMissingError()
  records.splice(index, 1)
}

function removeEditor(replacement: string) {
  const active = editor.value
  const id = active?.record?.id
  if (!active || !id) return

  editorError.value = save((draft) => {
    if (active.kind === 'profile') {
      remove(draft.cars, id)
      if (draft.primaryCarId === id) {
        if (draft.cars.length && !draft.cars.some((car) => car.id === replacement)) throw new RecordMissingError()
        draft.primaryCarId = draft.cars.length ? replacement : null
      }
      return
    }

    const car = draft.cars.find((car) => car.id === active.carId)
    if (!car) throw new RecordMissingError()
    if (active.kind === 'entry') remove(car.entries, id)
    if (active.kind === 'note') remove(car.notes, id)
    if (active.kind === 'oil') remove(car.oilChanges, id)
  })

  if (editorError.value) return
  close()
  if (active.kind === 'profile' && viewedId.value === id) viewedId.value = null
}
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="frame topbar-inner">
        <div class="brand"><span class="brand-mark" aria-hidden="true"></span><span>Мой гараж</span></div>
        <button v-if="current" type="button" class="vehicle-switch" aria-label="Открыть гараж" @click="show('garage')">
          <span class="vehicle-switch-text"><strong>{{ profileName(current) }}</strong><span>{{ current.id === garage.primaryCarId ? 'Главное авто' : 'Просмотр профиля' }}</span></span>
          <span class="switch-chevron" aria-hidden="true"></span>
        </button>
      </div>
    </header>

    <main class="frame main-content" id="main-content">
      <div v-if="loadError" class="error-panel" role="alert">
        <p>{{ loadError }}</p>
        <button class="button button-secondary" type="button" @click="reload">Повторить</button>
      </div>
      <p v-if="pageError && !loadError" class="error-message page-error" role="alert">{{ pageError }}</p>

      <template v-if="!loadError">
        <section v-if="!current" class="welcome" aria-labelledby="welcome-title">
          <div class="welcome-mark brand-mark" aria-hidden="true"></div>
          <h1 id="welcome-title">Добавьте автомобиль</h1>
          <p>Ведите журнал расходов, храните историю замен масла и полезные сведения об авто.</p>
          <div class="welcome-actions">
            <button type="button" class="button button-primary" @click="open({ kind: 'profile' })"><span class="plus" aria-hidden="true">+</span> Добавить авто</button>
            <button type="button" class="button button-secondary" @click="addDemo">Добавить демо-авто</button>
          </div>
        </section>

        <template v-else>
          <div v-if="current.demo && page !== 'garage'" class="demo-notice">
            <strong>Демо-профиль</strong><span>Расходы и история обслуживания приведены для примера.</span>
          </div>

          <ExpensesView v-if="page === 'expenses'" :key="current.id" :car="current" @add="editEntry" @edit="editEntry($event.kind, $event)" />
          <VehicleView v-else-if="page === 'vehicle'" :car="current" @edit="open({ kind: 'profile', record: current })" @note="editNote" @oil="editOil" />

          <div v-else class="page-stack">
            <div class="page-heading">
              <h1>Гараж</h1>
              <button type="button" class="button button-primary" @click="open({ kind: 'profile' })"><span class="plus" aria-hidden="true">+</span> Добавить авто</button>
            </div>
            <ul class="garage-list">
              <li v-for="car in garage.cars" :key="car.id" class="garage-card">
                <div class="garage-card-info">
                  <h2>{{ profileName(car) }}</h2>
                  <p v-if="car.name || car.year">{{ [car.name ? vehicleName(car) : '', car.year].filter(Boolean).join(' · ') }}</p>
                  <div v-if="car.id === garage.primaryCarId || car.demo" class="garage-labels">
                    <span v-if="car.id === garage.primaryCarId" class="garage-label">Главное авто</span>
                    <span v-if="car.demo" class="garage-label demo-label">Демо</span>
                  </div>
                </div>
                <div class="garage-actions">
                  <button type="button" class="button button-secondary" @click="openCar(car)">Открыть</button>
                  <button type="button" class="button button-quiet" @click="open({ kind: 'profile', record: car })">Редактировать</button>
                  <button v-if="car.id !== garage.primaryCarId" type="button" class="button button-quiet" @click="makePrimary(car)">Сделать главным</button>
                </div>
              </li>
            </ul>
            <div><button type="button" class="button button-secondary" @click="addDemo">{{ demo ? 'Открыть демо-авто' : 'Добавить демо-авто' }}</button></div>
          </div>
        </template>
      </template>
    </main>

    <nav v-if="current && !loadError" class="bottom-nav" aria-label="Основные разделы">
      <div class="frame nav-inner">
        <button type="button" :aria-current="page === 'expenses' ? 'page' : undefined" @click="show('expenses')"><span class="nav-icon icon-expenses" aria-hidden="true"></span>Траты</button>
        <button type="button" :aria-current="page === 'vehicle' ? 'page' : undefined" @click="show('vehicle')"><span class="nav-icon icon-vehicle" aria-hidden="true"></span>Авто</button>
      </div>
    </nav>

    <EditorDialog v-if="editor" :editor="editor" :error="editorError" :cars="garage.cars" :primary-car-id="garage.primaryCarId"
      @close="close" @save="saveEditor" @remove="removeEditor" @clear-error="editorError = ''" />
  </div>
</template>
