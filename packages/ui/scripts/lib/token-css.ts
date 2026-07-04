/*
 * Shared CSS-token parsing for the `@pumni/ui` build scripts (export-dtcg).
 * Mirrors the regex-over-file approach the design-system token
 * TESTS use (apps/web/src/test/design-system) so scripts and gates read the
 * token files the same way — but lives here so non-test tooling can import it.
 *
 * Resolution is deliberately limited to `var()` chains down to a literal. It
 * does NOT evaluate `color-mix()` (the authoritative APCA gate owns that math);
 * callers that need a concrete colour must target tokens whose chain bottoms out
 * at an `oklch(...)` literal.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseOklch, type Oklch } from '../../src/lib/oklch';

const scriptsDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const uiRoot = path.dirname(scriptsDir);
const stylesDir = path.join(uiRoot, 'src/styles');

const readStyle = (name: string) => readFileSync(path.join(stylesDir, `${name}.css`), 'utf8');

export const css = {
  tokens: readStyle('tokens'),
  brand: readStyle('brand'),
  theme: readStyle('theme'),
  component: readStyle('component-tokens'),
  personalization: readStyle('personalization'),
} as const;

export type Mode = 'light' | 'dark';

/** Extract `--name: value;` pairs from the first `selector { … }` block. */
export function readVariables(source: string, selector: ':root' | '.dark'): Map<string, string> {
  const escaped = selector.replace('.', '\\.');
  const match = source.match(new RegExp(`${escaped}\\s*\\{(?<body>[\\s\\S]*?)\\}`));
  const variables = new Map<string, string>();
  for (const variable of (match?.groups?.body ?? '').matchAll(
    /(?<name>--[\w-]+):\s*(?<value>[^;]+);/g,
  )) {
    const { name, value } = variable.groups ?? {};
    if (name && value) variables.set(name, value.trim());
  }
  return variables;
}

/**
 * Build the resolved token map for a theme mode: primitives (tokens.css) +
 * brand contract + semantic layer, with `.dark` overrides layered last. Same
 * layering order the app's globals.css imports establish and the
 * glass-contrast gate replays.
 */
export function buildTokenMap(mode: Mode): Map<string, string> {
  const map = new Map<string, string>();
  for (const layer of [css.tokens, css.brand, css.theme, css.component]) {
    for (const [name, value] of readVariables(layer, ':root')) map.set(name, value);
  }
  if (mode === 'dark') {
    for (const layer of [css.tokens, css.brand, css.theme, css.component]) {
      for (const [name, value] of readVariables(layer, '.dark')) map.set(name, value);
    }
  }
  return map;
}

const VAR = /^var\(\s*(--[\w-]+)\s*(?:,\s*([\s\S]+))?\)$/;

/** Resolve a value (following `var()` + fallbacks) to its bottom literal string. */
function resolveValue(value: string, map: Map<string, string>, seen: Set<string>): string {
  const match = value.trim().match(VAR);
  if (!match) return value.trim();
  const [, ref, fallback] = match;
  if (ref && map.has(ref) && !seen.has(ref)) {
    seen.add(ref);
    return resolveValue(map.get(ref)!, map, seen);
  }
  if (fallback) return resolveValue(fallback, map, seen);
  throw new Error(`Cannot resolve ${value} (missing ${ref}, no fallback)`);
}

/** Resolve a token name to its bottom literal string (or throw if undefined). */
export function resolveLiteral(name: string, map: Map<string, string>): string {
  if (!map.has(name)) throw new Error(`Unknown token: ${name}`);
  return resolveValue(map.get(name)!, map, new Set([name]));
}

/**
 * Resolve a token name to a concrete OKLCH colour. Throws if the chain bottoms
 * out at a non-`oklch()` literal (e.g. a `color-mix()`), which is intentionally
 * out of scope — the caller should not pass colour tokens that need mixing.
 */
export function resolveOklch(name: string, map: Map<string, string>): Oklch {
  const literal = resolveLiteral(name, map);
  if (!literal.startsWith('oklch(')) {
    throw new Error(`Token ${name} does not resolve to an oklch() literal (got: ${literal})`);
  }
  return parseOklch(literal);
}
