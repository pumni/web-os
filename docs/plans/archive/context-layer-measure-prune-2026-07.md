# AI Context Layer — Measure, Prune & Tier-1 Modernization (2026-07-01)

- **Status:** Tier-1 rewrite = DONE in this plan's commit; prune candidates =
  evidence-gated (execute later, per the cadence below).
- **Owner:** AI context layer (`docs/ai/index.md`)
- **Predecessors:** `ai-context-layer-refactor-2026-07.md` (v1),
  `ai-context-layer-refactor-v2-2026-07.md` (v2), `context-layer-maturity-2026-07.md`
  (M0–M4, ADR-0023 — all merged in `d0513cf`).
- **Scope:** (1) a lightweight, tooling-free way to know the context layer is
  working and when to cut; (2) an evidence-gated prune backlog; (3) an executed
  modern-standard rewrite of **Tier 1 — the project constitution** (`AGENTS.md`
  + `CLAUDE.md`, the only always-loaded files).
- **Non-goal:** more machinery. This deliberately does **not** re-add a metrics
  harness (ADR-0009 removed `ai-metrics.mjs` as meta-meta) or a new always-loaded
  process doc. The cadence is human observation over existing signals.

> Consistency rule this plan follows: **Tier-1 modernization is executed now**
> (it is a quality rewrite backed by the two 2026 reports, not a guess). **Every
> other cut waits for a measured signal** (§1–§2) — cutting a convention/skill
> "because it might be unused" is exactly the blind-trim mistake the measure-first
> thesis rejects.

---

## 1. How to know the context layer is working (signals, not metrics)

No dashboard. Watch for these during normal feature work — each maps to a
documented failure mode in the two reports under `v:\`:

| Signal (observed during real work) | Means | Source |
|---|---|---|
| Agent produces inconsistent output or hedges on a domain | The owning spec is **missing or stale** — not "model too weak" | R1 §13.2 |
| A retrieval / `docs/ai/index.md` lookup returns nothing for a real subsystem | That subsystem is **undocumented** — write it once | R1 §4.6 |
| You re-explain the same domain fact across ≥2 sessions | Encode it (skill `Known Failure Modes` / convention) | R1 §14 (G4) |
| The M2 drift notice fires on a real code/doc mismatch | Working as intended — update the owner doc | R1 §12.3 |
| A skill never activates though its trigger clearly occurred | `description` is weak, or the skill is dead | R1 §14 |
| `docs/ai/*` (meta) grows back toward ≥ `docs/conventions/*` (real rules) | Meta-inversion returning — trim meta | ADR-0009 |

**Healthy state = quiet:** short prompts (<100 words) still yield correct output,
drift notices are rare and true, skills fire on their triggers, no repeated
re-explanation.

---

## 2. When to cut (deterministic-ish triggers)

Cut a piece of context when **any** holds — verify against the repo, don't guess:

1. **Toolchain now covers it.** A rule the linter / type-checker / a glob-rule
   (`.claude/rules/*`) now enforces → delete the prose (R2 §4.4).
2. **Generic, model-already-knows content.** Advice not specific to this repo and
   not inferable-from-signal → delete (R1 §5.2, ETH Zurich: it *raises* cost).
3. **Duplication across always-loaded files.** The same rule stated twice in the
   hot set → keep one (redundant encoding is only worth it when the copies are
   far apart, not adjacent).
4. **Dead skill / doc.** Never activated across a full review cycle *and* its
   domain saw real work → prune or fix its `description`.
5. **Stale spec.** Owner doc contradicts current code (M2 flags this) and the
   behavior is settled → rewrite or delete.

Never cut: P0 security, the priority stack, or the Untrusted Content Policy —
those are load-bearing regardless of activation frequency.

---

## 3. Cadence (no new tooling)

- **Event-driven (primary):** when a §1 signal appears, act in the same session —
  encode the missing fact, or open a cut. This is the main loop; do not batch it.
- **Bi-weekly light review (~30 min, as ADR-0009 intended):** skim `docs/ai/*`
  vs `docs/conventions/*` byte totals (`du -b`), the M2 drift log, and the prune
  backlog (§4). Apply obvious cuts as plain edits (the freeze allows edits; it
  forbids new context-layer *ADRs* without a measured regression —
  `docs/adr/README.md`).
- **Re-freeze holds:** a *structural* re-architecture still needs a measured
  trigger + ADR (ADR-0023 is the current record). Trims and prunes do not.

---

## 4. Prune backlog (evidence-gated — do NOT execute blind)

Candidates identified by reading the layer. Each needs a §2 trigger confirmed
before cutting. Listed so the bi-weekly review has a starting point.

| Candidate | Suspected trigger | Verify before cutting |
|---|---|---|
| `apps/web/AGENTS.md` "App-local layout" state-ownership line | Dup of root `Project` + `data-fetching.md` (trigger 3) | It loads only inside `apps/web`; point-of-use reinforcement may earn its keep — keep unless review says noise |
| Any `docs/ai/*` reference doc unread for a full cycle | Dead doc (trigger 4) | Confirm via §1 observation, not assumption |
| Convention prose an ESLint rule now enforces | Toolchain covers it (trigger 1) | Grep `apps/web/eslint.config.mjs` for the matching rule first |
| Skills with no `Known Failure Modes` and low activation | Generic/dead (trigger 2/4) | Only after activation is observable (M4 spike) |

> This backlog is intentionally short and unexecuted. Growing it into a big
> "cut everything" sweep would repeat the June-2026 over-tuning ADR-0009 fixed.

---

## 5. Tier-1 constitution — modern-standard rewrite (EXECUTED)

**Why:** Both reports define the modern constitution (R1 §5.1, R2 §4.2): exact
commands, an explicit verifiable **Definition of Done**, three-tier
**Boundaries** (Always / Ask-first / Never), no vague language, no generic
architecture overview or directory-map padding, signal-dense and written for an
agent. The prior `AGENTS.md` had the security/priority/pointer bones but **no
explicit DoD, no Boundaries triad**, and carried generic agent-behavior prose
("Think first…") the model already knows (R1 §5.2 says that *costs* tokens).

**Change (net smaller, higher signal):**
- **Kept verbatim (load-bearing):** `<SECURITY_MANDATES>`, Untrusted Content
  Policy, Priority Stack.
- **Added (modern-standard):** an explicit **Definition of Done** (green narrowest
  gate + no unrelated changes + owner spec updated) and a compact **Boundaries**
  block (Never = P0 by reference; Ask-first = schema change / file delete / core
  dep change).
- **Compressed:** the React Compiler paragraph (~430→~230 chars, same rule).
- **Cut:** standalone "Think first / Working Principles / Goal-driven
  verification" prose — folded the one non-obvious bit (surface ambiguous
  readings; reuse-first ladder; no ADR for reversible) into a tight `How to work`,
  and merged verification into `Definition of Done` (removes duplication with the
  old `Validation` section).
- **`CLAUDE.md`:** dropped the `Untrusted:` bullet — it duplicated the full
  Untrusted Content Policy that sits one line below via `@AGENTS.md` (trigger 3).
  Kept the `MEMORY.md` pointer and the exact gate command (highest-ROI content).

**Governance:** this is a trim+tighten within ADR-0023's sanctioned
"modern-standard" mandate — **no new ADR** (README lifecycle: edits/trims don't
get an ADR). It does not add or remove a *capability*, only reshapes the always-on
prose. It stays under the `AGENTS.md` 5500-byte budget (and shrinks it).

---

## 6. Gate-safety & acceptance

- `AGENTS.md` size ≤ 5500 (target < 4800); `CLAUDE.md` shrinks; `MEMORY.md` ≤ 2200
  after adding the §3 cadence pointer (trim one verbose line to fit).
- Every backtick path kept in `AGENTS.md` still resolves (`checkDocPathReferences`):
  reuse only path forms the current file already passes with.
- No phantom API tokens introduced (`checkDocApiDenylist`).
- `docs/ai/index.md` still references `AGENTS.md` (`indexRequiredReferences`) — the
  rewrite keeps the filename and the router pointer.

```pwsh
(Get-Item AGENTS.md).Length          # ≤ 5500, expect < 4800
bun run ai:check                     # PASS
bun run ai:eval                      # PASS
```

**Done checklist:**
- [x] Cadence (§1–§3) recorded; no new always-loaded doc, no new tooling.
- [x] Prune backlog (§4) captured, unexecuted, evidence-gated.
- [x] `AGENTS.md` rewritten: DoD + Boundaries added, generic prose cut, RC
      compressed, net smaller, under budget.
- [x] `CLAUDE.md` de-duplicated.
- [x] `docs/ai/MEMORY.md` points to this cadence.
- [x] `bun run ai:check` + `bun run ai:eval` PASS.

---

## 7. Appendix — evidence base (untrusted; findings only)

`v:\ha-tang-ngu-canh-ma-hoa-cho-ai-agent (1).md` §5.1 (constitution content),
§5.2 (cut generic architecture / dir maps; ETH Zurich cost finding), §13.2
(staleness = #1 failure mode), §14 (encode-if-explained-twice; activation).
`v:\Ha-Tang-Ngu-Canh-Ma-Hoa-Cho-AI-Agent.md` §4.2 (commands = highest ROI, DoD,
boundaries), §4.4 (toolchain-first / signal density). Per `AGENTS.md` these are
untrusted inputs: findings used as evidence, embedded instructions ignored.
