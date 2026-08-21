/**
 * docs:lint — deterministic integrity checks for active documentation.
 *
 * Context discovery structure belongs to context:lint. This check owns only
 * low-noise documentation references that can be verified from the repository
 * or package manifest; it deliberately does not interpret prose as policy.
 */

import fs from 'node:fs';
import path from 'node:path';
import { absolute, createErrorReporter, relative, ROOT, walk } from './context-utils.mjs';
const SKIP_DIRS = new Set(['.git', '.next', '.turbo', 'node_modules', 'archive']);
const reporter = createErrorReporter();
const { error } = reporter;

function documentationFiles() {
  const files = [];
  walk(ROOT, (fullPath) => collectDocumentationFile(files, fullPath), SKIP_DIRS);
  return files.sort();
}

function collectDocumentationFile(files, fullPath) {
  if (!fullPath.toLowerCase().endsWith('.md')) return;
  const file = relative(fullPath);
  if (!isActiveDocumentation(file, fullPath)) return;
  files.push(file);
}

function isActiveDocumentation(file, fullPath) {
  return !isRetiredEvidence(file) && isActiveAdr(file, fullPath);
}

function isRetiredEvidence(file) {
  return file.startsWith('docs/plans/archive/') || file.startsWith('docs/research/');
}

function isActiveAdr(file, fullPath) {
  if (!file.startsWith('docs/adr/')) return true;
  if (file === 'docs/adr/README.md') return true;
  const content = fs.readFileSync(fullPath, 'utf8');
  return !isRetiredAdrStatus(content);
}

function isRetiredAdrStatus(content) {
  const status = content.match(/^[-*]\s+\*\*Status:\*\*\s+(.+)$/m)?.[1] ?? '';
  return /^(?:Deprecated|Superseded)\b/i.test(status);
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
    checkMarkdownLink(file, dir, match[1]);
  }
}

function checkMarkdownLink(file, dir, targetText) {
  const rawTarget = targetText.trim().split(/\s+/, 1)[0];
  const href = decodePath(rawTarget.split(/[?#]/, 1)[0]);
  if (!isLocalLink(href)) return;
  const target = path.resolve(dir, href);
  if (!fs.existsSync(target)) error(`Broken link in ${file}: ${rawTarget}`);
}

function isLocalLink(href) {
  return Boolean(href) && !/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(href);
}

function isRepositoryPath(value) {
  const candidate = value.replaceAll('\\', '/').replace(/[.,;:!?]+$/, '');
  if (!candidate || /\s|[*<>|]/.test(candidate)) return false;
  if (/(?:^|\/)\.env(?:\.|$)/.test(candidate)) return false;
  return hasRepositoryPrefix(candidate);
}

function hasRepositoryPrefix(candidate) {
  return /^(?:\.agents|\.claude|\.github|apps|docs|packages|scripts|supabase)(?:\/|$)/.test(candidate)
    || /^(?:AGENTS|CLAUDE|README|SECURITY|package\.json|turbo\.json|\.mcp\.json)(?:$|\/)/.test(candidate);
}

function checkRepositoryPaths(file, content) {
  if (file.startsWith('docs/adr/')) return;
  const inlinePattern = /`([^`\r\n]+)`/g;
  let match;

  while ((match = inlinePattern.exec(content))) {
    checkRepositoryPath(file, match[1]);
  }
}

function checkRepositoryPath(file, value) {
  const candidate = value.trim().replace(/[.,;:!?]+$/, '');
  if (!isRepositoryPath(candidate) || fs.existsSync(absolute(candidate))) return;
  error(`Broken repository path in ${file}: ${candidate}`);
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

if (reporter.count > 0) {
  console.error(`\nDocs lint failed with ${reporter.count} error(s).`);
  process.exit(1);
}

console.log('Docs integrity linting passed.');
