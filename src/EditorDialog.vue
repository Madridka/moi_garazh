<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { categories, formatNumber, isValidDate, parseMoney, parseOdometer, profileName, today } from './domain'
import type { Car, Category, Entry } from './domain'
import type { Editor, EditorValue } from './editor'

const props = defineProps<{
  editor: Editor
  error: string
  primaryCarId: string | null
  cars: Car[]
}>()

const emit = defineEmits<{
  close: []
  save: [data: EditorValue]
  remove: [replacement: string]
  clearError: []
}>()

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
  entryKind: (entry?.kind ?? (active.kind === 'entry' ? active.initialKind : 'expense')) as Entry['kind'],
})

const localError = ref('')
const confirming = ref(false)
const replacement = ref('')
const alternatives = computed(() => props.cars.filter((car) => car.id !== profile?.id))
const needsReplacement = computed(() =>
  Boolean(profile && profile.id === props.primaryCarId && alternatives.value.length),
)

const headings = {
  profile: ['Новый автомобиль', 'Редактировать автомобиль'],
  entry: ['Новая запись', 'Редактировать запись'],
  note: ['Новое поле', 'Редактировать поле'],
  oil: ['Замена масла', 'Редактировать замену масла'],
}

const title = computed(() => confirming.value
  ? (profile ? 'Удалить автомобиль?' : 'Удалить запись?')
  : headings[active.kind][active.record ? 1 : 0],
)

const litres = computed(() => {
  const amount = parseMoney(draft.amount)
  const price = parseMoney(draft.litrePrice)
  return amount !== null && price !== null ? amount / price : null
})

function clearError() {
  localError.value = ''
  emit('clearError')
}

function setConfirm(value: boolean) {
  clearError()
  replacement.value = ''
  confirming.value = value
}

function save() {
  clearError()
  if (confirming.value) {
    if (needsReplacement.value && !alternatives.value.some((car) => car.id === replacement.value)) {
      localError.value = 'Выберите новый главный автомобиль.'
      return
    }
    emit('remove', replacement.value)
    return
  }

  if (active.kind === 'profile') {
    const { make, model, name, year, plate, vehicleNumber, calculateFuel } = draft
    if (!make.trim() || !model.trim()) {
      localError.value = 'Укажите марку и модель.'
      return
    }
    if (year.trim() && !/^\d{4}$/.test(year.trim())) {
      localError.value = 'Введите год четырьмя цифрами.'
      return
    }
    emit('save', { kind: 'profile', value: {
      make: make.trim(), model: model.trim(), name: name.trim(), year: year.trim(),
      plate: plate.trim(), vehicleNumber: vehicleNumber.trim(), calculateFuel,
    } })
    return
  }

  if (active.kind === 'note') {
    if (!draft.title.trim()) {
      localError.value = 'Укажите название поля.'
      return
    }
    emit('save', { kind: 'note', value: { title: draft.title.trim(), value: draft.value.trim() } })
    return
  }

  const odometer = parseOdometer(draft.odometer)
  if (odometer === null) {
    localError.value = 'Введите пробег целым неотрицательным числом.'
    return
  }

  if (!isValidDate(draft.date)) {
    localError.value = 'Укажите календарную дату.'
    return
  }
  const common = { date: draft.date, odometer, comment: draft.comment.trim() }
  if (active.kind === 'oil') {
    if (!draft.oil.trim()) {
      localError.value = 'Укажите название или вязкость масла.'
      return
    }
    emit('save', { kind: 'oil', value: { ...common, oil: draft.oil.trim() } })
    return
  }

  const amount = parseMoney(draft.amount)
  if (amount === null) {
    localError.value = 'Введите сумму больше нуля, до двух знаков после запятой.'
    return
  }

  if (draft.entryKind === 'expense') {
    emit('save', { kind: 'entry', value: { ...common, kind: 'expense', amount, category: draft.category } })
    return
  }

  const litrePrice = parseMoney(draft.litrePrice)
  if (litrePrice === null) {
    localError.value = 'Введите цену за литр больше нуля, до двух знаков после запятой.'
    return
  }
  emit('save', { kind: 'entry', value: { ...common, kind: 'fuel', amount, litrePrice, fullTank: draft.fullTank } })
}
</script>

<template>
  <dialog ref="dialog" class="editor" aria-labelledby="editor-title" @cancel.prevent="emit('close')">
    <form class="editor-form" @submit.prevent="save" @input="clearError">
      <header class="editor-header">
        <h2 id="editor-title">{{ title }}</h2>
        <button type="button" class="close-button" aria-label="Закрыть" @click="emit('close')">×</button>
      </header>

      <div class="editor-fields">
        <template v-if="confirming">
          <p v-if="profile">Профиль «{{ profileName(profile) }}» и все его записи будут удалены.</p>
          <p v-else>Запись будет удалена из истории автомобиля.</p>
          <label v-if="needsReplacement">Новый главный автомобиль
            <select v-model="replacement" required>
              <option disabled value="">Выберите автомобиль</option>
              <option v-for="car in alternatives" :key="car.id" :value="car.id">{{ profileName(car) }}</option>
            </select>
          </label>
        </template>

        <template v-else-if="active.kind === 'profile'">
          <div class="field-pair">
            <label>Марка<input v-model="draft.make" required placeholder="Toyota" /></label>
            <label>Модель<input v-model="draft.model" required placeholder="Aqua" /></label>
          </div>
          <label>Название профиля<input v-model="draft.name" /></label>
          <div class="field-pair">
            <label>Год выпуска<input v-model="draft.year" inputmode="numeric" maxlength="4" placeholder="2017" /></label>
            <label>Госномер<input v-model="draft.plate" autocapitalize="characters" /></label>
          </div>
          <label>VIN / номер кузова<input v-model="draft.vehicleNumber" autocapitalize="characters" spellcheck="false" placeholder="NHP10-0000000" /></label>
          <label class="check-field"><input v-model="draft.calculateFuel" type="checkbox" /><span>Показывать расход топлива</span></label>
        </template>

        <template v-else-if="active.kind === 'note'">
          <label>Название поля<input v-model="draft.title" required placeholder="Дворники" /></label>
          <label>Значение<textarea v-model="draft.value" rows="4" placeholder="650 мм / 400 мм" /></label>
        </template>

        <template v-else>
          <fieldset v-if="active.kind === 'entry'" class="record-types">
            <legend class="visually-hidden">Тип записи</legend>
            <label><input v-model="draft.entryKind" type="radio" value="expense" /><span>Трата</span></label>
            <label><input v-model="draft.entryKind" type="radio" value="fuel" /><span>Заправка</span></label>
          </fieldset>
          <label v-if="active.kind === 'oil'">Масло<input v-model="draft.oil" required placeholder="0W-20" /></label>
          <div class="field-pair">
            <label>Дата<input v-model="draft.date" type="date" required /></label>
            <label>Пробег, км<input v-model="draft.odometer" inputmode="numeric" required /></label>
          </div>
          <template v-if="active.kind === 'entry'">
            <div class="field-pair">
              <label>Сумма, ₽<input v-model="draft.amount" inputmode="decimal" required /></label>
              <label v-if="draft.entryKind === 'expense'">Категория
                <select v-model="draft.category">
                  <option v-for="category in categories" :key="category">{{ category }}</option>
                </select>
              </label>
              <label v-else>Цена за литр, ₽<input v-model="draft.litrePrice" inputmode="decimal" required /></label>
            </div>
            <template v-if="draft.entryKind === 'fuel'">
              <p v-if="litres !== null" class="field-hint">Объём заправки · {{ formatNumber(litres) }} л</p>
              <label class="check-field"><input v-model="draft.fullTank" type="checkbox" /><span>Полный бак</span></label>
            </template>
          </template>
          <label>Комментарий<textarea v-model="draft.comment" rows="3" /></label>
        </template>

        <p v-if="localError || error" class="error-message" role="alert">{{ localError || error }}</p>
      </div>

      <footer class="editor-actions">
        <button v-if="confirming" type="button" class="button button-secondary" @click="setConfirm(false)">Назад</button>
        <button v-else-if="active.record" type="button" class="button button-quiet danger-text" @click="setConfirm(true)">Удалить</button>
        <button type="submit" class="button" :class="confirming ? 'button-danger' : 'button-primary'">
          {{ confirming ? 'Удалить' : 'Сохранить' }}
        </button>
      </footer>
    </form>
  </dialog>
</template>
