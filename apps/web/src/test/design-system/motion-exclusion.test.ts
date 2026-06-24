import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { repoRoot } from './token-test-utils';

/**
 * Identity Exclusivity guard (Conformity analysis gap 3.1).
 *
 * This test prevents design conflict by ensuring that a DOM element does not
 * participate in multiple animation systems simultaneously. Specifically, a single
 * DOM element must not declare a `view-transition-name` / `viewTransitionName`
 * AND Framer Motion layout-transforming properties (such as `layout`, `layoutId`,
 * `drag`, or @pumni/ui recipes like `hoverLift`, `pressScale`, `draggableSurface`).
 *
 * Doing so can confuse the browsers' layout engines or lead to conflict/stretching.
 */

function getFiles(dir: string): string[] {
  const files: string[] = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        if (entry !== 'node_modules' && entry !== '.next' && entry !== 'dist' && entry !== 'test') {
          files.push(...getFiles(fullPath));
        }
      } else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err);
  }
  return files;
}

function checkIdentityExclusivity(content: string): string[] {
  const violations: string[] = [];
  // Basic regex to find JSX opening tags (since they can span multiple lines)
  // Match `<tagname ... >` where tagname starts with a letter or motion.
  const tagRegex = /<([a-zA-Z0-9._\-:]+)([^>]*)/g;
  let match;
  while ((match = tagRegex.exec(content)) !== null) {
    const tagName = match[1];
    const attrs = match[2];

    if (!tagName || attrs === undefined) continue;

    const hasVT = attrs.includes('viewTransitionName') || attrs.includes('view-transition-name');
    if (hasVT) {
      const isMotion = tagName.startsWith('motion.');
      const hasLayout = /\blayout\b/.test(attrs);
      const hasLayoutId = /\blayoutId\b/.test(attrs);
      const hasDrag = /\bdrag\b/.test(attrs);
      const hasRecipe = /recipes\./.test(attrs);

      if (isMotion || hasLayout || hasLayoutId || hasDrag || hasRecipe) {
        violations.push(`<${tagName} ${attrs.trim().replace(/\s+/g, ' ')}>`);
      }
    }
  }
  return violations;
}

describe('Animation Identity Exclusivity (Conformity Guard)', () => {
  const appFeaturesDir = path.join(repoRoot, 'apps/web/src/features');
  const uiComponentsDir = path.join(repoRoot, 'packages/ui/src/components');

  const files = [...getFiles(appFeaturesDir), ...getFiles(uiComponentsDir)];

  it('ensures no DOM elements use both View Transitions and Framer Motion properties simultaneously', () => {
    const allViolations: { file: string; tags: string[] }[] = [];

    for (const file of files) {
      const relativePath = path.relative(repoRoot, file);
      const content = readFileSync(file, 'utf8');
      const violations = checkIdentityExclusivity(content);
      if (violations.length > 0) {
        allViolations.push({ file: relativePath, tags: violations });
      }
    }

    if (allViolations.length > 0) {
      const formatted = allViolations
        .map((v) => `- ${v.file}:\n  ${v.tags.map((t) => `  * ${t}`).join('\n')}`)
        .join('\n');
      throw new Error(
        `Identity Exclusivity Violation: Found DOM elements mixing view-transition-names with Framer Motion attributes/recipes:\n${formatted}`,
      );
    }

    expect(allViolations.length).toBe(0);
  });

  it('ensures all glass utilities defined in glass.css have a prefers-reduced-transparency fallback', () => {
    const glassCssPath = path.join(repoRoot, 'packages/ui/src/styles/glass.css');
    const content = readFileSync(glassCssPath, 'utf8');

    // Find all utility definitions starting with glass-
    const utilityRegex = /@utility\s+(glass-[a-zA-Z0-9-]+)/g;
    const utilities: string[] = [];
    let match;
    while ((match = utilityRegex.exec(content)) !== null) {
      const utilityName = match[1];
      if (utilityName) {
        utilities.push(utilityName);
      }
    }

    // Find the prefers-reduced-transparency media query block
    const mediaQueryRegex =
      /@media\s*\(\s*prefers-reduced-transparency\s*:\s*reduce\s*\)\s*\{([^}]+)\}/g;
    const mediaQueryMatch = mediaQueryRegex.exec(content);

    expect(mediaQueryMatch).not.toBeNull();
    const fallbackBlock = mediaQueryMatch?.[1] ?? '';

    for (const utility of utilities) {
      const classSelector = `.${utility}`;
      expect(fallbackBlock).toContain(classSelector);
    }
  });
});
