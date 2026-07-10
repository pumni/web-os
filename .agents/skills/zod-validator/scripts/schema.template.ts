// schema.template.ts — Copy to packages/validators/src/<domain>/<name>.ts
// See .agents/skills/zod-validator/SKILL.md for full authoring rules.
import { z } from 'zod/v4'

// -- Schema --------------------------------------------------------------------
export const __NameSchema = z.object({
  // TODO: define fields
  // id: z.string().uuid(),
  // label: z.string().min(1).max(255),
})

// -- Inferred types (single source of truth — do NOT duplicate manually) -------
export type __NameInput  = z.input<typeof __NameSchema>
export type __NameOutput = z.output<typeof __NameSchema>

// -- Partial (for update payloads) ---------------------------------------------
export const __NameUpdateSchema = __NameSchema.partial().required({ id: true })
export type __NameUpdate = z.input<typeof __NameUpdateSchema>
