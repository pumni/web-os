/**
 * Shared ESLint boundary rules for pure, client-safe `@pumni/*` packages
 * (currently `@pumni/ui`).
 *
 * Enforces the security boundary documented in AGENTS.md: a pure UI package
 * must never reach into app code (`@/`), server-only modules, or the
 * auth/data/env/validator layers. Until now this rule lived only in prose — this
 * makes a violation fail `lint` instead of relying on humans remembering.
 *
 * Plain flat-config objects plus Node built-ins only — no third-party deps, so
 * the consuming package still supplies the TypeScript parser. `node:fs` is used
 * to derive the feature-boundary rules from the real `features/` directory (see
 * `pumniFeatureBoundary`) instead of a hand-maintained list.
 */

import fs from 'node:fs';

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
        ],
        message:
          'Security boundary: @pumni/ui must stay client-safe. Do not import server-only, auth, Supabase, env, validators, or application code into the UI layer.',
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
 * Uses a focused plugin rule on string Literals and TemplateElements (where
 * className strings live). Patterns are intentionally narrow to avoid false positives.
 */
const RAW_COLOR_PATTERNS = [
  // Inline raw OKLCH.
  'oklch\\(',
  // Tier-1 primitive scale CSS vars (must stay inside token/theme files).
  '--(?:indigo|violet|neutral|red|emerald|amber|coral|cyan|rose)-',
  // Tailwind built-in colour palette utilities (e.g. bg-neutral-900, text-blue-500).
  '\\b(?:bg|text|border|ring|from|via|to|fill|stroke|outline|divide|decoration|shadow|caret|accent)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3}\\b',
  // Raw black/white utilities (use bg-overlay / semantic tokens instead).
  '\\b(?:bg|text|border|ring|from|via|to|fill|stroke|outline)-(?:black|white)\\b',
];

const RAW_COLOR_MESSAGE =
  'Design system is token-first: use a semantic token (bg-primary, text-foreground, border-border, bg-overlay, text-gradient-brand…) instead of a raw OKLCH value, Tier-1 primitive var, or Tailwind built-in palette utility. See docs/conventions/design-system.md.';

/**
 * Flat-config fragment forbidding raw colour/primitive usage in TS/TSX source.
 * Tests are excluded: they legitimately reference colour strings (e.g. "oklch(")
 * to PARSE and assert on tokens, not to style UI.
 */
export const pumniNoRawColor = [
  {
    name: 'pumni/no-raw-color',
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/test/**',
      '**/*.test.{ts,tsx}',
      // The APCA/design-system pages intentionally render raw colour samples
      // and computed previews; those values are the subject of the page, not
      // styling choices copied into product components.
      '**/features/design-system/**',
      // These pages intentionally render interactive raw colour previews to
      // explain glass/OKLCH behaviour.
      '**/features/design-trends/glass-2026-primitives.tsx',
      '**/features/design-trends/glass-playground.tsx',
      // This package utility owns the OKLCH parser/formatter itself.
      '**/lib/oklch.ts',
    ],
    rules: {
      'pumni/no-raw-color': 'error',
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
      'pumni/no-ad-hoc-surface': 'error',
    },
  },
];

/*
 * Timing-first guard. The design system owns its easing and duration vocabulary
 * (docs/conventions/design-system.md): components use `ease-fluid` / `ease-snappy`
 * and `duration-(--duration-base)` instead of raw Tailwind `duration-200` /
 * `duration-300` / `ease-out` / `ease-in-out`. Until now this lived only in prose.
 *
 * Uses a focused plugin rule on string Literals and TemplateElements
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

export const pumniNoRawTiming = [
  {
    name: 'pumni/no-raw-timing',
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/test/**',
      '**/*.test.{ts,tsx}',
      // CSS files are excluded from this rule (timing tokens live in CSS).
      '**/*.css',
      // The design-system pages showcase raw motion values as documentation — safe.
      '**/features/design-system/**',
    ],
    rules: {
      'pumni/no-raw-timing': 'error',
    },
  },
];

/**
 * Lists the feature-slice directory names directly under `featuresDir` (e.g.
 * `apps/web/src/features`). Deriving from the filesystem makes the directory the
 * single source of truth: a new `features/<name>/` folder is firewalled the
 * moment it exists, with no hand-maintained array to forget to update. Returns a
 * sorted list (deterministic rule order); files and dot-directories are skipped,
 * and a missing directory yields `[]` instead of throwing.
 *
 * @param {string | URL} featuresDir - directory holding the feature slices.
 * @returns {string[]}
 */
export function readFeatureNames(featuresDir) {
  if (!fs.existsSync(featuresDir)) return [];
  return fs
    .readdirSync(featuresDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort();
}

/**
 * Feature boundary + presentation guard. Enforces that:
 * 1. Features do not import from the routing layer (src/app/**) to ensure portability.
 * 2. Code outside a specific feature (including other features) can import only
 *    its explicit public entry points: `@/features/<name>` and
 *    `@/features/<name>/client`. Deeper paths remain private.
 * 3. Feature UI components (.tsx) do not import Supabase clients or auth helpers
 *    directly, keeping them pure presentation layers.
 * Test files are exempted from these rules.
 *
 * The per-feature rules are derived from the real `featuresDir` contents (see
 * {@link readFeatureNames}) so the firewall can never silently miss a feature an
 * author forgot to register. The consuming config passes its own `src/features`
 * directory, keeping this shared package agnostic about the app's location.
 *
 * Why this owns the presentation restriction too: ESLint flat config does NOT
 * merge two `no-restricted-imports` entries matching the same file — the last
 * one wins and silently clobbers the rest. A separately-exported presentation
 * rule on `src/features/**\/*.tsx` therefore used to override the feature
 * firewall on those exact files. Folding every restricted-import concern for a
 * given file scope into ONE rule object removes that override trap.
 *
 * @param {string | URL} featuresDir - the consuming app's `src/features` directory.
 * @returns {import("eslint").Linter.Config[]}
 */
export function pumniFeatureBoundary(featuresDir) {
  // Forbid every deep feature import, then carve out the exact `client` entry.
  // ESLint pattern groups are gitignore-style: the final negation re-includes
  // only `/client`; `/client/*`, `/components/*`, `/hooks/*`, etc. stay private.
  const internalPatterns = readFeatureNames(featuresDir).map((feature) => ({
    group: [
      `**/features/${feature}/*`,
      `**/features/${feature}/**/*`,
      `!**/features/${feature}/client`,
    ],
    message: `Feature boundary violation: Do not import internals of "${feature}". Use "@/features/${feature}" (server-safe API) or "@/features/${feature}/client" (client API).`,
  }));

  // Features must stay portable: no reaching back into the routing layer.
  const appLayerPattern = {
    group: ['**/app/**', '@/app/**'],
    message:
      'Feature portability violation: Features must not import from the routing layer (@/app). Keep features fully self-contained.',
  };

  // Presentation purity: UI components delegate data/auth to hooks/queries/actions.
  const presentationPattern = {
    group: ['@pumni/supabase', '@pumni/supabase/*', '@pumni/auth', '@pumni/auth/*'],
    message:
      'Presentation boundary violation: UI components (.tsx) must not import Supabase clients or auth helpers directly. Delegate data operations to custom hooks, queries, or Server Actions. See apps/web/src/features/AGENTS.md.',
  };

  // The three scopes below are disjoint by file path/extension, so no file is
  // ever matched by two of them — each `no-restricted-imports` stays authoritative.
  // Feature self-imports use relative paths (`./`, `../`), which do not match the
  // `**/features/<name>/*` specifier patterns, so a feature freely imports its own files.
  return [
    {
      // Inside a feature, non-UI modules (.ts): portability + cross-feature firewall.
      name: 'pumni/feature-boundary-internal',
      files: ['src/features/**/*.ts'],
      ignores: ['src/test/**', '**/*.test.{ts,tsx}'],
      rules: {
        'no-restricted-imports': ['error', { patterns: [appLayerPattern, ...internalPatterns] }],
      },
    },
    {
      // Inside a feature, UI components (.tsx): the above plus presentation purity.
      name: 'pumni/feature-boundary-internal-tsx',
      files: ['src/features/**/*.tsx'],
      ignores: ['src/test/**', '**/*.test.{ts,tsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          { patterns: [appLayerPattern, presentationPattern, ...internalPatterns] },
        ],
      },
    },
    {
      // Outside any feature (routes, shared components, lib): consume features
      // only through their explicit public entry points, never their internals.
      name: 'pumni/feature-boundary-external',
      files: ['src/**/*.{ts,tsx}'],
      ignores: ['src/features/**', 'src/test/**', '**/*.test.{ts,tsx}'],
      rules: {
        'no-restricted-imports': ['error', { patterns: internalPatterns }],
      },
    },
  ];
}

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

const SERVICE_ROLE_IMPORT = '@pumni/supabase/service-role';

function createStringPatternRule(name, patterns, message) {
  return {
    meta: {
      type: 'problem',
      docs: { description: name },
      schema: [],
    },
    create(context) {
      const regexes = patterns.map((pattern) => new RegExp(pattern));

      function inspectString(node, value) {
        if (typeof value === 'string' && regexes.some((regex) => regex.test(value))) {
          context.report({ node, message });
        }
      }

      return {
        Literal(node) {
          inspectString(node, node.value);
        },
        TemplateElement(node) {
          inspectString(node, node.value.raw);
        },
      };
    },
  };
}

const noUnapprovedServiceRoleImport = {
  meta: {
    type: 'problem',
    docs: { description: 'Restrict service-role imports to approved server modules.' },
    schema: [],
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        if (node.source.value === SERVICE_ROLE_IMPORT) {
          context.report({
            node: node.source,
            message:
              'Security boundary: service-role imports are restricted to the explicitly approved server modules. Add a focused authorization test before changing this allowlist.',
          });
        }
      },
    };
  },
};

export const pumniEslintPlugin = {
  rules: {
    'no-raw-color': createStringPatternRule(
      'Forbid raw colors and primitive color tokens.',
      RAW_COLOR_PATTERNS,
      RAW_COLOR_MESSAGE,
    ),
    'no-ad-hoc-surface': createStringPatternRule(
      'Forbid ad-hoc surface utilities.',
      AD_HOC_SURFACE_PATTERNS,
      AD_HOC_SURFACE_MESSAGE,
    ),
    'no-raw-timing': createStringPatternRule(
      'Forbid raw transition timing utilities.',
      RAW_TIMING_PATTERNS,
      RAW_TIMING_MESSAGE,
    ),
    'no-raw-z-index': createStringPatternRule(
      'Warn on raw cross-component z-index utilities.',
      RAW_Z_INDEX_PATTERNS,
      RAW_Z_INDEX_MESSAGE,
    ),
    'no-unapproved-service-role-import': noUnapprovedServiceRoleImport,
  },
};

export const pumniEslintPluginConfig = [
  {
    name: 'pumni/rules',
    plugins: { pumni: pumniEslintPlugin },
  },
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
      'pumni/no-raw-z-index': 'warn',
    },
  },
];