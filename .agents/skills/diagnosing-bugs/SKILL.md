---
name: diagnosing-bugs
description: Diagnose hard bugs and regressions with a tight feedback loop before hypothesizing. Use when the user reports broken, failing, throwing, flaky, incorrect, or slow behavior.
---

# Diagnosing Bugs

Use a disciplined loop: reproduce, minimize, hypothesize, instrument, fix,
regression-test, cleanup. Skip a phase only when you can explain why it does not
apply.

## Rules

- Read `docs/ai/index.md` and the relevant task route before code changes.
- Build a red-capable feedback loop before forming a primary fix hypothesis.
- Confirm the loop matches the user's exact symptom, not a nearby failure.
- Test one hypothesis at a time.
- Tag temporary debug logs with a unique `[DEBUG-...]` prefix and remove them
  before reporting done.
- For Supabase/auth/RLS/key issues, use the R2 route and
  `docs/conventions/supabase-security.md`.
- For stale data, cache, query invalidation, or state drift symptoms, read
  `docs/conventions/data-fetching.md` and the relevant Next.js cache rules
  before hypothesizing.
- For Next.js app code, read `apps/web/AGENTS.md` before editing.
- Do not bypass RLS, leak service-role keys, or move server-only code into
  client bundles to make a repro easier.

## 1. Build The Loop

Create a red-capable command or harness before guessing at causes. A useful loop
drives the actual bug path and can fail on the user's exact symptom. Copy
[scripts/repro-loop.template.sh](/.agents/skills/diagnosing-bugs/scripts/repro-loop.template.sh)
as a starting scaffold.

Prefer, in order:

1. Focused unit or component test via `bun run test`.
2. Type or policy gate when the symptom is static: `bun run typecheck`,
   `bun run ai:check`, or `bun run ai:eval`.
3. HTTP or CLI repro against a running local app.
4. Playwright repro from `apps/web` for browser-only behavior.
5. Temporary harness around the smallest callable module.

The loop must be deterministic enough to guide a fix. For flakes, raise the
reproduction rate with repeated runs, pinned time, seeded randomness, narrower
inputs, or stress around the suspected timing window.

If no loop is possible, stop and report what you tried. Ask for an artifact such
as logs, HAR, screen recording, failing input, or access to the environment that
reproduces the issue.

## 2. Reproduce And Minimize

Run the loop and confirm it matches the user's symptom, not a nearby failure.
Then reduce the repro one variable at a time: input, route, component, caller,
config, data, or timing. Keep only elements that are load-bearing for the
failure.

## 3. Hypothesize

Before changing code, list 3-5 ranked hypotheses. Each must be falsifiable:
"If this is the cause, then this probe or change will make the symptom change in
this specific way."

If the user is available, show the ranked list before testing. If not, proceed
with the best-ranked hypothesis and note the assumption.

## 4. Instrument Carefully

Probe one hypothesis at a time. Prefer debugger or targeted inspection over
logs. If adding temporary logs, tag each with a unique prefix like
`[DEBUG-abc123]` so cleanup is mechanical.

For performance regressions, measure first: establish a baseline, narrow the
hot path, then fix.

## 5. Fix And Lock Down

Turn the minimized repro into a regression test when a correct seam exists. A
correct seam exercises the real bug pattern as callers experience it.

If no correct seam exists, document that architecture gap and fix the bug with
the best available loop. Re-run the original repro after the fix.

## 6. Cleanup

Before reporting done:

- [ ] Original repro now passes or no longer reproduces.
- [ ] Regression test passes, or the missing seam is documented.
- [ ] Temporary `[DEBUG-...]` instrumentation is removed.
- [ ] Throwaway harnesses are deleted or clearly marked as debug-only.
- [ ] The final explanation names the cause and why the fix addresses it.

## Checklist

- [ ] Relevant route and convention docs were read.
- [ ] A red-capable command, test, or harness was created or the lack of one was
      explicitly reported.
- [ ] The repro matches the user-visible symptom.
- [ ] The repro was minimized before the fix.
- [ ] Hypotheses were falsifiable and tested one at a time.
- [ ] A regression test was added where a correct seam exists.
- [ ] Original repro was re-run after the fix.
- [ ] Temporary debug logs and harnesses were removed or clearly marked.
