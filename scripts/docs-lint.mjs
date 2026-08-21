/**
 * docs:lint — deterministic integrity checks for active documentation.
 *
 * Context discovery structure belongs to context:lint. This check owns only
 * low-noise documentation references that can be verified from the repository
 * or package manifest; it deliberately does not interpret prose as policy.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['.git', '.next', '.turbo', 'node_modules', 'archive']);
let errors = 0;

function error(message) {
  console.error(`[ERROR] ${message}`);
  errors += 1;
}

function absolute(relativePath) {
  return path.join(ROOT, relativePath);
}

function relative(fullPath) {
  return path.relative(ROOT, fullPath).replaceAll(path.sep, '/');
}

function walk(dir, visit) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fullPath, visit);
    else visit(fullPath);
  }
}

function documentationFiles() {
  const files = [];
  walk(ROOT, (fullPath) => {
    if (!fullPath.toLowerCase().endsWith('.md')) return;
    const file = relative(fullPath);
    // Research, archived plans, and historical ADRs are evidence, not active
    // instructions; their old snapshots may intentionally name retired paths.
    if (file.startsWith('docs/plans/archive/')) return;
    if (file.startsWith('docs/research/')) return;
    if (file.startsWith('docs/adr/') && file !== 'docs/adr/README.md') return;
    files.push(file);
  });
  return files.sort();
}

function decodePath(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function checkMarkdownLinks(file, content) {
  const linkPattern = /!?\[[^\]]*\]\(([^)]+)\)/g;
  const dir = path.dirname(absolute(file));
  let match;

  while ((match = linkPattern.exec(content))) {
    const rawTarget = match[1].trim().split(/\s+/, 1)[0];
    const href = decodePath(rawTarget.split(/[?#]/, 1)[0]);
    if (!href || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(href)) continue;

    const target = path.resolve(dir, href);
    if (!fs.existsSync(target)) error(`Broken link in ${file}: ${rawTarget}`);
  }
}

function isRepositoryPath(value) {
  const candidate = value.replaceAll('\\', '/').replace(/[.,;:!?]+$/, '');
  if (!candidate || /\s|[*<>|]/.test(candidate)) return false;
  if (/(?:^|\/)\.env(?:\.|$)/.test(candidate)) return false;
  return /^(?:\.agents|\.claude|\.github|apps|docs|packages|scripts|supabase)(?:\/|$)/.test(candidate)
    || /^(?:AGENTS|CLAUDE|README|SECURITY|package\.json|turbo\.json|\.mcp\.json)(?:$|\/)/.test(candidate);
}

function checkRepositoryPaths(file, content) {
  const inlinePattern = /`([^`\r\n]+)`/g;
  let match;

  while ((match = inlinePattern.exec(content))) {
    const candidate = match[1].trim().replace(/[.,;:!?]+$/, '');
    if (!isRepositoryPath(candidate)) continue;
    if (!fs.existsSync(absolute(candidate))) {
      error(`Broken repository path in ${file}: ${candidate}`);
    }
  }
}

function checkCommands(file, content, scripts) {
  const commandPattern = /\bbun\s+run\s+([a-z0-9][a-z0-9:_-]*)/gi;
  let match;

  while ((match = commandPattern.exec(content))) {
    const command = match[1];
    if (!scripts.has(command)) error(`${file} references missing command: bun run ${command}`);
  }
}

function checkEncoding(file, content) {
  if (content.includes('\uFFFD')) error(`Encoding corruption found in ${file}`);
}

const packageJson = JSON.parse(fs.readFileSync(absolute('package.json'), 'utf8'));
const scripts = new Set(Object.keys(packageJson.scripts ?? {}));
const files = documentationFiles();

console.log(`Running docs integrity linting on ${files.length} Markdown files...`);
for (const file of files) {
  const content = fs.readFileSync(absolute(file), 'utf8');
  checkMarkdownLinks(file, content);
  checkRepositoryPaths(file, content);
  checkCommands(file, content, scripts);
  checkEncoding(file, content);
}

if (errors > 0) {
  console.error(`\nDocs lint failed with ${errors} error(s).`);
  process.exit(1);
}

console.log('Docs integrity linting passed.');
