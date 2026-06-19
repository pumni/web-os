# Prototype

Use this workflow when a runnable throwaway artifact will answer a design
question faster than discussion: UI alternatives, state models, business rules,
or interaction flows.

## Process

1. State the single question the prototype must answer.
2. Choose the smallest artifact:
   - UI question: one throwaway route or local component variant, clearly named
     as prototype-only.
   - Logic/state question: a tiny script, reducer harness, or in-memory demo.
3. Avoid persistence by default. If persistence is the subject of the question,
   use clearly disposable local data.
4. Surface relevant state after each interaction or action.
5. When the question is answered, delete the prototype or absorb the validated
   decision into production code.
6. Capture the answer in the PRD, agent brief, ADR, issue, or final summary.

## Rules

- Prototype code is not production code.
- Do not add tests, broad abstractions, or polish unless needed to answer the
  question.
- Do not persist real user data or use production services.
- Do not leave a prototype in the repo without a clear `prototype` name and a
  follow-up decision to delete or absorb it.
- For UI prototypes, still respect Web OS design-system and frontend guidance
  enough that the artifact answers the visual question honestly.
