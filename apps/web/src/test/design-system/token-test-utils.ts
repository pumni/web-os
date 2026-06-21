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
