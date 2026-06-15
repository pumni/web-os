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
  'error',
  {
    patterns: [
      {
        group: ['@/*'],
        message:
          '@pumni/ui is a pure package — it must not import app code (@/). Inside the package use relative imports (e.g. ../lib/cn).',
      },
      {
        group: [
          'server-only',
          '@pumni/auth',
          '@pumni/auth/*',
          '@pumni/supabase',
          '@pumni/supabase/*',
          '@pumni/env',
          '@pumni/env/*',
          '@pumni/validators',
          '@pumni/validators/*',
          '@pumni/features',
          '@pumni/features/*',
        ],
        message:
          'P0 security: @pumni/ui must stay client-safe. Do not import server-only, auth, Supabase, env, validators, or feature packages into the UI layer.',
      },
    ],
  },
];

/** Flat-config fragment applying the boundary to a package's TS/TSX source. */
export const pumniUiBoundary = [
  {
    name: 'pumni/ui-boundary',
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrictedUiImports,
    },
  },
];

/*
 * Token-first guard. The design system is token-first (docs/conventions/design-system.md):
 * components consume SEMANTIC tokens (bg-primary, text-foreground, bg-overlay…), never raw
 * OKLCH values, Tier-1 primitive scale vars, or Tailwind's built-in colour palette. Until now
 * this lived only in prose review — these patterns make a violation fail `lint`.
 *
 * Uses esquery regex attribute matchers on string Literals and TemplateElements (where
 * className strings live). Patterns are intentionally narrow to avoid false positives.
 */
const RAW_COLOR_PATTERNS = [
  // Inline raw OKLCH.
  'oklch\\(',
  // Tier-1 primitive scale CSS vars (must stay inside token/theme files).
  '--(?:indigo|violet|neutral|red|emerald|amber)-',
  // Tailwind built-in colour palette utilities (e.g. bg-neutral-900, text-blue-500).
  '\\b(?:bg|text|border|ring|from|via|to|fill|stroke|outline|divide|decoration|shadow|caret|accent)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3}\\b',
  // Raw black/white utilities (use bg-overlay / semantic tokens instead).
  '\\b(?:bg|text|border|ring|from|via|to|fill|stroke|outline)-(?:black|white)\\b',
];

const RAW_COLOR_MESSAGE =
  'Design system is token-first: use a semantic token (bg-primary, text-foreground, border-border, bg-overlay, text-gradient-brand…) instead of a raw OKLCH value, Tier-1 primitive var, or Tailwind built-in palette utility. See docs/conventions/design-system.md.';

/** @type {import("eslint").Linter.RuleEntry} */
export const restrictedRawColor = [
  'error',
  ...RAW_COLOR_PATTERNS.flatMap((pattern) => [
    { selector: `Literal[value=/${pattern}/]`, message: RAW_COLOR_MESSAGE },
    { selector: `TemplateElement[value.raw=/${pattern}/]`, message: RAW_COLOR_MESSAGE },
  ]),
];

/**
 * Flat-config fragment forbidding raw colour/primitive usage in TS/TSX source.
 * Tests are excluded: they legitimately reference colour strings (e.g. "oklch(")
 * to PARSE and assert on tokens, not to style UI.
 */
export const pumniNoRawColor = [
  {
    name: 'pumni/no-raw-color',
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/test/**', '**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': restrictedRawColor,
    },
  },
];

const AD_HOC_SURFACE_PATTERNS = [
  // Raw blur — blur must come from the glass-* utilities (a11y fallbacks live there).
  '\\bbackdrop-blur(?:-(?:none|sm|md|lg|xl|2xl|3xl)|-\\[[^\\]]+\\])?\\b',
  // Opacity on surface tokens — surfaces are opaque in the unified system.
  '\\bbg-(?:card|background|popover)\\/\\d',
  // Raw elevation shadows — content uses shadow-sm; floating depth is the glass utility.
  '\\bshadow-(?:lg|xl|2xl)\\b',
];

const AD_HOC_SURFACE_MESSAGE =
  'Surface system is closed: no raw backdrop-blur (use GlassSurface/glass-* for floating layers), no bg-{card,background,popover}/NN opacity (surfaces are opaque — use Card solid/inset or bg-muted), no raw shadow-lg/xl/2xl (content=shadow-sm, floating=glass utility). See docs/conventions/design-system.md §Surface vocabulary.';

export const restrictedAdHocSurface = [
  'error',
  ...AD_HOC_SURFACE_PATTERNS.flatMap((pattern) => [
    { selector: `Literal[value=/${pattern}/]`, message: AD_HOC_SURFACE_MESSAGE },
    { selector: `TemplateElement[value.raw=/${pattern}/]`, message: AD_HOC_SURFACE_MESSAGE },
  ]),
];

export const pumniNoAdHocSurface = [
  {
    name: 'pumni/no-ad-hoc-surface',
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/test/**',
      '**/*.test.{ts,tsx}',
      // TODO: Migrate these out-of-scope surfaces in follow-up passes (Section 7 of plan)
      '**/layout.tsx',
      '**/sky-player/**',
      '**/profile-form.tsx',
      '**/app-shell/**',
      '**/showcase.tsx',
      // Core UI package components that house overlay scrim blurs or OS window body transparency.
      '**/dialog.tsx',
      '**/sheet.tsx',
      '**/command-palette.tsx',
      '**/window.tsx',
    ],
    rules: {
      'no-restricted-syntax': restrictedAdHocSurface,
    },
  },
];
