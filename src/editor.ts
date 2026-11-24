import type { Car, Entry, Note, OilChange, Profile } from './domain'

export type Editor =
  | { kind: 'profile'; record?: Car }
  | { kind: 'entry'; carId: string; record?: Entry; initialKind: Entry['kind'] }
  | { kind: 'note'; carId: string; record?: Note }
  | { kind: 'oil'; carId: string; record?: OilChange }

export type EditorValue =
  | { kind: 'profile'; value: Profile }
  | { kind: 'entry'; value: Omit<Extract<Entry, { kind: 'expense' }>, 'id'> | Omit<Extract<Entry, { kind: 'fuel' }>, 'id'> }
  | { kind: 'note'; value: Omit<Note, 'id'> }
  | { kind: 'oil'; value: Omit<OilChange, 'id'> }
