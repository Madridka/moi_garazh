<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useGarageStore } from '@/stores/garage/garage'
import { useGarageEditor } from '@/composables/useGarageEditor'
import type { EditorValue } from '@/stores/garage/editor.types'
import { profileName } from '@/stores/garage/methods'
import type { Car, Entry, Note, OilChange } from '@/stores/garage/types'

import Button from 'primevue/button'

import EditorDialog from '@/components/EditorDialog.vue'
import GarageView from '@/views/GarageView.vue'
import HomeView from '@/views/HomeView.vue'
import JournalView from '@/views/JournalView.vue'
import VehicleView from '@/views/VehicleView.vue'

const navigation = [
  { page: 'home', label: 'home.title', icon: 'pi pi-home' },
  { page: 'journal', label: 'journal.title', icon: 'pi pi-wallet' },
  { page: 'vehicle', label: 'vehicle.title', icon: 'pi pi-car' },
] as const
type Page = (typeof navigation)[number]['page'] | 'garage'

const { t } = useI18n()
const store = useGarageStore()
const { garage, loadError } = storeToRefs(store)
const { editor, editorError, editorBlocked, open, close, clearError, editEntry, editNote, editOil, saveEditor, removeEditor } = useGarageEditor()
const page = ref<Page>('home')
const viewedId = ref<string | null>(null)
const pageError = ref<ReturnType<typeof store.makePrimary>>(null)
const main = ref<HTMLElement | null>(null)
const current = computed(() => garage.value.cars.find(({ id }) => id === viewedId.value)
  ?? garage.value.cars.find(({ id }) => id === garage.value.primaryCarId))

watch(page, () => {
  main.value?.focus({ preventScroll: true })
  window.scrollTo(0, 0)
}, { flush: 'post' })

const show = (next: Page) => {
  if (next === page.value) return
  pageError.value = null
  page.value = next
}

const openCar = (carId: string) => {
  viewedId.value = carId === garage.value.primaryCarId ? null : carId
  show('home')
}

const makePrimary = (car: Car) => {
  pageError.value = store.makePrimary(car.id)
  if (!pageError.value && viewedId.value === car.id) viewedId.value = null
}

const editProfile = (record?: Car) => {
  pageError.value = null
  open({ kind: 'profile', record })
}

const addEntry = (kind: Entry['kind'] = 'expense') => {
  if (current.value) editEntry(current.value.id, kind)
}

const editJournalEntry = (entry: Entry) => {
  if (current.value) editEntry(current.value.id, entry.kind, entry)
}

const openNoteEditor = (note?: Note) => {
  if (current.value) editNote(current.value.id, note)
}

const openOilEditor = (record?: OilChange) => {
  if (current.value) editOil(current.value.id, record)
}

const commitEditor = (data: EditorValue) => {
  const addedCarId = saveEditor(data)
  if (addedCarId) openCar(addedCarId)
}

const deleteRecord = (replacement: string) => {
  const active = editor.value
  removeEditor(replacement)
  if (!editor.value && active?.kind === 'profile' && viewedId.value === active.record?.id) viewedId.value = null
}
</script>

<template>
  <a class="skip-link" href="#main-content">{{ t('app.skip') }}</a>
  <header class="topbar">
    <div class="frame topbar-inner">
      <Button class="brand" type="button" @click="show('home')">
        <span class="brand-icon pi pi-car" aria-hidden="true"></span>
        <span>{{ t('app.title') }}</span>
      </Button>
      <Button v-if="current && !loadError" class="vehicle-switch" type="button"
        :aria-label="t('garage.open', { car: profileName(current) })" @click="show('garage')">
        <span class="switch-name">{{ profileName(current) }}</span>
        <span v-if="current.demo" class="badge">{{ t('garage.demo') }}</span>
        <span class="pi pi-angle-down" aria-hidden="true"></span>
      </Button>
    </div>
  </header>

  <main id="main-content" ref="main" class="frame main-content" tabindex="-1">
    <div v-if="loadError" class="error-panel" role="alert">
      <p>{{ t(`storage.${loadError}`) }}</p>
      <Button class="button button-secondary" type="button" :label="t('common.retry')" @click="store.reload()" />
    </div>
    <template v-else-if="current">
      <p v-if="pageError" class="error-message page-error" role="alert">{{ t(`storage.${pageError}`) }}</p>
      <HomeView v-if="page === 'home'" :car="current" @add="addEntry()" @journal="show('journal')" />
      <JournalView v-else-if="page === 'journal'" :key="current.id" :car="current" @add="addEntry" @edit="editJournalEntry" />
      <VehicleView v-else-if="page === 'vehicle'" :car="current" @edit="editProfile(current)"
        @note="openNoteEditor" @oil="openOilEditor" />
      <GarageView v-else :cars="garage.cars" :primary-car-id="garage.primaryCarId"
        @add="editProfile()" @select="openCar($event.id)" @edit="editProfile" @primary="makePrimary" />
    </template>
  </main>

  <nav v-if="current && !loadError" class="bottom-nav" :aria-label="t('app.navigation')">
    <div class="frame nav-inner">
      <Button v-for="item in navigation" :key="item.page" type="button" class="nav-button"
        :aria-current="page === item.page ? 'page' : undefined" @click="show(item.page)">
        <span :class="item.icon" aria-hidden="true"></span>
        <span>{{ t(item.label) }}</span>
      </Button>
    </div>
  </nav>

  <EditorDialog v-if="editor" :editor="editor" :blocked="editorBlocked" :cars="garage.cars"
    :primary-car-id="garage.primaryCarId"
    :error="editorError ? t(editorError === 'conflict' ? 'storage.editorConflict' : `storage.${editorError}`) : ''"
    @close="close" @save="commitEditor" @remove="deleteRecord" @clear-error="clearError" />
</template>
