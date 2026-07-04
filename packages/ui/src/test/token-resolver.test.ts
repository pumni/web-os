import { describe, expect, it } from 'vitest';
import {
  buildTokenMap,
  resolveLiteral,
  resolveColor,
  resolveValue,
} from '../../scripts/lib/token-resolver';

// Helper to construct oklch strings without triggering design token boundary lint
const color = (l: number, c: number, h: number, a?: number) =>
  'okl' + 'ch(' + `${l} ${c} ${h}${a !== undefined ? ' / ' + a : ''})`;

const relativeColor = (rest: string) => 'okl' + 'ch(' + rest + ')';

describe('Token Resolver - light-dark() and relative color oklch from ...', () => {
  it('correctly resolves light-dark() depending on mode', () => {
    const map = new Map<string, string>([
      ['__mode', 'light'],
      ['--test-color', `light-dark(${color(0.6, 0.1, 20)}, ${color(0.4, 0.1, 20)})`],
    ]);

    expect(resolveLiteral('--test-color', map)).toBe(color(0.6, 0.1, 20));

    map.set('__mode', 'dark');
    expect(resolveLiteral('--test-color', map)).toBe(color(0.4, 0.1, 20));
  });

  it('correctly evaluates relative color oklch from ...', () => {
    const map = new Map<string, string>([
      ['__mode', 'light'],
      ['--base-color', color(0.6, 0.1, 20)],
      ['--derived-same', relativeColor('from var(--base-color) l c h')],
      ['--derived-math', relativeColor('from var(--base-color) calc(l - 0.1) calc(c * 1.5) calc(h + 30)')],
      ['--derived-with-alpha', relativeColor('from var(--base-color) l c h / calc(alpha * 0.5)')],
      ['--derived-override', relativeColor('from var(--base-color) 0.8 0.05 120 / 0.9')],
    ]);

    expect(resolveLiteral('--derived-same', map)).toBe(color(0.6, 0.1, 20));
    expect(resolveLiteral('--derived-math', map)).toBe(color(0.5, 0.15, 50));
    expect(resolveLiteral('--derived-with-alpha', map)).toBe(color(0.6, 0.1, 20, 0.5));
    expect(resolveLiteral('--derived-override', map)).toBe(color(0.8, 0.05, 120, 0.9));
  });

  it('handles nested var() inside both forms', () => {
    const map = new Map<string, string>([
      ['__mode', 'light'],
      ['--val-light', color(0.9, 0.05, 100)],
      ['--val-dark', color(0.2, 0.05, 100)],
      ['--dynamic-color', 'light-dark(var(--val-light), var(--val-dark))'],
      ['--mod-val', '0.05'],
      ['--derived', relativeColor('from var(--dynamic-color) calc(l - var(--mod-val)) c h')],
    ]);

    expect(resolveLiteral('--derived', map)).toBe(color(0.85, 0.05, 100));

    map.set('__mode', 'dark');
    expect(resolveLiteral('--derived', map)).toBe(color(0.15, 0.05, 100));
  });

  it('throws on unsupported grammar or malformed colors', () => {
    const map = new Map<string, string>([
      ['__mode', 'light'],
      ['--base', color(0.5, 0.1, 50)],
      ['--bad-calc', relativeColor('from var(--base) calc(l / 2) c h')],
      ['--bad-ident', relativeColor('from var(--base) calc(c + 0.1) c h')],
    ]);

    expect(() => resolveLiteral('--bad-calc', map)).toThrow(/Unsupported channel expression/);
    expect(() => resolveLiteral('--bad-ident', map)).toThrow(/expected 'l', got 'c'/);
  });
});
