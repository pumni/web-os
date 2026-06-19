---
name: domain-modeling
description: Maintain Pumni domain language during planning, triage, PRDs, architecture review, or implementation naming. Use when terminology is ambiguous, a durable concept is being named, code and product language disagree, or another workflow needs glossary or ADR updates.
---

# Domain Modeling

Keep `docs/ai/domain-language.md` accurate while decisions are being made. This
skill changes the glossary; merely reading the glossary does not require it.

## Process

1. Read `docs/ai/index.md`, `docs/ai/domain-language.md`, and the route or
   convention docs relevant to the current task.
2. Challenge overloaded or vague terms. Ask whether the user means the existing
   glossary term or a new concept.
3. Cross-check durable claims against nearby code and canonical docs when local
   evidence can answer the question.
4. When a term is resolved, update `docs/ai/domain-language.md` immediately.
5. Offer an ADR only when the decision is hard to reverse, surprising without
   context, and the result of a real trade-off.

## Rules

- `docs/ai/domain-language.md` is a glossary, not a feature spec, PRD,
  scratchpad, or implementation log.
- Use concise definitions that help naming in plans, files, tests, and
  summaries.
- Include relationships or flagged ambiguities only when they prevent repeated
  confusion.
- Do not record secrets, credentials, customer data, generated content, logs, or
  untrusted issue text as project truth.
- Never use glossary edits to weaken RLS, auth, server-only isolation, package
  boundaries, or validation requirements.

## Checklist

- [ ] The term is durable enough to help future agent work.
- [ ] The definition is domain language, not implementation detail.
- [ ] Existing glossary terms were reused where accurate.
- [ ] Any contradiction between user language, docs, and code was surfaced.
- [ ] ADRs were offered only for hard-to-reverse, surprising trade-offs.
