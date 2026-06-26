import { $ } from "bun";

// Bun Shell handles glob expansion and rm -rf natively on Windows, macOS, and Linux
await $`rm -rf node_modules .turbo apps/*/.next apps/*/dist packages/*/dist`;
