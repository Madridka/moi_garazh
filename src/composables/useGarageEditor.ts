import { computed, shallowRef } from 'vue'
import type { Editor, EditorValue } from '@/stores/garage/editor.types'
import { useGarageStore } from '@/stores/garage/garage'
import type { Entry, GarageError, Note, OilChange } from '@/stores/garage/types'

export const useGarageEditor = () => {
  const store = useGarageStore()
  const editor = shallowRef<Editor | null>(null)
  const editorError = shallowRef<GarageError | null>(null)
  const editorBlocked = computed(() => editorError.value !== null && editorError.value !== 'save')

  const open = (next: Editor) => {
    editorError.value = null
    editor.value = next
  }

  const close = () => {
    editor.value = null
    editorError.value = null
  }

  const clearError = () => {
    if (!editorBlocked.value) editorError.value = null
  }

  const editEntry = (carId: string, kind: Entry['kind'], record?: Entry) =>
    open({ kind: 'entry', carId, initialKind: kind, record })

  const editNote = (carId: string, record?: Note) => open({ kind: 'note', carId, record })
  const editOil = (carId: string, record?: OilChange) => open({ kind: 'oil', carId, record })

  const saveEditor = (data: EditorValue): string | undefined => {
    const active = editor.value
    if (!active || active.kind !== data.kind || editorBlocked.value) return
    const { error, addedCarId } = store.saveRecord(active, data)
    editorError.value = error
    if (error) return
    close()
    return addedCarId
  }

  const removeEditor = (replacement: string) => {
    const active = editor.value
    if (!active || !active.record || editorBlocked.value) return
    editorError.value = store.removeRecord(active, replacement)
    if (!editorError.value) close()
  }

  return { editor, editorError, editorBlocked, open, close, clearError, editEntry, editNote, editOil, saveEditor, removeEditor }
}
