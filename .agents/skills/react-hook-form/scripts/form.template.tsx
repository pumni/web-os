// form.template.tsx — Copy to features/<feature>/<name>-form.tsx
// See .agents/skills/react-hook-form/SKILL.md for full wiring rules.
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useActionState } from 'react'
import { /* TODO: import schema */ __FormSchema, type __FormInput } from '@pumni/validators'
import { /* TODO: import action */ __saveAction } from '../actions'
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@pumni/ui/form'
import { Input } from '@pumni/ui/input'
import { Button } from '@pumni/ui/button'

export function __NameForm() {
  const form = useForm<__FormInput>({
    resolver: zodResolver(__FormSchema),
    defaultValues: { /* TODO */ },
  })

  const [actionState, dispatch, isPending] = useActionState(__saveAction, null)

  return (
    <Form {...form}>
      <form action={dispatch} className="space-y-4">
        <FormField
          control={form.control}
          name="/* TODO field name */"
          render={({ field }) => (
            <FormItem>
              <FormLabel>/* TODO label */</FormLabel>
              <FormControl>
                <Input {...field} disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {actionState?.error && (
          <p className="text-sm text-destructive">{actionState.error}</p>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save'}
        </Button>
      </form>
    </Form>
  )
}
