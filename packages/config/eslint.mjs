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
  // Hand-rolled inset well — the recessed shorthand `border bg-muted` surface is
  // owned by <CardWell> (and <Card variant="inset">). Don't re-invent it inline.
  // The negative lookbehind excludes the canonical `border border-border bg-muted`
  // form the primitives themselves use (the trailing "border" of "border-border").
  '(?<!-)\\bborder bg-muted\\b',
];

const AD_HOC_SURFACE_MESSAGE =
  'Surface system is closed: no raw backdrop-blur (use GlassSurface/glass-* for floating layers), no bg-{card,background,popover}/NN opacity (surfaces are opaque), no raw shadow-lg/xl/2xl (content=shadow-sm, floating=glass utility), no hand-rolled `border bg-muted` inset wells (use <CardWell> / <Card variant="inset">; status pills use <Badge>, icon chips use <IconBadge>). See docs/conventions/design-system.md §Surface vocabulary.';

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
      // ── Permanent demo exemptions ─────────────────────────────────────────
      // These pages exist to demonstrate and stress-test the design system;
      // enforcing token usage inside them would hide real violations by raising
      // the noise floor. They are intentionally exempt.
      '**/showcase.tsx',
      '**/features/design-system/**',
      // ── Permanent overlay exemptions ──────────────────────────────────────
      // These UI primitives own the scrim/overlay layer. Their backgrounds are
      // transparent-by-design and use backdrop-filter — not semantic surface
      // fills. Applying bg-card/bg-muted here would defeat the purpose.
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

/*
 * Timing-first guard. The design system owns its easing and duration vocabulary
 * (docs/conventions/design-system.md): components use `ease-fluid` / `ease-snappy`
 * and `duration-(--duration-base)` instead of raw Tailwind `duration-200` /
 * `duration-300` / `ease-out` / `ease-in-out`. Until now this lived only in prose.
 *
 * Uses esquery regex attribute matchers on string Literals and TemplateElements
 * (where className strings live). Patterns are intentionally narrow to avoid false
 * positives on legitimate tw-animate-css utilities (fade-in, zoom-in, etc.) and
 * non-duration values.
 */
const RAW_TIMING_PATTERNS = [
  // Tailwind duration utilities (numeric milliseconds) — the owned form is
  // `duration-(--duration-base)` etc. Allow tw-animate-css `animation-duration-*`
  // and `delay-*` (those are stagger, not transition timing).
  '\\bduration-(?:100|150|200|300|500|700|1000)\\b',
  // Tailwind easing utilities — the owned form is `ease-fluid` / `ease-snappy`.
  // The negative lookbehind `(?<![-(])` excludes token references like
  // `var(--ease-in-out)` or `ease-(--ease-in-out)` (the owned Tailwind v4 form
  // that bridges to a CSS var). NOTE: `ease-linear` is intentionally allowed —
  // it has no design-system token equivalent yet.
  '(?<![-(])\\bease-(?:out|in-out|in)\\b',
];

const RAW_TIMING_MESSAGE =
  'Timing is token-first: use a design-system easing (ease-fluid, ease-snappy) and duration (duration-(--duration-base), duration-(--duration-slow), duration-(--duration-fast)) instead of raw Tailwind duration-{N} or ease-{curve}. See docs/conventions/design-system.md §Motion.';

export const restrictedRawTiming = [
  'error',
  ...RAW_TIMING_PATTERNS.flatMap((pattern) => [
    { selector: `Literal[value=/${pattern}/]`, message: RAW_TIMING_MESSAGE },
    { selector: `TemplateElement[value.raw=/${pattern}/]`, message: RAW_TIMING_MESSAGE },
  ]),
];

export const pumniNoRawTiming = [
  {
    name: 'pumni/no-raw-timing',
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/test/**',
      '**/*.test.{ts,tsx}',
      // CSS files are excluded from this rule (timing tokens live in CSS).
      '**/*.css',
      // Motion-section showcases the old tokens as documentation — safe.
      '**/motion-section.tsx',
    ],
    rules: {
      'no-restricted-syntax': restrictedRawTiming,
    },
  },
];

const FEATURES = ['design-system', 'design-trends', 'profile', 'sky-player', 'watch'];

/**
 * Feature boundary guard. Enforces that:
 * 1. Features do not import from the routing layer (src/app/**) to ensure portability.
 * 2. Code outside a specific feature (including other features) must not import its internal files,
 *    forcing them to use the public API (root index.ts of the feature).
 * Test files are exempted from these rules.
 */
export const pumniFeatureBoundary = [
  {
    name: 'pumni/feature-no-app-imports',
    files: ['src/features/**/*.{ts,tsx}'],
    ignores: ['src/test/**', '**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/app/**',
                '@/app/**',
              ],
              message:
                'Feature portability violation: Features must not import from the routing layer (@/app). Keep features fully self-contained.',
            },
          ],
        },
      ],
    },
  },
  ...FEATURES.map((feature) => ({
    name: `pumni/feature-boundary-${feature}`,
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      `src/features/${feature}/**`,
      'src/test/**',
      '**/*.test.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                `**/features/${feature}/*`,
                `**/features/${feature}/**/*`,
              ],
              message: `Feature boundary violation: Do not import internals of "${feature}" feature. Only import from the public API "@/features/${feature}".`,
            },
          ],
        },
      ],
    },
  })),
];

/**
 * Feature presentation boundary guard. Enforces that UI components (.tsx)
 * within feature modules do not import Supabase clients or auth helpers directly,
 * ensuring they remain pure presentation layers.
 */
export const pumniFeaturePresentationBoundary = [
  {
    name: 'pumni/feature-presentation-boundary',
    files: ['src/features/**/*.tsx'],
    ignores: ['src/test/**', '**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@pumni/supabase',
                '@pumni/supabase/*',
                '@pumni/auth',
                '@pumni/auth/*',
              ],
              message:
                'Presentation boundary violation: UI components (.tsx) must not import Supabase clients or auth helpers directly. Delegate data operations to custom hooks, queries, or Server Actions. See docs/conventions/feature-module.md.',
            },
          ],
        },
      ],
    },
  },
];
/*
 * Raw z-index guard. The design system owns a single OS z-index scale
 * (tokens.css --z-window…--z-toast). Hand-picking a raw Tailwind z-class
 * (z-10, z-20, z-30, z-40, z-50) in a cross-component layer will be leap-frogged
 * by the token-based layers, causing stacking bugs that are hard to reproduce.
 * Single-component local stacking (z-0, z-10 within an isolated element like a
 * button icon or avatar badge) is allowed — the guard targets the cross-component
 * layer values (z-30 through z-50) and arbitrary `z-[N]` values.
 *
 * Runs as a warning (not error) so existing legacy stacking doesn't block CI
 * while the migration to token utilities proceeds.
 */
const RAW_Z_INDEX_PATTERNS = [
  // Tailwind z-index steps that land in/above shell-chrome territory.
  '\\bz-(?:30|40|50)\\b',
  // Arbitrary z-index values e.g. z-[999], z-[9999].
  '\\bz-\\[\\d+\\]',
];

const RAW_Z_INDEX_MESSAGE =
  'Z-index is owned by the OS layering scale (--z-window…--z-toast in tokens.css). ' +
  'Use a Tailwind utility bridged from a token (e.g. z-(--z-modal)) instead of a raw z-class. ' +
  'See docs/conventions/design-system.md §Z-index.';

export const restrictedRawZIndex = [
  'warn',
  ...RAW_Z_INDEX_PATTERNS.flatMap((pattern) => [
    { selector: `Literal[value=/${pattern}/]`, message: RAW_Z_INDEX_MESSAGE },
    { selector: `TemplateElement[value.raw=/${pattern}/]`, message: RAW_Z_INDEX_MESSAGE },
  ]),
];

/**
 * Flat-config fragment warning on raw z-index classes in TS/TSX source.
 * Tests and the OS window component (which uses z-token variables directly
 * via inline style) are excluded.
 */
export const pumniNoRawZIndex = [
  {
    name: 'pumni/no-raw-z-index',
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/test/**',
      '**/*.test.{ts,tsx}',
      // OS window explicitly manages z-index via data attributes and CSS vars.
      '**/window.tsx',
    ],
    rules: {
      'no-restricted-syntax': restrictedRawZIndex,
    },
  },
];
