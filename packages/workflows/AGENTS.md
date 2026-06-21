# @pumni/workflows — package-scoped rules

Path-scoped contract for `packages/workflows`. Read when adding background jobs, scheduling logic, or step executions.

## Summary

Durable execution layer for Pumni Web OS. Provides orchestration primitives for multi-step jobs with sleep and run states.

## Architecture

- `src/index.ts` exports pure workflow definitions and executor stubs.
- Keep execution steps stateless and serializable.
- Do not import client-bundle UI modules here.

## Commands

- `bun --filter @pumni/workflows typecheck`
