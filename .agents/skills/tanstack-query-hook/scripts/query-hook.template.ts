// query-hook.template.ts — Copy to features/<feature>/use-<name>.ts
// See .agents/skills/tanstack-query-hook/SKILL.md for full wiring rules.
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createBrowserClient } from '@pumni/supabase/browser'

// -- Query keys (co-locate with the hook, promote to queryKeys.ts if shared) --
const QUERY_KEYS = {
  all: ['__resource'] as const,
  detail: (id: string) => ['__resource', id] as const,
}

// -- Read ----------------------------------------------------------------------
export function use__Resource(id: string) {
  const supabase = createBrowserClient()

  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('__table')
        .select('id, /* TODO fields */')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },
  })
}

// -- Mutation ------------------------------------------------------------------
export function useUpdate__Resource() {
  const queryClient = useQueryClient()
  const supabase = createBrowserClient()

  return useMutation({
    mutationFn: async (payload: { id: string /* TODO */ }) => {
      const { error } = await supabase
        .from('__table')
        .update({ /* TODO */ })
        .eq('id', payload.id)
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(variables.id) })
    },
  })
}
