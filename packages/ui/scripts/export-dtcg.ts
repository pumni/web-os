/*
 * Generate a DTCG (Design Tokens Community Group) JSON export of the Pumni OS
 * design tokens — ADR-0021.
 *
 * The hand-authored OKLCH CSS in `src/styles/*` stays the single source of
 * truth; this script reads those files and emits `tokens.dtcg.json` so a second
 * project, Figma, or a native platform can consume the tokens as standard JSON.
 * A drift test (`apps/web/src/test/design-system/dtcg-export.test.ts`) keeps the
 * committed JSON in lockstep with the CSS.
 *
 * Scope: only the `tokens.css :root` tier (Tier-1 primitives + the component
 * tokens defined alongside them) whose value resolves to a SCALAR DTCG type —
 * color (`oklch()`), dimension (`px`/`rem`/`em`), duration (`ms`), or number.
 * Composite values (shadows, gradients, `cubic-bezier()`, `color-mix()`,
 * percentages) are intentionally skipped; the CLI prints the skip count.
 */

import { writeFileSync } from 'node:fs';
import path from 'node:path';

import { buildTokenMap, css, readVariables, resolveLiteral, uiRoot } from './lib/token-css';

export const OUTPUT_PATH = path.join(uiRoot, 'tokens.dtcg.json');

type DtcgValue = string | number | { value: number; unit: string };
type DtcgToken = { $type: 'color' | 'dimension' | 'duration' | 'number'; $value: DtcgValue };
type DtcgGroup = Record<string, DtcgToken>;

/** Map a resolved CSS literal to a scalar DTCG token, or null if non-scalar. */
function classify(raw: string): DtcgToken | null {
  const value = raw.trim();
  if (value.startsWith('oklch(')) return { $type: 'color', $value: value };

  const ms = /^(-?\d+(?:\.\d+)?)ms$/.exec(value);
  if (ms) return { $type: 'duration', $value: { value: Number(ms[1]), unit: 'ms' } };

  const dim = /^(-?[\d.]+)(px|rem|em)$/.exec(value);
  if (dim) return { $type: 'dimension', $value: { value: Number(dim[1]), unit: dim[2]! } };

  if (/^-?[\d.]+$/.test(value)) return { $type: 'number', $value: Number(value) };

  return null;
}

export function buildDtcg(): { tree: Record<string, DtcgGroup>; skipped: string[] } {
  // The full light-mode map resolves component tokens that point at the semantic
  // layer (e.g. --switch-track-checked → --primary → --brand-primary → coral).
  const map = buildTokenMap('light');
  const exportNames = [...readVariables(css.tokens, ':root').keys()];

  const tree: Record<string, DtcgGroup> = {};
  const skipped: string[] = [];

  for (const name of exportNames) {
    let token: DtcgToken | null = null;
    try {
      token = classify(resolveLiteral(name, map));
    } catch {
      token = null;
    }
    if (!token) {
      skipped.push(name);
      continue;
    }

    const bare = name.slice(2); // strip leading "--"
    const dash = bare.indexOf('-');
    const group = dash === -1 ? 'misc' : bare.slice(0, dash);
    const key = dash === -1 ? bare : bare.slice(dash + 1);
    (tree[group] ??= {})[key] = token;
  }

  return { tree, skipped };
}

/** Deterministic (sorted) DTCG document string — the committed artifact. */
export function buildDtcgJson(): string {
  const { tree } = buildDtcg();

  const sorted: Record<string, DtcgGroup> = {};
  for (const group of Object.keys(tree).sort()) {
    const groupTokens: DtcgGroup = {};
    for (const key of Object.keys(tree[group]!).sort()) groupTokens[key] = tree[group]![key]!;
    sorted[group] = groupTokens;
  }

  const doc = {
    $description:
      'Pumni OS design tokens (DTCG). GENERATED from packages/ui/src/styles/*.css — ' +
      'do not edit by hand. Regenerate with `bun run --filter @pumni/ui export-dtcg`.',
    ...sorted,
  };

  return `${JSON.stringify(doc, null, 2)}\n`;
}

if (import.meta.main) {
  const json = buildDtcgJson();
  writeFileSync(OUTPUT_PATH, json);
  const { skipped } = buildDtcg();
  console.log(`Wrote ${path.relative(uiRoot, OUTPUT_PATH)} (${json.length} bytes).`);
  console.log(
    `Skipped ${skipped.length} non-scalar tokens (shadow/gradient/cubic-bezier/color-mix/%).`,
  );
}
