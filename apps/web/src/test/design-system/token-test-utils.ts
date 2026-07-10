// fallow-ignore-file code-duplication -- Intentional: design system test utility duplication between app and ui package due to local path resolution needs
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Shared helpers for design-system token tests.
 *
 * Centralises the `tokens.css` file-resolution and regex-extraction boilerplate
 * that was previously duplicated across `motion-tokens.test.ts`,
 * `z-layering.test.ts`, and `glass-contrast.test.ts`.
 */

const testDir = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(testDir, '../../../../..');

/** Raw content of `packages/ui/src/styles/tokens.css`. */
export const tokenCss = readFileSync(
  path.join(repoRoot, 'packages/ui/src/styles/tokens.css'),
  'utf8',
);

/** Raw content of `packages/ui/src/styles/theme.css`. */
export const themeCss = readFileSync(
  path.join(repoRoot, 'packages/ui/src/styles/theme.css'),
  'utf8',
);

/** Raw content of `packages/ui/src/styles/component-tokens.css`. */
export const componentTokensCss = readFileSync(
  path.join(repoRoot, 'packages/ui/src/styles/component-tokens.css'),
  'utf8',
);

/**
 * Reads a duration token (in `ms`) and returns its value in seconds.
 * @example readDurationSeconds('--duration-base') // 0.2
 */
export function readDurationSeconds(name: string): number {
  const match = tokenCss.match(new RegExp(`${name}:\\s*(\\d+)ms`));
  if (!match?.[1]) throw new Error(`Missing duration token: ${name}`);
  return Number(match[1]) / 1000;
}

/**
 * Reads a unitless numeric token (first numeric run in the value, with optional
 * leading sign). Handles both positive (`0.97`) and negative (`-0.5`) tokens.
 * @example readUnitless('--press-scale') // 0.97
 * @example readUnitless('--hover-lift-y') // -0.5
 */
export function readUnitless(name: string): number {
  const match = tokenCss.match(new RegExp(`${name}:\\s*(-?[\\d.]+)`));
  if (!match?.[1]) throw new Error(`Missing token: ${name}`);
  return Number(match[1]);
}

/**
 * Reads a z-index token (integer, may be negative).
 * @example readZIndex('--z-toast') // 1200
 */
export function readZIndex(name: string): number {
  const match = tokenCss.match(new RegExp(`${name}:\\s*(-?\\d+)`));
  if (!match?.[1]) throw new Error(`Missing z-index token: ${name}`);
  return Number(match[1]);
}

/**
 * Reads the raw (trimmed) value of any `tokens.css` `:root` token — the first
 * definition wins, which is the light/root value (the `.dark` override, if any,
 * comes later in the file). Use when the value is not a bare number (e.g.
 * `0.625rem`, `8px`, `8%`) and the typed readers above don't fit.
 * @example readToken('--radius-base') // '0.625rem'
 */
export function readToken(name: string): string {
  const match = tokenCss.match(new RegExp(`${name}:\\s*([^;]+);`));
  if (!match?.[1]) throw new Error(`Missing token: ${name}`);
  return match[1].trim();
}
