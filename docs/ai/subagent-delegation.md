---
description: Project standing permission and limits for subagent delegation.
when-to-load: Before using subagents for codebase exploration, independent review, skill forward-testing, or web research.
---

# Subagent Delegation

Use subagents when fan-out is broad and only conclusions matter: config
locations, import lists, repeated patterns, independent review, skill/workflow
forward-testing, or web research that needs outside sources.

Do not delegate security-sensitive reads, one-file edits, or anything needing
raw code text. Read those directly.

Standing permission: subagents may be used for read-only codebase exploration,
independent review, skill/workflow forward-testing, and web research when a task
needs outside sources or current information.

Subagents must not edit files, write issue comments or labels, run migrations,
commit, push, or perform any other side effect unless the user explicitly asks
for that action. The main agent remains responsible for reviewing and
integrating subagent findings.
