# Refactor Plan — Templates

Fill-in templates for the `refactor-plan` skill. Copy each one into the plan you
are drafting; the skill body (`SKILL.md`) owns the process, this file owns the
shapes.

## Step template

```markdown
### Step N: <short verb-phrase>

- **File(s):** <path:line-range>
- **Action:** <precise change — not "clean up"; name the extraction/move/rename
  and the signature that must stay identical>
- **Verification:** `<exact command>`
- **Rollback:** `git checkout -- <file>` or `git revert <sha>`
- **Depends on:** <Step id, or `none`>
```

## Parallel branches

Declare branches up front with this notation (steps without a letter suffix are
linear):

```markdown
### Step 3a: <action> (independent of 3b)
### Step 3b: <action> (independent of 3a)
### Step 4: <action> (depends on 3a AND 3b)
```

Step rules:

| Principle | Why |
|---|---|
| Atomic | One logical change per step; independently verifiable |
| Explicit | Name file, function, line range — never "improve module X" |
| Verifiable | Every step carries a concrete command, not "check it works" |
| Ordered | Linear, or branches declared up front |
| Small diff | Smaller diff = faster review = easier revert |
| Idempotent (when possible) | Re-running a step must not double-apply |

## Risks template

```markdown
### Risks & edge cases

| Risk | Severity | Mitigation |
|---|---|---|
| <what could go wrong> | High/Med/Low | <how the plan handles it> |
```

## Spec template (hand-off from grill-requirements)

When the refactor target was settled by `grill-requirements`, the agreed spec
should be embedded in or referenced from the plan's Context section. The five
load-bearing sections:

```markdown
### Outcome
<one sentence — the observable change>

### In-scope
- <file/module/table/route>

### Out-of-scope (hard fence)
- <explicitly excluded — equal weight to in-scope>

### Acceptance criteria
- <falsifiable: "X returns Y for input Z">

### Verification gate
- `<exact command>` (see the root `AGENTS.md` validation gates)
```

## Decision Log

<!-- Immutable. Date + decision + rationale. Add; never delete. -->
| Date | Decision | Rationale |
|---|---|---|

