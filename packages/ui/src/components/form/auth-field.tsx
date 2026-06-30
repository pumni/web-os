import type { ComponentProps, ReactNode } from 'react';

import { cn } from '../../lib/cn';
import { Input } from './input';
import { Label } from './label';

/**
 * Labeled form field for server-action–driven pages (useActionState).
 *
 * Renders Label + Input + optional error message. Not tied to react-hook-form —
 * errors come from `string[]` (Zod fieldErrors), matching the AuthFormState
 * convention used by the auth server actions.
 */
function AuthField({
  id,
  label,
  name,
  error,
  trailing,
  disabled,
  children,
  className,
  ...inputProps
}: Omit<ComponentProps<typeof Input>, 'id'> & {
  /** Maps to both Label.htmlFor and Input.id. */
  id: string;
  /** Human-readable label text. */
  label: string;
  /** Maps to Input.name (defaults to id). */
  name?: string;
  /** Zod fieldErrors array — shows the first message. */
  error?: string[];
  /** Content rendered between the label and input row (e.g. a "Forgot password?" link). */
  trailing?: ReactNode;
  /** Additional children rendered after the error message. */
  children?: ReactNode;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {trailing}
      </div>
      <Input
        id={id}
        name={name ?? id}
        disabled={disabled}
        // Spread consumer props first so the error-driven `aria-invalid` below
        // wins (computed last). Passing `aria-invalid={undefined}` still lets a
        // consumer opt out.
        {...inputProps}
        aria-invalid={error?.length ? true : undefined}
        aria-describedby={error?.length ? `${id}-error` : inputProps['aria-describedby']}
      />
      {error?.[0] ? (
        <p id={`${id}-error`} role="alert" aria-live="polite" className="text-sm text-destructive">
          {error[0]}
        </p>
      ) : null}
      {children}
    </div>
  );
}

export { AuthField };
