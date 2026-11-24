<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGarageFormat } from '@/composables/useGarageFormat'
import type { Editor, EditorValue } from '@/stores/garage/editor.types'
import { isValidDate, parseMoney, parseOdometer, profileName, today } from '@/stores/garage/methods'
import { categories } from '@/stores/garage/types'
import type { Car, Category, Entry } from '@/stores/garage/types'

import Button from 'primevue/button'

const props = defineProps<{
  editor: Editor
  error: string
  blocked: boolean
  primaryCarId: string | null
  cars: Car[]
}>()

const emit = defineEmits<{
  close: []
  save: [data: EditorValue]
  remove: [replacement: string]
  clearError: []
}>()

const { t } = useI18n()
const { formatCategory, formatLitres } = useGarageFormat()
const dialog = ref<HTMLDialogElement | null>(null)
onMounted(() => dialog.value?.showModal())
onBeforeUnmount(() => dialog.value?.close())

const active = props.editor
const profile = active.kind === 'profile' ? active.record : undefined
const entry = active.kind === 'entry' ? active.record : undefined
const note = active.kind === 'note' ? active.record : undefined
const oil = active.kind === 'oil' ? active.record : undefined
const draft = reactive({
  make: profile?.make ?? '',
  model: profile?.model ?? '',
  name: profile?.name ?? '',
  year: profile?.year ?? '',
  plate: profile?.plate ?? '',
  vehicleNumber: profile?.vehicleNumber ?? '',
  calculateFuel: profile?.calculateFuel ?? false,
  title: note?.title ?? '',
  value: note?.value ?? '',
  oil: oil?.oil ?? '',
  date: entry?.date ?? oil?.date ?? today(),
  odometer: String(entry?.odometer ?? oil?.odometer ?? ''),
  amount: entry ? String(entry.amount / 100) : '',
  litrePrice: entry?.kind === 'fuel' ? String(entry.litrePrice / 100) : '',
  fullTank: entry?.kind === 'fuel' ? entry.fullTank : false,
  category: (entry?.kind === 'expense' ? entry.category : categories[0]) as Category,
  comment: entry?.comment ?? oil?.comment ?? '',
  entryKind: (entry?.kind ??
    (active.kind === 'entry' ? active.initialKind : 'expense')) as Entry['kind'],
})

const localError = ref('')
const confirming = ref(false)
const replacement = ref('')
const alternatives = computed(() => props.cars.filter((car) => car.id !== profile?.id))
const needsReplacement = computed(() =>
  Boolean(profile && profile.id === props.primaryCarId && alternatives.value.length),
)

const title = computed(() =>
  t(
    confirming.value
      ? profile
        ? 'editor.removeCar'
        : 'editor.removeRecord'
      : `editor.heading.${active.kind}.${active.record ? 'edit' : 'create'}`,
  ),
)

const litres = computed(() => {
  const amount = parseMoney(draft.amount)
  const price = parseMoney(draft.litrePrice)
  return amount !== null && price !== null ? amount / price : null
})

const clearError = () => {
  localError.value = ''
  emit('clearError')
}

const setConfirm = (value: boolean) => {
  clearError()
  replacement.value = ''
  confirming.value = value
}

const save = () => {
  if (props.blocked) return
  clearError()
  if (confirming.value) {
    if (needsReplacement.value && !alternatives.value.some((car) => car.id === replacement.value)) {
      localError.value = t('editor.validation.replacement')
      return
    }
    emit('remove', replacement.value)
    return
  }

  if (active.kind === 'profile') {
    const { make, model, name, year, plate, vehicleNumber, calculateFuel } = draft
    if (!make.trim() || !model.trim()) {
      localError.value = t('editor.validation.makeModel')
      return
    }
    if (year.trim() && !/^\d{4}$/.test(year.trim())) {
      localError.value = t('editor.validation.year')
      return
    }
    emit('save', {
      kind: 'profile',
      value: {
        make: make.trim(),
        model: model.trim(),
        name: name.trim(),
        year: year.trim(),
        plate: plate.trim(),
        vehicleNumber: vehicleNumber.trim(),
        calculateFuel,
      },
    })
    return
  }

  if (active.kind === 'note') {
    if (!draft.title.trim()) {
      localError.value = t('editor.validation.noteTitle')
      return
    }
    emit('save', { kind: 'note', value: { title: draft.title.trim(), value: draft.value.trim() } })
    return
  }

  const odometer = parseOdometer(draft.odometer)
  if (odometer === null) {
    localError.value = t('editor.validation.odometer')
    return
  }

  if (!isValidDate(draft.date)) {
    localError.value = t('editor.validation.date')
    return
  }
  const common = { date: draft.date, odometer, comment: draft.comment.trim() }
  if (active.kind === 'oil') {
    if (!draft.oil.trim()) {
      localError.value = t('editor.validation.oil')
      return
    }
    emit('save', { kind: 'oil', value: { ...common, oil: draft.oil.trim() } })
    return
  }

  const amount = parseMoney(draft.amount)
  if (amount === null) {
    localError.value = t('editor.validation.amount')
    return
  }

  if (draft.entryKind === 'expense') {
    emit('save', {
      kind: 'entry',
      value: { ...common, kind: 'expense', amount, category: draft.category },
    })
    return
  }

  const litrePrice = parseMoney(draft.litrePrice)
  if (litrePrice === null) {
    localError.value = t('editor.validation.litrePrice')
    return
  }
  emit('save', {
    kind: 'entry',
    value: { ...common, kind: 'fuel', amount, litrePrice, fullTank: draft.fullTank },
  })
}
</script>

<template>
  <dialog
    ref="dialog"
    class="editor"
    aria-labelledby="editor-title"
    @cancel.prevent="emit('close')"
  >
    <form class="editor-form" novalidate @submit.prevent="save" @input="clearError">
      <header class="editor-header">
        <h2 id="editor-title">{{ title }}</h2>
        <Button
          type="button"
          class="close-button"
          icon="pi pi-times"
          :aria-label="t('common.close')"
          @click="emit('close')"
        />
      </header>

      <div class="editor-fields">
        <template v-if="confirming">
          <p v-if="profile">{{ t('editor.removeCarHint', { car: profileName(profile) }) }}</p>
          <p v-else>{{ t('editor.removeRecordHint') }}</p>
          <label v-if="needsReplacement"
            ><span
              >{{ t('editor.replacement') }}
              <span class="required-mark" aria-hidden="true">*</span></span
            >
            <select v-model="replacement" required>
              <option disabled value="">{{ t('editor.selectCar') }}</option>
              <option v-for="car in alternatives" :key="car.id" :value="car.id">
                {{ profileName(car) }}
              </option>
            </select>
          </label>
        </template>

        <template v-else-if="active.kind === 'profile'">
          <div class="field-pair">
            <label
              ><span
                >{{ t('vehicle.make') }}
                <span class="required-mark" aria-hidden="true">*</span></span
              ><input v-model="draft.make" required placeholder="Toyota"
            /></label>
            <label
              ><span
                >{{ t('vehicle.model') }}
                <span class="required-mark" aria-hidden="true">*</span></span
              ><input v-model="draft.model" required placeholder="Aqua"
            /></label>
          </div>
          <label>{{ t('vehicle.name') }}<input v-model="draft.name" /></label>
          <div class="field-pair">
            <label
              >{{ t('vehicle.year')
              }}<input v-model="draft.year" inputmode="numeric" maxlength="4" placeholder="2017"
            /></label>
            <label
              >{{ t('vehicle.plate') }}<input v-model="draft.plate" autocapitalize="characters"
            /></label>
          </div>
          <label
            >{{ t('vehicle.vehicleNumber')
            }}<input
              v-model="draft.vehicleNumber"
              autocapitalize="characters"
              spellcheck="false"
              placeholder="NHP10-0000000"
          /></label>
          <label class="check-field"
            ><input v-model="draft.calculateFuel" type="checkbox" /><span>{{
              t('vehicle.calculateFuelToggle')
            }}</span></label
          >
        </template>

        <template v-else-if="active.kind === 'note'">
          <label
            ><span
              >{{ t('editor.noteTitle') }}
              <span class="required-mark" aria-hidden="true">*</span></span
            ><input v-model="draft.title" required :placeholder="t('editor.noteExample')"
          /></label>
          <label
            >{{ t('editor.noteValue')
            }}<textarea v-model="draft.value" rows="4" :placeholder="t('editor.valueExample')" />
          </label>
        </template>

        <template v-else>
          <fieldset v-if="active.kind === 'entry'" class="record-types">
            <legend class="visually-hidden">{{ t('editor.entryKind') }}</legend>
            <label
              ><input v-model="draft.entryKind" type="radio" value="expense" /><span>{{
                t('journal.expenseEntry')
              }}</span></label
            >
            <label
              ><input v-model="draft.entryKind" type="radio" value="fuel" /><span>{{
                t('journal.fuelEntry')
              }}</span></label
            >
          </fieldset>
          <label v-if="active.kind === 'oil'"
            ><span
              >{{ t('vehicle.oil') }} <span class="required-mark" aria-hidden="true">*</span></span
            ><input v-model="draft.oil" required placeholder="0W-20"
          /></label>
          <div class="field-pair">
            <label
              ><span
                >{{ t('editor.date') }}
                <span class="required-mark" aria-hidden="true">*</span></span
              ><input v-model="draft.date" type="date" required
            /></label>
            <label
              ><span
                >{{ t('editor.odometer') }}
                <span class="required-mark" aria-hidden="true">*</span></span
              ><input v-model="draft.odometer" inputmode="numeric" required
            /></label>
          </div>
          <template v-if="active.kind === 'entry'">
            <div class="field-pair">
              <label
                ><span
                  >{{ t('editor.amount') }}
                  <span class="required-mark" aria-hidden="true">*</span></span
                ><input v-model="draft.amount" inputmode="decimal" required
              /></label>
              <label v-if="draft.entryKind === 'expense'"
                >{{ t('editor.category') }}
                <select v-model="draft.category">
                  <option v-for="category in categories" :key="category" :value="category">
                    {{ formatCategory(category) }}
                  </option>
                </select>
              </label>
              <label v-else
                ><span
                  >{{ t('editor.litrePrice') }}
                  <span class="required-mark" aria-hidden="true">*</span></span
                ><input v-model="draft.litrePrice" inputmode="decimal" required
              /></label>
            </div>
            <template v-if="draft.entryKind === 'fuel'">
              <p v-if="litres !== null" class="muted">
                {{ t('editor.fuelVolume', { volume: formatLitres(litres) }) }}
              </p>
              <label class="check-field"
                ><input v-model="draft.fullTank" type="checkbox" /><span>{{
                  t('journal.fullTank')
                }}</span></label
              >
            </template>
          </template>
          <label>{{ t('editor.comment') }}<textarea v-model="draft.comment" rows="3" /></label>
        </template>

        <p v-if="localError || error" class="error-message" role="alert">
          {{ localError || error }}
        </p>
      </div>

      <footer class="editor-actions">
        <Button
          v-if="confirming"
          type="button"
          class="button button-secondary"
          :label="t('common.back')"
          @click="setConfirm(false)"
        />
        <Button
          v-else-if="active.record && !profile?.demo"
          type="button"
          class="button button-quiet danger-text"
          :disabled="blocked"
          :label="t('common.remove')"
          @click="setConfirm(true)"
        />
        <Button
          type="submit"
          class="button"
          :class="confirming ? 'button-danger' : 'button-primary'"
          :disabled="blocked"
          :label="t(confirming ? 'common.remove' : 'common.save')"
        />
      </footer>
    </form>
  </dialog>
</template>

<style scoped src="@/assets/editor.css"></style>
