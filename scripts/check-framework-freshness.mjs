import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FRESHNESS_DOC = path.join(ROOT, 'docs', 'ai', 'framework-freshness.md');
const MAX_VERIFICATION_AGE_DAYS = 180;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const TRACKED = [
  { packageName: 'bun', packageJson: 'package.json', source: 'packageManager' },
  { packageName: 'turbo', packageJson: 'package.json' },
  { packageName: 'typescript', packageJson: 'package.json' },
  { packageName: 'next', packageJson: 'apps/web/package.json' },
  { packageName: 'react', packageJson: 'apps/web/package.json' },
  { packageName: 'react-dom', packageJson: 'apps/web/package.json' },
  { packageName: 'babel-plugin-react-compiler', packageJson: 'apps/web/package.json' },
  { packageName: '@tanstack/react-query', packageJson: 'apps/web/package.json' },
  { packageName: 'zustand', packageJson: 'apps/web/package.json' },
  { packageName: '@supabase/supabase-js', packageJson: 'apps/web/package.json' },
  { packageName: '@supabase/ssr', packageJson: 'apps/web/package.json' },
  { packageName: 'tailwindcss', packageJson: 'apps/web/package.json' },
  { packageName: '@tailwindcss/postcss', packageJson: 'apps/web/package.json' },
];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function getInstalledVersion(entry) {
  const packageJson = readJson(entry.packageJson);
  if (entry.source === 'packageManager') {
    const packageManager = packageJson.packageManager;
    const prefix = `${entry.packageName}@`;
    if (typeof packageManager === 'string' && packageManager.startsWith(prefix)) {
      return packageManager.slice(prefix.length);
    }
    return null;
  }

  const fields = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
  for (const field of fields) {
    const version = packageJson[field]?.[entry.packageName];
    if (version) return version;
  }
  return null;
}

function parseVerifiedVersions() {
  const content = fs.readFileSync(FRESHNESS_DOC, 'utf8');
  const rows = new Map();
  const rowRegex =
    /^\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|\s*([^|]+?)\s*\|\s*`(\d{4}-\d{2}-\d{2})`\s*\|/gm;
  let match;
  while ((match = rowRegex.exec(content)) !== null) {
    rows.set(match[1], {
      source: match[2],
      version: match[3],
      docSource: match[4].trim(),
      verifiedAt: match[5],
    });
  }
  return rows;
}

let errors = 0;

function error(message) {
  console.error(`[ERROR] ${message}`);
  errors++;
}

function getAgeDays(isoDate) {
  const verifiedDate = new Date(`${isoDate}T00:00:00.000Z`);
  if (Number.isNaN(verifiedDate.getTime())) return null;
  const now = new Date();
  return Math.floor((now.getTime() - verifiedDate.getTime()) / MS_PER_DAY);
}

console.log('Running framework freshness validation...');

if (!fs.existsSync(FRESHNESS_DOC)) {
  error('docs/ai/framework-freshness.md is missing.');
} else {
  const verified = parseVerifiedVersions();

  for (const entry of TRACKED) {
    const installed = getInstalledVersion(entry);
    if (!installed) {
      error(`${entry.packageJson} does not declare tracked package ${entry.packageName}.`);
      continue;
    }

    const documented = verified.get(entry.packageName);
    if (!documented) {
      error(`framework-freshness.md is missing verified version row for ${entry.packageName}.`);
      continue;
    }

    if (documented.source !== entry.packageJson) {
      error(
        `framework-freshness.md source mismatch for ${entry.packageName}: expected ${entry.packageJson}, got ${documented.source}.`,
      );
    }

    if (documented.version !== installed) {
      error(
        `framework-freshness.md version drift for ${entry.packageName}: package has ${installed}, doc has ${documented.version}.`,
      );
    }

    if (!documented.docSource || documented.docSource === '-') {
      error(`framework-freshness.md is missing a docs source for ${entry.packageName}.`);
    }

    const ageDays = getAgeDays(documented.verifiedAt);
    if (ageDays === null) {
      error(`framework-freshness.md has an invalid verified date for ${entry.packageName}: ${documented.verifiedAt}.`);
    } else if (ageDays < 0) {
      error(`framework-freshness.md verified date is in the future for ${entry.packageName}: ${documented.verifiedAt}.`);
    } else if (ageDays > MAX_VERIFICATION_AGE_DAYS) {
      error(
        `framework-freshness.md verification is stale for ${entry.packageName}: ${ageDays} days old (> ${MAX_VERIFICATION_AGE_DAYS}).`,
      );
    }
  }
}

if (errors > 0) {
  console.error(`Framework freshness validation failed with ${errors} error(s).`);
  process.exit(1);
}

console.log('Framework freshness validation passed.');
