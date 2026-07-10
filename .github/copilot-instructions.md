# Pumni Web OS

Follow the repository rules in `AGENTS.md`. For Next.js app code, also follow
`apps/web/AGENTS.md` and `.claude/rules/*.md`. Before reporting done, run the
narrowest gate for your change scope per the root `AGENTS.md` validation gates; for context- or security-sensitive changes (Supabase
migrations, auth, RLS, server actions) also run `bun run ai:check` and `bun run ai:eval`.
