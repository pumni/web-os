/*
 * Shared token resolver for the `@pumni/ui` design system.
 * Created as part of the unified token resolver architecture.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseOklch, formatOklch, type Oklch } from '../../src/lib/oklch';

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
export type Accent = 'coral' | 'cyan' | 'indigo' | 'violet' | 'rose';

export function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Extract `--name: value;` pairs from the first `selector { … }` block. */
export function readVariables(source: string, selector: string): Map<string, string> {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = stripComments(source).match(new RegExp(`${escaped}\\s*\\{(?<body>[\\s\\S]*?)\\}`));
  const variables = new Map<string, string>();
  for (const variable of (match?.groups?.body ?? '').matchAll(
    /(?<name>--[\w-]+):\s*(?<value>[^;]+);/g,
  )) {
    const { name, value } = variable.groups ?? {};
    if (name && value) variables.set(name, value.trim());
  }
  return variables;
}

/** Extract variable declarations in specific CSS selectors (e.g. personalization blocks). */
export function readBlock(source: string, selector: string): Map<string, string> {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = stripComments(source).match(
    new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{(?<body>[^}]*)\\}`, 'm'),
  );
  const vars = new Map<string, string>();
  for (const variable of (match?.groups?.body ?? '').matchAll(
    /(?<name>--[\w-]+):\s*(?<value>[^;]+);/g,
  )) {
    if (variable.groups?.name && variable.groups?.value) {
      vars.set(variable.groups.name, variable.groups.value.trim());
    }
  }
  return vars;
}

/**
 * Build the resolved token map for a theme mode: primitives (tokens.css) +
 * brand contract + semantic layer + component layers.
 */
export function buildTokenMap(mode: Mode): Map<string, string> {
  const map = readVariables(css.tokens, ':root');
  map.set('__mode', mode);
  for (const [name, value] of readVariables(css.brand, ':root')) {
    map.set(name, value);
  }
  for (const [name, value] of readVariables(css.theme, ':root')) {
    map.set(name, value);
  }
  for (const [name, value] of readVariables(css.component, ':root')) {
    map.set(name, value);
  }
  if (mode === 'dark') {
    for (const layer of [css.tokens, css.brand, css.theme, css.component]) {
      for (const [name, value] of readVariables(layer, '.dark')) {
        map.set(name, value);
      }
    }
  }
  return map;
}

export function buildAccentTokenMap(mode: Mode, accent: Accent): Map<string, string> {
  const map = buildTokenMap(mode);
  if (accent === 'coral') return map;

  for (const [name, value] of readBlock(css.personalization, `[data-accent="${accent}"]`)) {
    map.set(name, value);
  }
  if (mode === 'dark') {
    for (const [name, value] of readBlock(css.personalization, `.dark[data-accent="${accent}"]`)) {
      map.set(name, value);
    }
  }
  for (const [name, value] of readBlock(css.personalization, `[data-accent]`)) {
    map.set(name, value);
  }
  if (mode === 'dark') {
    for (const [name, value] of readBlock(css.personalization, `.dark[data-accent]`)) {
      map.set(name, value);
    }
  }
  return map;
}

export function splitTopLevelCommas(str: string): string[] {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '(') depth++;
    else if (char === ')') depth--;

    if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts;
}

export function mixOklch(a: Oklch, b: Oklch, weightA: number): Oklch {
  const weightB = 1 - weightA;
  const alpha = a.alpha * weightA + b.alpha * weightB;

  const aAchromatic = a.c < 1e-4;
  const bAchromatic = b.c < 1e-4;
  let h: number;
  if (aAchromatic && bAchromatic) {
    h = 0;
  } else if (aAchromatic) {
    h = b.h;
  } else if (bAchromatic) {
    h = a.h;
  } else {
    let deltaHue = b.h - a.h;
    if (deltaHue > 180) deltaHue -= 360;
    if (deltaHue < -180) deltaHue += 360;
    h = (a.h + weightB * deltaHue + 360) % 360;
  }

  if (alpha === 0) return { l: 0, c: 0, h, alpha: 0 };

  const l = (a.l * a.alpha * weightA + b.l * b.alpha * weightB) / alpha;
  const c = (a.c * a.alpha * weightA + b.c * b.alpha * weightB) / alpha;
  return { l, c, h, alpha };
}

const VAR = /^var\(\s*(--[\w-]+)\s*(?:,\s*([\s\S]+))?\)$/;

export function resolveValue(value: string, map: Map<string, string>, seen: Set<string>): string {
  const trimmed = value.trim();
  const match = trimmed.match(VAR);
  if (match) {
    const [, ref, fallback] = match;
    if (ref && map.has(ref) && !seen.has(ref)) {
      const nextSeen = new Set(seen);
      nextSeen.add(ref);
      return resolveValue(map.get(ref)!, map, nextSeen);
    }
    if (fallback) return resolveValue(fallback, map, seen);
    throw new Error(`Cannot resolve ${value} (missing ${ref}, no fallback)`);
  }

  if (trimmed.startsWith('light-dark(')) {
    const lightDarkMatch = trimmed.match(/^light-dark\(\s*(?<inner>[\s\S]+)\s*\)$/);
    if (lightDarkMatch?.groups?.inner) {
      const parts = splitTopLevelCommas(lightDarkMatch.groups.inner).map(p => p.trim());
      const mode = map.get('__mode') || 'light';
      const branch = mode === 'dark' ? parts[1] : parts[0];
      if (!branch) throw new Error(`Invalid light-dark value: ${value}`);
      return resolveValue(branch, map, seen);
    }
  }

  if (trimmed.startsWith('oklch(from ')) {
    const color = resolveColorValue(trimmed, map, seen);
    return color.alpha === 1
      ? formatOklch(color)
      : formatOklch(color, { alpha: color.alpha });
  }

  return trimmed;
}

export function resolveLiteral(name: string, map: Map<string, string>): string {
  if (!map.has(name)) throw new Error(`Unknown token: ${name}`);
  return resolveValue(map.get(name)!, map, new Set([name]));
}

function parseRelativeColor(value: string): { baseColor: string; lExpr: string; cExpr: string; hExpr: string; aExpr?: string } | null {
  const match = value.trim().match(/^oklch\(\s*from\s+(?<rest>.+)\)$/s);
  if (!match?.groups?.rest) return null;
  const rest = match.groups.rest.trim();
  
  let depth = 0;
  let colorEnd = -1;
  for (let i = 0; i < rest.length; i++) {
    const char = rest[i];
    if (char === '(') depth++;
    else if (char === ')') depth--;
    else if ((char === ' ' || char === '\t') && depth === 0) {
      colorEnd = i;
      break;
    }
  }
  if (colorEnd === -1) return null;
  
  const baseColor = rest.slice(0, colorEnd).trim();
  const remains = rest.slice(colorEnd).trim();
  
  let slashIdx = -1;
  depth = 0;
  for (let i = 0; i < remains.length; i++) {
    const char = remains[i];
    if (char === '(') depth++;
    else if (char === ')') depth--;
    else if (char === '/' && depth === 0) {
      slashIdx = i;
      break;
    }
  }
  
  let channelsPart = remains;
  let aExpr: string | undefined;
  if (slashIdx !== -1) {
    channelsPart = remains.slice(0, slashIdx).trim();
    aExpr = remains.slice(slashIdx + 1).trim();
  }
  
  const channels: string[] = [];
  let current = '';
  depth = 0;
  for (let i = 0; i < channelsPart.length; i++) {
    const char = channelsPart[i];
    if (char === '(') depth++;
    else if (char === ')') depth--;
    
    if ((char === ' ' || char === '\t') && depth === 0) {
      if (current.trim()) {
        channels.push(current.trim());
        current = '';
      }
    } else {
      current += char;
    }
  }
  if (current.trim()) {
    channels.push(current.trim());
  }
  
  if (channels.length !== 3) {
    throw new Error(`Expected exactly 3 color channels in relative color syntax: ${value}`);
  }
  
  return {
    baseColor,
    lExpr: channels[0]!,
    cExpr: channels[1]!,
    hExpr: channels[2]!,
    aExpr,
  };
}

function resolveVariablesInExpression(expr: string, tokenMap: Map<string, string>, seen: Set<string>): string {
  return expr.replace(/var\(\s*(--[\w-]+)\s*\)/g, (match, name) => {
    const rawVal = tokenMap.get(name);
    if (!rawVal) throw new Error(`Missing token during expression resolution: ${name}`);
    return resolveValue(rawVal, tokenMap, seen);
  });
}

function evalChannel(expr: string, baseVal: number, ident: string, tokenMap: Map<string, string>, seen: Set<string>): number {
  const resolvedExpr = resolveVariablesInExpression(expr, tokenMap, seen);
  const clean = resolvedExpr.trim().toLowerCase();
  if (clean === ident) {
    return baseVal;
  }
  if (/^-?[\d.]+$/.test(clean)) {
    return Number(clean);
  }
  const calcMatch = clean.match(/^calc\(\s*([a-z]+)\s*([+\-*])\s*(-?[\d.]+)\s*\)$/);
  if (calcMatch) {
    const [, calcIdent, op, numStr] = calcMatch;
    if (calcIdent !== ident) {
      throw new Error(`Invalid identifier in calc expression: expected '${ident}', got '${calcIdent}'`);
    }
    const val = Number(numStr);
    if (op === '+') return baseVal + val;
    if (op === '-') return baseVal - val;
    if (op === '*') return baseVal * val;
  }
  throw new Error(`Unsupported channel expression grammar: '${expr}' (resolved: '${resolvedExpr}')`);
}

export function resolveColorValue(value: string, tokenMap: Map<string, string>, seen: Set<string>): Oklch {
  const normalized = value.replace(/\s+/g, ' ').trim();

  if (normalized === 'transparent') {
    return { l: 0, c: 0, h: 0, alpha: 0 };
  }

  const varMatch = normalized.match(/^var\((?<name>--[\w-]+)\)$/);
  if (varMatch?.groups?.name) {
    return resolveColor(varMatch.groups.name, tokenMap, seen);
  }

  if (normalized.startsWith('oklch(')) {
    if (normalized.startsWith('oklch(from ')) {
      const parsed = parseRelativeColor(normalized);
      if (!parsed) throw new Error(`Invalid relative color syntax: ${normalized}`);
      const baseVal = resolveValue(parsed.baseColor, tokenMap, seen);
      const base = resolveColorValue(baseVal, tokenMap, seen);
      const l = evalChannel(parsed.lExpr, base.l, 'l', tokenMap, seen);
      const c = evalChannel(parsed.cExpr, base.c, 'c', tokenMap, seen);
      const h = evalChannel(parsed.hExpr, base.h, 'h', tokenMap, seen);
      const alpha = parsed.aExpr ? evalChannel(parsed.aExpr, base.alpha, 'alpha', tokenMap, seen) : base.alpha;
      return { l, c, h, alpha };
    }
    return parseOklch(normalized);
  }

  const mixMatch = normalized.match(/^color-mix\(\s*in\s+oklch\s*,\s*(?<inner>.+)\)$/);
  if (mixMatch?.groups?.inner) {
    const parts = splitTopLevelCommas(mixMatch.groups.inner).map((part) => part.trim());
    const aPart = parts[0] ?? '';
    const bPart = parts[1] ?? '';
    const aWeighted = aPart.match(/^(?<expr>.+?)\s+(?<pct>[\d.]+)%$/);
    const bWeighted = bPart.match(/^(?<expr>.+?)\s+(?<pct>[\d.]+)%$/);
    const aExpr = aWeighted?.groups?.expr ?? aPart;
    const bExpr = bWeighted?.groups?.expr ?? bPart;
    const weightA = aWeighted?.groups?.pct
      ? Number(aWeighted.groups.pct) / 100
      : bWeighted?.groups?.pct
        ? 1 - Number(bWeighted.groups.pct) / 100
        : 0.5;
    
    const aVal = resolveValue(aExpr, tokenMap, seen);
    const bVal = resolveValue(bExpr, tokenMap, seen);
    const a = resolveColorValue(aVal, tokenMap, seen);
    const b = resolveColorValue(bVal, tokenMap, seen);
    return mixOklch(a, b, weightA);
  }

  throw new Error(`Unsupported color value: ${normalized}`);
}

export function resolveColor(
  name: string,
  tokenMap: Map<string, string>,
  seen = new Set<string>(),
): Oklch {
  if (seen.has(name)) {
    throw new Error(`Circular token reference: ${[...seen, name].join(' -> ')}`);
  }
  const value = tokenMap.get(name);
  if (!value) {
    throw new Error(`Missing token: ${name}`);
  }
  const nextSeen = new Set(seen);
  nextSeen.add(name);
  const resolved = resolveValue(value, tokenMap, nextSeen);
  return resolveColorValue(resolved, tokenMap, nextSeen);
}

export function resolveOklch(name: string, map: Map<string, string>): Oklch {
  const literal = resolveLiteral(name, map);
  if (!literal.startsWith('oklch(')) {
    throw new Error(`Token ${name} does not resolve to an oklch() literal (got: ${literal})`);
  }
  return parseOklch(literal);
}
