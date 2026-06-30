import { Glob } from 'bun';
import { rm } from 'node:fs/promises';

const all = process.argv.includes('--all');

const devTargets = ['apps/*/.next'];
const allOnlyTargets = ['node_modules', '.turbo', 'apps/*/dist', 'packages/*/dist'];

const targets = all ? [...devTargets, ...allOnlyTargets] : devTargets;

for (const pattern of targets) {
  for await (const match of new Glob(pattern).scan({
    cwd: process.cwd(),
    onlyFiles: false,
  })) {
    await rm(match, { recursive: true, force: true });
  }
}
