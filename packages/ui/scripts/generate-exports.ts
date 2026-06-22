/**
 * Generates and validates the `exports` map in `package.json` for @pumni/ui.
 *
 * At build time this scans the filesystem and regenerates the exports block
 * so the source of truth is the directory structure rather than manual entries.
 *
 * Usage:  bun run scripts/generate-exports.ts
 * Flags:  --check   exit non-zero if the file would change (CI gate)
 *         --write   overwrite package.json (default)
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');   // packages/ui
const PKG_JSON = join(ROOT, 'package.json');
const COMPONENTS_DIR = join(ROOT, 'src', 'components');

/* -------------------------------------------------------------------------- */
/*  Discover groups                                                           */
/* -------------------------------------------------------------------------- */

function discoverGroups(): string[] {
  return readdirSync(COMPONENTS_DIR).filter((entry) => {
    const idx = join(COMPONENTS_DIR, entry, 'index.ts');
    return statSync(join(COMPONENTS_DIR, entry)).isDirectory() && existsSync(idx);
  });
}

/* -------------------------------------------------------------------------- */
/*  Build exports map                                                         */
/* -------------------------------------------------------------------------- */

function buildExports(groups: string[]) {
  const exports: Record<string, string> = {
    './styles/*': './src/styles/*',
    './lib/*': './src/lib/*.ts',
  };

  for (const group of groups) {
    exports[`./${group}`] = `./src/components/${group}/index.ts`;
  }

  return exports;
}

/* -------------------------------------------------------------------------- */
/*  Main                                                                      */
/* -------------------------------------------------------------------------- */

function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check');

  const groups = discoverGroups();

  const currentPkg = JSON.parse(readFileSync(PKG_JSON, 'utf-8'));
  const newExports = buildExports(groups);

  const currentExports = currentPkg.exports || {};
  function sortKeys<T extends Record<string, unknown>>(obj: T): T {
    return Object.keys(obj).sort().reduce((acc, key) => {
      (acc as Record<string, unknown>)[key] = obj[key];
      return acc;
    }, {} as T);
  }
  const currentExportsStr = JSON.stringify(sortKeys(currentExports), null, 2);
  const newExportsStr = JSON.stringify(sortKeys(newExports), null, 2);

  if (currentExportsStr === newExportsStr) {
    console.log('exports map is up to date');
    process.exit(0);
  }

  if (checkOnly) {
    console.error('exports map is stale. Run `bun run scripts/generate-exports.ts` to regenerate.');
    process.exit(1);
  }

  currentPkg.exports = newExports;
  writeFileSync(PKG_JSON, JSON.stringify(currentPkg, null, 2) + '\n');
  console.log('regenerated exports map in package.json');
}

main();
