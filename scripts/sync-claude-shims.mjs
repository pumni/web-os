import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const checkOnly = process.argv.includes('--check');

function findAgentsMd(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === 'node_modules' ||
        entry.name === '.git' ||
        entry.name === '.gemini' ||
        entry.name === '.claude' ||
        entry.name === '.agents' ||
        entry.name === 'dist' ||
        entry.name === '.turbo'
      ) {
        continue;
      }
      results.push(...findAgentsMd(fullPath));
    } else if (entry.name === 'AGENTS.md') {
      // Ignore root AGENTS.md
      if (fullPath !== path.join(ROOT, 'AGENTS.md')) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const agentsFiles = findAgentsMd(ROOT);
let drift = 0;
let written = 0;

for (const agentsFile of agentsFiles) {
  const dir = path.dirname(agentsFile);
  const claudeFile = path.join(dir, 'CLAUDE.md');
  const expectedContent = '@AGENTS.md\n';
  
  let currentContent = null;
  if (fs.existsSync(claudeFile)) {
    currentContent = fs.readFileSync(claudeFile, 'utf8');
  }

  if (currentContent === expectedContent) {
    continue;
  }

  if (checkOnly) {
    console.error(`[ERROR] Missing or out-of-sync shim: ${path.relative(ROOT, claudeFile)}`);
    drift++;
  } else {
    fs.writeFileSync(claudeFile, expectedContent, 'utf8');
    console.log(`wrote ${path.relative(ROOT, claudeFile)}`);
    written++;
  }
}

// Check for orphan CLAUDE.md shims that contain "@AGENTS.md" but don't have AGENTS.md next to them
function findClaudeMd(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === 'node_modules' ||
        entry.name === '.git' ||
        entry.name === '.gemini' ||
        entry.name === '.claude' ||
        entry.name === '.agents' ||
        entry.name === 'dist' ||
        entry.name === '.turbo'
      ) {
        continue;
      }
      results.push(...findClaudeMd(fullPath));
    } else if (entry.name === 'CLAUDE.md') {
      if (fullPath !== path.join(ROOT, 'CLAUDE.md')) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const claudeFiles = findClaudeMd(ROOT);
for (const claudeFile of claudeFiles) {
  const dir = path.dirname(claudeFile);
  const agentsFile = path.join(dir, 'AGENTS.md');
  if (!fs.existsSync(agentsFile)) {
    const content = fs.readFileSync(claudeFile, 'utf8');
    if (content.trim() === '@AGENTS.md') {
      if (checkOnly) {
        console.error(`[ERROR] Orphan shim: ${path.relative(ROOT, claudeFile)}`);
        drift++;
      } else {
        fs.unlinkSync(claudeFile);
        console.log(`removed orphan shim ${path.relative(ROOT, claudeFile)}`);
        written++;
      }
    }
  }
}

if (checkOnly) {
  if (drift > 0) {
    console.error(`\n${drift} CLAUDE.md shim(s) out of sync. Run \`bun run ai:shims:sync\` and commit.`);
    process.exit(1);
  }
  console.log('CLAUDE.md shims are in sync.');
} else {
  console.log(written > 0 ? `\nSynced ${written} shim change(s).` : 'CLAUDE.md shims already in sync.');
}
