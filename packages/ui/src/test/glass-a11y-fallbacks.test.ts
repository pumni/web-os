import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const glassCss = readFileSync(resolve(import.meta.dirname, '../styles/glass.css'), 'utf8');

function extractMediaBlock(css: string, mediaQuery: string): string {
  const mediaIndex = css.indexOf(mediaQuery);
  if (mediaIndex === -1) return '';

  // Find the opening brace of the media query
  const startBrace = css.indexOf('{', mediaIndex);
  if (startBrace === -1) return '';

  let braceCount = 1;
  let currentIndex = startBrace + 1;

  while (braceCount > 0 && currentIndex < css.length) {
    const char = css[currentIndex];
    if (char === '{') {
      braceCount++;
    } else if (char === '}') {
      braceCount--;
    }
    currentIndex++;
  }

  return css.slice(startBrace + 1, currentIndex - 1);
}

function extractSelectorBlock(css: string, selector: string): string {
  const selIndex = css.indexOf(selector);
  if (selIndex === -1) return '';

  const startBrace = css.indexOf('{', selIndex);
  if (startBrace === -1) return '';

  let braceCount = 1;
  let currentIndex = startBrace + 1;

  while (braceCount > 0 && currentIndex < css.length) {
    const char = css[currentIndex];
    if (char === '{') {
      braceCount++;
    } else if (char === '}') {
      braceCount--;
    }
    currentIndex++;
  }

  return css.slice(startBrace + 1, currentIndex - 1);
}

describe('glass accessibility fallbacks', () => {
  it('densifies both chrome and readable tints in prefers-contrast: more media query', () => {
    const mediaBlock = extractMediaBlock(glassCss, '@media (prefers-contrast: more)');
    expect(mediaBlock, 'prefers-contrast: more media query block exists').not.toBe('');

    // Both tints should be overridden with denser/fallback values
    expect(mediaBlock).toMatch(/--glass-tint-chrome\s*:\s*color-mix/);
    expect(mediaBlock).toMatch(/--glass-tint-readable\s*:\s*color-mix/);
  });

  it('densifies both chrome and readable tints in data-contrast=more preview selector', () => {
    const previewBlock = extractSelectorBlock(
      glassCss,
      ".glass-a11y-preview[data-contrast='more']",
    );
    expect(previewBlock, 'data-contrast=more preview selector block exists').not.toBe('');

    expect(previewBlock).toMatch(/--glass-tint-chrome\s*:\s*color-mix/);
    expect(previewBlock).toMatch(/--glass-tint-readable\s*:\s*color-mix/);
  });

  it('forces opaque background and drops blur in prefers-reduced-transparency media query', () => {
    const mediaBlock = extractMediaBlock(glassCss, '@media (prefers-reduced-transparency: reduce)');
    expect(mediaBlock, 'prefers-reduced-transparency block exists').not.toBe('');

    expect(mediaBlock).toMatch(/--glass-bg-resolved\s*:\s*var\(--glass-fallback-bg\)/);
    expect(mediaBlock).toMatch(/--glass-backdrop-resolved\s*:\s*none/);
  });

  it('forces opaque background and drops blur in data-transparency=reduced preview selector', () => {
    const previewBlock = extractSelectorBlock(
      glassCss,
      ".glass-a11y-preview[data-transparency='reduced']",
    );
    expect(previewBlock, 'data-transparency=reduced preview block exists').not.toBe('');

    expect(previewBlock).toMatch(/--glass-bg-resolved\s*:\s*var\(--glass-fallback-bg\)/);
    expect(previewBlock).toMatch(/--glass-backdrop-resolved\s*:\s*none/);
  });
});
