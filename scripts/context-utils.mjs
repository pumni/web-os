import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_SKIP_DIRS = new Set(['.git', '.next', '.turbo', 'node_modules']);

export function absolute(relativePath) {
  return path.join(ROOT, relativePath);
}

export function relative(fullPath) {
  return path.relative(ROOT, fullPath).replaceAll(path.sep, '/');
}

export function read(relativePath) {
  return fs.readFileSync(absolute(relativePath), 'utf8');
}

function visitEntry(dir, entry, visit, skipDirs) {
  if (entry.isDirectory() && skipDirs.has(entry.name)) return;
  const fullPath = path.join(dir, entry.name);
  if (entry.isDirectory()) walk(fullPath, visit, skipDirs);
  else visit(fullPath, entry.name);
}

export function walk(dir, visit, skipDirs = DEFAULT_SKIP_DIRS) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    visitEntry(dir, entry, visit, skipDirs);
  }
}

export function findFiles(dir, filename, skipDirs = DEFAULT_SKIP_DIRS) {
  const results = [];
  walk(dir, (fullPath, name) => {
    if (name === filename) results.push(fullPath);
  }, skipDirs);
  return results;
}

export function createErrorReporter() {
  let count = 0;
  return {
    error(message) {
      console.error(`[ERROR] ${message}`);
      count += 1;
    },
    get count() {
      return count;
    },
  };
}
