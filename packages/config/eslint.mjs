/**
 * Shared ESLint boundary rules for pure, client-safe `@pumni/*` packages
 * (currently `@pumni/ui`).
 *
 * Enforces the P0 security boundary documented in AGENTS.md: a pure UI package
 * must never reach into app code (`@/`), server-only modules, or the
 * auth/data/env/validator layers. Until now this rule lived only in prose — this
 * makes a violation fail `lint` instead of relying on humans remembering.
 *
 * Plain flat-config objects only (no imports) so this file stays
 * dependency-free; the consuming package supplies the TypeScript parser.
 */

/** @type {import("eslint").Linter.RuleEntry} */
export const restrictedUiImports = [
  "error",
  {
    patterns: [
      {
        group: ["@/*"],
        message:
          "@pumni/ui is a pure package — it must not import app code (@/). Inside the package use relative imports (e.g. ../lib/cn).",
      },
      {
        group: [
          "server-only",
          "@pumni/auth",
          "@pumni/auth/*",
          "@pumni/supabase",
          "@pumni/supabase/*",
          "@pumni/env",
          "@pumni/env/*",
          "@pumni/validators",
          "@pumni/validators/*",
          "@pumni/features",
          "@pumni/features/*",
        ],
        message:
          "P0 security: @pumni/ui must stay client-safe. Do not import server-only, auth, Supabase, env, validators, or feature packages into the UI layer.",
      },
    ],
  },
];

/** Flat-config fragment applying the boundary to a package's TS/TSX source. */
export const pumniUiBoundary = [
  {
    name: "pumni/ui-boundary",
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": restrictedUiImports,
    },
  },
];
