import { $ } from "bun";

console.log("🧹 Cleaning build outputs, caches, and node_modules...");

// Bun Shell handles glob expansion and rm -rf natively on Windows, macOS, and Linux
await $`rm -rf node_modules .turbo apps/*/.next apps/*/dist packages/*/dist`;

console.log("✅ Clean completed!");
