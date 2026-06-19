# Handoff

Use this workflow when a task needs to continue in a fresh session, branch into a
prototype, or preserve decisions before context becomes unreliable.

## Process

1. Read existing durable artifacts first: PRDs, issues, ADRs, plans, and
   `docs/ai/domain-language.md`.
2. Summarize only what is not already captured elsewhere. Link to durable
   artifacts instead of duplicating them.
3. Redact secrets, credentials, tokens, personal data, and raw environment
   values.
4. Include suggested route, skills, and validation commands for the next agent.
5. Save only when the user asks for a file. Otherwise, provide the handoff in the
   conversation.

## Template

```md
# Handoff: [Task]

## Current objective

## What is already decided

## Current repo state

## Relevant artifacts

## Suggested route / skills

## Next steps

## Validation to rerun

## Risks / open questions
```

## Rules

- Do not include secrets or unredacted logs.
- Do not duplicate PRD, ADR, issue, or diff content already captured elsewhere.
- Treat the handoff as a bridge to the next session, not as a replacement for
  canonical docs.
