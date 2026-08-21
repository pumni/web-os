/**
 * check-feature-boundary — guards the feature-boundary ESLint firewall.
 *
 * The firewall in `packages/config/eslint.mjs` derives feature names from the
 * filesystem and emits one restricted-import rule per disjoint file scope. It
 * allows exactly two public feature import shapes: `@/features/<name>` and
 * `@/features/<name>/client`; deeper paths remain private.
 *
 * Modes:
 *   --self-test   run only the fixture assertions (no repo state read)
 *   (default)     self-test + verify the live apps/web/src/features tree
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { readFeatureNames, pumniFeatureBoundary } from '../packages/config/eslint.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FEATURES_DIR = path.join(ROOT, 'apps/web/src/features');

function assert(condition, message) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    process.exit(1);
  }
}

function configByName(config, name) {
  return config.find((entry) => entry.name === name) ?? null;
}

function patternsOf(entry) {
  return entry?.rules?.['no-restricted-imports']?.[1]?.patterns ?? [];
}

function featuresEnforcedBy(entry) {
  const found = new Set();
  for (const pattern of patternsOf(entry)) {
    for (const glob of pattern.group) {
      const match = glob.match(/features\/([^/*]+)\//);
      if (match) found.add(match[1]);
    }
  }
  return [...found].sort();
}

function featurePattern(entry, feature) {
  return (
    patternsOf(entry).find((pattern) =>
      pattern.group.includes(`**/features/${feature}/**/*`),
    ) ?? null
  );
}

function eq(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function assertPublicEntries(entry, feature) {
  const pattern = featurePattern(entry, feature);
  assert(pattern, `${entry.name} must restrict deep imports for ${feature}`);
  assert(
    pattern.group.includes(`**/features/${feature}/*`),
    `${entry.name} must restrict first-level internals for ${feature}`,
  );
  assert(
    pattern.group.includes(`!**/features/${feature}/client`),
    `${entry.name} must re-include only the exact client public entry for ${feature}`,
  );
  assert(
    !pattern.group.includes(`!**/features/${feature}/client/*`),
    `${entry.name} must not expose nested client internals for ${feature}`,
  );
}

function runSelfTest() {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'pumni-feature-boundary-'));
  try {
    fs.mkdirSync(path.join(fixture, 'zeta'));
    fs.mkdirSync(path.join(fixture, 'alpha'));
    fs.mkdirSync(path.join(fixture, '.hidden'));
    fs.writeFileSync(path.join(fixture, 'README.md'), '# not a feature\n');

    const names = readFeatureNames(fixture);
    assert(
      eq(names, ['alpha', 'zeta']),
      `readFeatureNames should return sorted directory names only, got ${JSON.stringify(names)}`,
    );
    assert(
      readFeatureNames(path.join(fixture, 'does-not-exist')).length === 0,
      'readFeatureNames must return [] for a missing directory',
    );

    const config = pumniFeatureBoundary(fixture);
    const internalTs = configByName(config, 'pumni/feature-boundary-internal');
    const internalTsx = configByName(config, 'pumni/feature-boundary-internal-tsx');
    const external = configByName(config, 'pumni/feature-boundary-external');
    assert(internalTs, 'pumniFeatureBoundary must emit a feature-boundary-internal (.ts) config');
    assert(internalTsx, 'pumniFeatureBoundary must emit a feature-boundary-internal-tsx config');
    assert(external, 'pumniFeatureBoundary must emit a feature-boundary-external config');

    const rImports = config.filter((c) => c.rules?.['no-restricted-imports']);
    assert(
      rImports.length === 3,
      `Exactly three configs may set no-restricted-imports (one per disjoint scope); found ${rImports.length}. ` +
        'A second config matching the same files reintroduces the flat-config override bug.',
    );
    assert(
      external.ignores?.includes('src/features/**'),
      'feature-boundary-external must ignore src/features/** so it never overlaps the internal scopes',
    );

    for (const entry of [internalTs, internalTsx, external]) {
      assert(
        eq(featuresEnforcedBy(entry), ['alpha', 'zeta']),
        `${entry.name} must enforce every feature simultaneously`,
      );
      for (const feature of ['alpha', 'zeta']) assertPublicEntries(entry, feature);
    }

    for (const entry of [internalTs, internalTsx]) {
      assert(
        patternsOf(entry).some((p) => p.group.includes('@/app/**')),
        `${entry.name} must keep the @/app routing-layer guard`,
      );
    }

    const hasPresentation = (entry) =>
      patternsOf(entry).some((p) => p.group.includes('@pumni/supabase'));
    assert(
      hasPresentation(internalTsx),
      'feature-boundary-internal-tsx must block direct @pumni/supabase / @pumni/auth imports in UI components',
    );
    assert(
      !hasPresentation(internalTs) && !hasPresentation(external),
      'the presentation guard must apply only to feature .tsx files, not .ts or external scopes',
    );

    console.log(
      'Feature-boundary self-test passed (filesystem-derived rules, explicit root/client APIs, no override gap).',
    );
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
}

function verifyLiveConfig() {
  const features = readFeatureNames(FEATURES_DIR);
  assert(
    features.length > 0,
    `No feature slices found under ${FEATURES_DIR} — the boundary firewall would be a no-op.`,
  );

  const config = pumniFeatureBoundary(FEATURES_DIR);
  const external = configByName(config, 'pumni/feature-boundary-external');
  const enforced = featuresEnforcedBy(external);
  assert(
    eq(enforced, features),
    `Live boundary rules drifted from the features directory.\n  dirs:  ${features.join(', ')}\n  rules: ${enforced.join(', ')}`,
  );
  for (const feature of features) assertPublicEntries(external, feature);

  console.log(
    `Feature-boundary live check passed (${features.length} feature(s) firewalled: ${features.join(', ')}).`,
  );
}

runSelfTest();
if (!process.argv.slice(2).includes('--self-test')) verifyLiveConfig();
