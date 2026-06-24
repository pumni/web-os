import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { repoRoot } from './token-test-utils';

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

function findVTNames(content: string): string[] {
  const names: string[] = [];
  // Regex to match viewTransitionName: 'name' or "name" or `name`
  const regex = /viewTransitionName\s*:\s*['"`]([^'"`\s{}]+)['"`]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (match[1]) {
      names.push(match[1]);
    }
  }
  return names;
}

describe('View Transition Name Uniqueness', () => {
  const appFeaturesDir = path.join(repoRoot, 'apps/web/src/features');
  const appRoutesDir = path.join(repoRoot, 'apps/web/src/app');
  const uiComponentsDir = path.join(repoRoot, 'packages/ui/src/components');

  const files = [
    ...getFiles(appFeaturesDir),
    ...getFiles(appRoutesDir),
    ...getFiles(uiComponentsDir),
  ];

  it('ensures all static viewTransitionName definitions are unique across the app', () => {
    const nameToFilesMap: Record<string, string[]> = {};

    for (const file of files) {
      const relativePath = path.relative(repoRoot, file);
      const content = readFileSync(file, 'utf8');
      const names = findVTNames(content);
      for (const name of names) {
        if (!nameToFilesMap[name]) {
          nameToFilesMap[name] = [];
        }
        nameToFilesMap[name].push(relativePath);
      }
    }

    const duplicates: string[] = [];
    for (const [name, filesUsingIt] of Object.entries(nameToFilesMap)) {
      if (filesUsingIt.length > 1) {
        duplicates.push(`- "${name}" is used in: ${filesUsingIt.join(', ')}`);
      }
    }

    if (duplicates.length > 0) {
      throw new Error(
        `Duplicate View Transition Names detected! Each view-transition-name must be unique across the document to prevent collision/stretching: \n${duplicates.join('\n')}`,
      );
    }

    expect(duplicates.length).toBe(0);
  });
});
