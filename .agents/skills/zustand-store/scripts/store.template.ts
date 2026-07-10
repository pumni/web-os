// store.template.ts — Copy to apps/web/src/shared/stores/<name>-store.ts
//   OR features/<feature>/<name>-store.ts (feature-local, not promoted).
// See .agents/skills/zustand-store/SKILL.md for scoping rules.
//
// RULE: Zustand holds CLIENT UI STATE ONLY.
//       Never mirror server/TanStack Query data here.
'use client'

import { create } from 'zustand'

// -- State shape ----------------------------------------------------------------
interface __NameState {
  // TODO: add UI-only state (open/closed, selected id, draft text…)
  isOpen: boolean
  selectedId: string | null
}

// -- Actions --------------------------------------------------------------------
interface __NameActions {
  open:   () => void
  close:  () => void
  select: (id: string | null) => void
  reset:  () => void
}

const INITIAL: __NameState = {
  isOpen:     false,
  selectedId: null,
}

// -- Store ----------------------------------------------------------------------
export const use__NameStore = create<__NameState & __NameActions>()((set) => ({
  ...INITIAL,
  open:   () => set({ isOpen: true }),
  close:  () => set({ isOpen: false }),
  select: (id) => set({ selectedId: id }),
  reset:  () => set(INITIAL),
}))
