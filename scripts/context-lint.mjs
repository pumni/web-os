import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import {
  absolute,
  createErrorReporter,
  read,
  relative,
  ROOT,
  walk,
} from './context-utils.mjs';

const reporter = createErrorReporter();
const { error } = reporter;

function checkRequiredFiles() {
  for (const file of [
    'AGENTS.md',
    'CLAUDE.md',
    'scripts/context-lint.mjs',
    'scripts/sync-claude-shims.mjs',
    'scripts/sync-skills.mjs',
  ]) {
    if (!fs.existsSync(absolute(file))) error(`Required context file missing: ${file}`);
  }
}

function checkRootShim() {
  if (!fs.existsSync(absolute('CLAUDE.md'))) return;
  if (read('CLAUDE.md') !== '@AGENTS.md\n') {
    error("Root CLAUDE.md must contain exactly '@AGENTS.md'.");
  }
}

const CONTEXT_FILE_RULES = [
  (file, name) => name === 'AGENTS.md',
  (file, name) => file.startsWith('.github/') && name.endsWith('.md'),
  (file, name) => file.startsWith('.agents/skills/') && name === 'SKILL.md',
  (file, name) => file.startsWith('.claude/skills/') && name === 'SKILL.md',
];

function runShimCheck(script, label) {
  if (!fs.existsSync(absolute(script))) return;
  try {
    execFileSync(process.execPath, [absolute(script), '--check'], {
      cwd: ROOT,
      stdio: 'inherit',
    });
  } catch {
    error(`${label} are missing or out of sync.`);
  }
}

function collectContextFile(files, fullPath, name) {
  const file = relative(fullPath);
  for (const rule of CONTEXT_FILE_RULES) if (rule(file, name)) files.add(file);
}

function contextFiles() {
  const files = new Set(['AGENTS.md', 'CLAUDE.md', '.github/copilot-instructions.md']);
  walk(ROOT, (fullPath, name) => collectContextFile(files, fullPath, name));
  return [...files].filter((file) => fs.existsSync(absolute(file)));
}

function parseSkillFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return null;
  const frontmatter = match[1];
  const name = frontmatter.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const rawDescription = frontmatter.match(/^description:\s*(.+)$/m)?.[1]?.trim();
  const description = rawDescription?.replace(/^(['"])(.*)\1$/, '$2');
  return { name, description };
}

function skillDirectories(skillsDir) {
  return fs.readdirSync(skillsDir, { withFileTypes: true }).filter((entry) => entry.isDirectory());
}

function missingSkillName(parsed) {
  return !parsed?.name;
}

function missingSkillDescription(parsed) {
  return !parsed?.description;
}

function mismatchedSkillName(parsed, directoryName) {
  return Boolean(parsed?.name) && parsed.name !== directoryName;
}

function invalidSkillName(parsed) {
  return Boolean(parsed?.name) && !isValidSkillName(parsed.name);
}

function oversizedSkillDescription(parsed) {
  return Boolean(parsed?.description) && parsed.description.length > 1024;
}

function validateSkillMetadata(skillFile, directoryName) {
  const parsed = parseSkillFrontmatter(read(skillFile));
  const checks = [
    [missingSkillName(parsed), `${skillFile} is missing frontmatter name.`],
    [missingSkillDescription(parsed), `${skillFile} is missing frontmatter description.`],
    [mismatchedSkillName(parsed, directoryName), `${skillFile} name must match its directory.`],
    [invalidSkillName(parsed), `${skillFile} name must be 1-64 chars, lowercase, and kebab-case without leading/trailing or repeated hyphens.`],
    [oversizedSkillDescription(parsed), `${skillFile} description exceeds the 1024-character Agent Skills limit.`],
  ];
  for (const [failed, message] of checks) if (failed) error(message);
}

function isValidSkillName(name) {
  return name.length <= 64 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name);
}

function checkSkillDirectory(entry) {
  const name = entry.name;
  const skillFile = `.agents/skills/${name}/SKILL.md`;
  if (!fs.existsSync(absolute(skillFile))) {
    error(`Skill directory missing SKILL.md: ${skillFile}`);
    return;
  }
  validateSkillMetadata(skillFile, name);
}

function checkSkills() {
  const skillsDir = absolute('.agents/skills');
  if (!fs.existsSync(skillsDir)) {
    error('.agents/skills is missing.');
    return;
  }
  for (const entry of skillDirectories(skillsDir)) checkSkillDirectory(entry);
}

function checkEncoding(files) {
  for (const file of files) {
    const content = read(file);
    if (content.includes('\uFFFD')) error(`Encoding corruption found in ${file}`);
  }
}

console.log('Running context integrity linting...');
checkRequiredFiles();
if (fs.existsSync(absolute('AGENTS.md'))) checkRootShim();
runShimCheck('scripts/sync-claude-shims.mjs', 'Claude shims');
runShimCheck('scripts/sync-skills.mjs', 'Skill shims');
checkSkills();
checkEncoding(contextFiles());

if (reporter.count > 0) {
  console.error(`\nContext lint failed with ${reporter.count} error(s).`);
  process.exit(1);
}
console.log('Context integrity linting passed.');
