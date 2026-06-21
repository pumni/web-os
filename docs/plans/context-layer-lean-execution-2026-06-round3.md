# Context Layer Lean — Execution Plan Round 3 (2026-06-22)

- **Status:** ready-to-execute
- **Owner:** AI context layer (`docs/ai/index.md`)
- **Depends on:** Rounds 1 & 2 applied (ADRs 20→9, MCP merged to `docs/ai/mcp.md`,
  `sizeBudgets` ratcheted to 7 high-traffic files).
- **Goal:** Close the two remaining karpathy-skills gaps (simplicity teaching +
  thinking-skill definition-of-done), turn the karpathy "definition of done" into
  a deterministic gate, and unblock `ai:check` (currently red on an unrelated UI
  file). After this, the structural diet is **complete — stop further churn.**

Prescriptive and self-contained. **Order matters: A → B → C → D.** C enforces a
rule that B must satisfy first. Run `bun run ai:check` + `bun run ai:eval` after
each of A/B/C; for D run `bun run ai:check` (must turn green) plus the UI gates.

---

## Global guardrails (invariants)

1. `sizeBudgets` are hard. `docs/ai/common-mistakes.md` budget is **4000 bytes**,
   current **3486** → only ~514 bytes of headroom. Task A's addition MUST keep the
   file < 4000. If it would exceed, **tighten the new text — do not raise the
   budget** (manifest rule).
2. Every `.agents/skills/<name>/SKILL.md` keeps YAML frontmatter (`name`,
   `description`), an H1, a `## Rules` section, and a `## Checklist` section
   (`checkStructuredMarkdown`). Do not remove any of those.
3. The `.claude/skills/<name>/SKILL.md` shim is NOT touched by A–C (only the
   canonical `.agents/skills/*` bodies change). Shims mirror frontmatter only.
4. Task D edits only `packages/ui/src/components/form/switch.tsx` and
   `packages/ui/src/styles/tokens.css`. `tokens.css` is the one file exempt from
   the raw-`oklch(` boundary (`allowedTokenFiles`), so shadow definitions belong
   there.
5. After each task: `bun run ai:check` then `bun run ai:eval`. (A/B/C should both
   pass; D makes `ai:check` go from 7 errors to 0.)

---

## Task A — Add a "simplicity / over-engineering" mistake pair

**Why:** `common-mistakes.md` teaches security/state/cache but has **zero**
coverage of karpathy's #1 principle (no over-abstraction / no speculative
features) — the exact principle used to justify Rounds 1–2. There is no static
rule for it; it is a teaching-only pair.

### Steps

1. Append this section to the **end** of `docs/ai/common-mistakes.md` (after §10).
   Keep it compact — measured at ~470 bytes to stay under the 4000 budget:

   ```markdown

   ## 11. Premature abstraction / speculative features (simplicity — no static rule)

   The karpathy "simplicity first" principle; a reviewer rule, not a regex.

   ❌ A strategy/factory/registry for one case; an interface with a single
   implementation; caching, validation, or config flags nobody asked for.
   ✅ Minimum code that solves today's task; add the abstraction when a second
   real caller appears. Reversible/cosmetic decisions get no ADR
   (`docs/adr/README.md`).
   ```

2. Verify size: `wc -c docs/ai/common-mistakes.md` → **must be < 4000**. If not,
   shorten the two bullets (drop the parenthetical examples) until it fits.
3. `bun run ai:check` + `bun run ai:eval`.

> Note: `common-mistakes.md` is `requiredFiles` + `frontmatterRequired` — do not
> touch its frontmatter or H1.

---

## Task B — Sharpen the two thinking-skills' completion contracts

**Why:** `grill-requirements` already ends on verifiable criteria ("verification
gate is named", "acceptance criteria falsifiable", "spec confirmed") — **leave it
unchanged**. But `domain-modeling` and `codebase-design` have no explicit
verification anchor in their `## Checklist`, so "done" is fuzzy. Add one
checkable final bullet to each. This is also the precondition for Task C.

### Steps

1. **`.agents/skills/domain-modeling/SKILL.md`** — append as the final `## Checklist`
   bullet (the skill edits the glossary, so `ai:check` is its real gate):

   ```markdown
   - [ ] `docs/ai/domain-language.md` updated (or explicitly recorded as
         no-change) and `bun run ai:check` passes.
   ```

2. **`.agents/skills/codebase-design/SKILL.md`** — append as the final
   `## Checklist` bullet:

   ```markdown
   - [ ] The interface is demonstrated by a test through its public seam (a
         failing-then-passing test, or a named test seam) — `bun run test`.
   ```

3. **`grill-requirements`: no change.** (Confirm its Checklist still contains
   "verification gate" / "acceptance criteria" — it does.)

4. Keep the `.claude/skills/*` shims as-is (they carry no Checklist).
5. `bun run ai:check` + `bun run ai:eval`.

---

## Task C — Gate the karpathy "definition of done" (enforcement upgrade)

**Why:** B fixes the two skills by hand, but nothing stops a future skill from
shipping a vague Checklist. Add a deterministic check so every skill's
`## Checklist` must name **how completion is verified**. Mirrors the existing
`checkSkillDescriptionTriggers` pattern. **Run only after A+B**, or it will flag
the very skills B is fixing.

### Steps

1. In `scripts/check-ai-context.mjs`, add this function (place it directly after
   `checkSkillDescriptionTriggers`, ~line 473):

   ```js
   function checkSkillChecklistVerifiable() {
     // karpathy "definition of done": every skill's ## Checklist must name how
     // completion is verified — a gate command or an explicit checkable
     // criterion — so the exit contract defends against premature completion.
     const baseDir = resolveRel('.agents/skills');
     if (!fs.existsSync(baseDir)) return;
     const verifiable =
       /bun run |bunx |verification gate|\bverif|\bconfirm|passes\b|scans clean|test seam|acceptance criteria|resolved by/i;

     for (const entry of fs.readdirSync(baseDir, { withFileTypes: true })) {
       if (!entry.isDirectory()) continue;
       const filePath = path.join(baseDir, entry.name, 'SKILL.md');
       if (!fs.existsSync(filePath)) continue;
       const content = fs.readFileSync(filePath, 'utf8');
       const start = content.indexOf('## Checklist');
       if (start < 0) continue; // missing-section already errors in checkStructuredMarkdown
       const rest = content.slice(start + '## Checklist'.length);
       const nextHeading = rest.search(/\n## /);
       const section = nextHeading === -1 ? rest : rest.slice(0, nextHeading);
       if (!verifiable.test(section)) {
         reportError(
           `${relPath(filePath)} ## Checklist has no verifiable completion anchor (a gate command or explicit checkable criterion). See .agents/skills/README.md.`,
         );
       }
     }
   }
   ```

2. **Register it** in the run sequence (the block near line 628), immediately
   after `checkSkillDescriptionTriggers();`:

   ```js
   checkSkillDescriptionTriggers();
   checkSkillChecklistVerifiable();
   ```

3. **Document the rule** so authors know it exists. In `.agents/skills/README.md`,
   under `## The \`## Checklist\` is the completion contract`, append one line:

   ```markdown
   `bun run ai:check` enforces that the section names how completion is verified
   (a gate command or an explicit checkable criterion).
   ```

4. `bun run ai:check` — expect it to pass for **all 15 skills** (every well-formed
   Checklist, including the two B just fixed, matches the pattern). If any skill
   trips, fix that skill's Checklist (do not loosen the regex below the intent).
5. `bun run ai:eval`.

---

## Task D — Unblock `ai:check`: tokenize the raw `oklch()` in `switch.tsx`

**Why:** `ai:check` is red with 7 `Design token boundary` errors, all from
`packages/ui/src/components/form/switch.tsx` (raw `oklch(...)` inside Tailwind
`shadow-[…]` arbitrary values — lines 17, 24, 35, 36). Unrelated to the context
refactor, but it blocks the context gate from going green. Move the shadow
definitions into `tokens.css` (the allowed file) and reference them by var.

### Steps

1. **Read the four lines first** to capture exact current values:
   `rg -n "oklch\(" packages/ui/src/components/form/switch.tsx`
   (Expected: `oklch(0 0 0/0.12)`, `/0.4`, checked `/0.15` + a `color-mix(in
   oklch, …)` glow, thumb `oklch(0 0 0/0.25)` + `oklch(1 0 0/0.6)`, dark `/0.5` +
   `/0.5`.) Note: `color-mix(in_oklch,…)` is **not** flagged (no `oklch(` paren)
   — leave it inline.

2. **Add shadow tokens to `packages/ui/src/styles/tokens.css`** (in the existing
   shadow/elevation token block; this file is exempt from the boundary check).
   Use the actual values read in step 1:

   ```css
   --switch-shadow-track: inset 0 1px 2px oklch(0 0 0 / 0.12);
   --switch-shadow-track-dark: inset 0 1px 2px oklch(0 0 0 / 0.4);
   --switch-shadow-track-checked: inset 0 1px 2px oklch(0 0 0 / 0.15);
   --switch-shadow-thumb: 0 1px 3px oklch(0 0 0 / 0.25), inset 0 0.5px 0.5px oklch(1 0 0 / 0.6);
   --switch-shadow-thumb-dark: 0 1px 3px oklch(0 0 0 / 0.5), inset 0 0.5px 0.5px oklch(1 0 0 / 0.5);
   ```

   If a dark-mode token block exists, place the `-dark` variants there or keep
   them as separate vars referenced under `dark:`.

3. **Edit `switch.tsx`** to reference the vars instead of raw oklch:
   - line 17 → `shadow-[var(--switch-shadow-track)] dark:shadow-[var(--switch-shadow-track-dark)]`
   - line 24 (checked) → keep the `color-mix(...)` glow inline; replace only the
     `oklch(0 0 0/0.15)` part with `var(--switch-shadow-track-checked)`, e.g.
     `data-[state=checked]:shadow-[var(--switch-shadow-track-checked),0_0_8px_-2px_color-mix(in_oklch,var(--primary)_60%,transparent)]`
   - line 35 → `shadow-[var(--switch-shadow-thumb)]`
   - line 36 → `dark:shadow-[var(--switch-shadow-thumb-dark)]`

4. **Verify the boundary is clear:** `rg -n "oklch\(" packages/ui/src/components/form/switch.tsx`
   → expect **no matches** (only `in_oklch,` inside `color-mix`, which has no
   paren, may remain and is allowed).

5. Gates:
   - `bun run ai:check` → **expect 0 errors** (the 7 are gone).
   - `bun --filter @pumni/ui typecheck` and `bun run test` (or the UI test gate)
     to confirm no visual/type regression. Eyeball the switch in the design-system
     showcase if a dev server is already running — do not start one just for this.

---

## Final verification (after A–D)

```
bun run ai:check     # expect: PASS, 0 errors, 0 warnings
bun run ai:eval      # expect: All AI regression evals passed
rg -n "## 11\." docs/ai/common-mistakes.md      # simplicity pair present
wc -c docs/ai/common-mistakes.md                # < 4000
rg -n "ai:check|test seam" .agents/skills/domain-modeling/SKILL.md .agents/skills/codebase-design/SKILL.md
rg -n "checkSkillChecklistVerifiable" scripts/check-ai-context.mjs   # 2 hits (def + call)
rg -n "oklch\(" packages/ui/src/components/form/switch.tsx           # no matches
```

## Expected outcome

- karpathy is now applied at the **teaching layer** (simplicity pair),
  **process layer** (every thinking-skill has a checkable DoD), and **enforcement
  layer** (the gate guards the DoD) — not just the principle layer. The gap from
  the Round-2 audit is closed.
- `ai:check` is green again (UI boundary blocker removed).
- No deterministic gate weakened; one added (`checkSkillChecklistVerifiable`).

## After this: stop

The structural and karpathy work is complete. Do **not** open another
optimization round without a concrete, observed problem — over-tuning the context
layer is the exact failure mode ADR-0009 records (three same-week meta-ADRs).
Restraint here is the simplicity principle applied to the meta-layer itself.
