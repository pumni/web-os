/**
 * ai:secrets
 *
 * Scans the working tree for accidental secret exposure:
 *   - Hardcoded API keys, tokens, passwords in tracked source files
 *   - .env files committed (Next.js: .env.local / .env.production etc.)
 *   - Supabase service-role key (long JWT) hardcoded in source
 *   - Private key PEM blocks
 *
 * Service-role keys are server-only and must come from env vars, never literals.
 * A long service-role JWT literal in any committed source file is a finding.
 *
 * Exit 1 on any failure-severity finding; exit 0 if clean.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

let errors = 0;
let warnings = 0;

function fail(file, line, msg) {
  console.error(`  x FAIL  ${file}:${line}  ${msg}`);
  errors++;
}

function warn(file, line, msg) {
  console.warn(`  ! WARN  ${file}:${line}  ${msg}`);
  warnings++;
}

function pass(msg) {
  console.log(`  ok PASS  ${msg}`);
}

// -- Collect tracked files ----------------------------------------------------

let trackedFiles;
try {
  const out = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' });
  trackedFiles = out.split('\n').filter(Boolean);
} catch {
  console.error('FATAL: git ls-files failed - not a git repo or git not available');
  process.exit(1);
}

// -- Pattern definitions ------------------------------------------------------

const notDocsOrExample = (f) =>
  !f.startsWith('scripts/') &&
  !f.startsWith('docs/') &&
  !f.endsWith('.md') &&
  !f.includes('.example');

const SECRET_PATTERNS = [
  {
    id: 'private-key-pem',
    label: 'Private key PEM block',
    pattern: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    severity: 'fail',
  },
  {
    id: 'anthropic-api-key',
    label: 'Anthropic API key',
    pattern: /sk-ant-[A-Za-z0-9\-_]{20,}/,
    severity: 'fail',
  },
  {
    id: 'openai-api-key',
    label: 'OpenAI API key',
    pattern: /sk-[A-Za-z0-9]{32,}/,
    severity: 'fail',
  },
  {
    id: 'supabase-service-role',
    label: 'Supabase service-role key (long JWT) hardcoded in source',
    // JWT with a long payload - distinguishes service-role from the shorter anon/publishable key.
    // Service-role must always come from a server-only env var, never a literal.
    pattern: /eyJ[A-Za-z0-9+/=]{40,}\.[A-Za-z0-9+/=]{200,}/,
    severity: 'fail',
    pathFilter: notDocsOrExample,
  },
  {
    id: 'generic-secret-assignment',
    label: 'Generic hardcoded secret assignment',
    pattern: /(SECRET|PASSWORD|TOKEN|API_KEY|SERVICE_ROLE)\s*=\s*["'][A-Za-z0-9+/=_\-]{20,}["']/i,
    severity: 'warn',
    pathFilter: notDocsOrExample,
  },
  {
    id: 'google-api-key',
    label: 'Google API key',
    pattern: /AIza[0-9A-Za-z\-_]{35}/,
    severity: 'fail',
  },
  {
    id: 'aws-access-key',
    label: 'AWS access key ID',
    pattern: /AKIA[0-9A-Z]{16}/,
    severity: 'fail',
  },
];

const SCAN_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.cjs',
  '.json',
  '.env',
  '.sh',
  '.md',
  '.yaml',
  '.yml',
  '.sql',
]);

// -- .env file check ----------------------------------------------------------

console.log('\n[1] .env files committed to git');
const committedEnvFiles = trackedFiles.filter(
  (f) => path.basename(f) === '.env' || /\.env\.[^e]/.test(path.basename(f)),
);
if (committedEnvFiles.length === 0) {
  pass('No .env files tracked by git');
} else {
  for (const f of committedEnvFiles) {
    fail(f, 0, '.env file committed to git - add to .gitignore and rotate any secrets');
  }
}

// -- Secret pattern scan ------------------------------------------------------

console.log('\n[2] Secret pattern scan');

const findings = [];

for (const relPath of trackedFiles) {
  const ext = path.extname(relPath).toLowerCase();
  if (!SCAN_EXTENSIONS.has(ext) && !relPath.endsWith('.env')) continue;

  const absPath = path.join(ROOT, relPath);
  if (!fs.existsSync(absPath)) continue;

  let content;
  try {
    content = fs.readFileSync(absPath, 'utf8');
  } catch {
    continue;
  }

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*(\/\/|#|<!--|\*|\/\*)/.test(line)) continue;
    if (/placeholder|example|your[-_]?key|<YOUR|REPLACE_ME|xxxxxxx/i.test(line)) continue;

    for (const rule of SECRET_PATTERNS) {
      if (rule.pathFilter && !rule.pathFilter(relPath)) continue;
      if (!rule.pattern.test(line)) continue;
      findings.push({ relPath, lineNum: i + 1, rule, lineText: line.trim().slice(0, 120) });
    }
  }
}

if (findings.length === 0) {
  pass('No secret patterns detected in tracked files');
} else {
  for (const { relPath, lineNum, rule, lineText } of findings) {
    const preview = lineText.replace(/["'][A-Za-z0-9+/=_\-]{12,}["']/g, '"[REDACTED]"');
    if (rule.severity === 'fail') {
      fail(relPath, lineNum, `${rule.label} detected - ${preview}`);
    } else {
      warn(relPath, lineNum, `${rule.label} - ${preview}`);
    }
  }
}

// -- Summary ------------------------------------------------------------------

console.log(`\n${'-'.repeat(60)}`);
if (errors > 0) {
  console.error(`\nai:secrets FAILED - ${errors} error(s), ${warnings} warning(s)\n`);
  process.exit(1);
} else if (warnings > 0) {
  console.warn(`\nai:secrets PASSED with ${warnings} warning(s)\n`);
} else {
  console.log(`\nai:secrets PASSED\n`);
}
