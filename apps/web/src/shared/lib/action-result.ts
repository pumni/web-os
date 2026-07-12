import 'server-only';
import * as Sentry from '@sentry/nextjs';

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; message: string };

/** Log/capture the real error, return a generic localized message to the client. */
export function actionFailure(error: unknown, publicMessage: string): { ok: false; message: string } {
  console.error(error);
  Sentry.captureException(error);
  return { ok: false, message: publicMessage };
}

/** Zod safeParse → typed data or ready-to-return failure (promoted from watch/actions.ts). */
export function parseActionInput<T>(
  schema: { safeParse: (input: unknown) => { success: true; data: T } | { success: false } },
  input: unknown,
  errorMessage: string,
): { ok: true; data: T } | { ok: false; message: string } {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: errorMessage };
  }
  return { ok: true, data: parsed.data };
}
