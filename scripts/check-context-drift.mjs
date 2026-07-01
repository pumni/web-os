// Context-drift detector (advisory). Warns when code under a mapped subsystem
// changed without its owning doc/skill changing in the same range — a proxy for
// specification staleness (the top documented failure mode). Fail-open by design:
// any infra error prints nothing and exits 0. Tool-agnostic; the Claude hook is a
// thin wrapper. SSOT for ownership: scripts/context-map.json.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rangeArg = process.argv.find((a) => a.startsWith('--since='));
const range = rangeArg ? rangeArg.slice('--since='.length) : 'HEAD~1';

function changedFiles() {
  const res = spawnSync('git', ['diff', '--name-only', `${range}...HEAD`], {
    cwd: ROOT, encoding: 'utf8', timeout: 15_000,
  });
  if (res.status !== 0 || !res.stdout) return [];
  return res.stdout.split('\n').map((s) => s.trim()).filter(Boolean);
}

// Minimal glob: supports trailing /** and *.ext; extend only if the map needs it.
function matches(glob, file) {
  if (glob.endsWith('/**')) return file.startsWith(glob.slice(0, -2));
  if (glob.startsWith('**/')) return file.endsWith(glob.slice(2));
  return file === glob;
}

try {
  const mapPath = path.join(ROOT, 'scripts', 'context-map.json');
  if (!fs.existsSync(mapPath)) process.exit(0);
  const { subsystems = [] } = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  const changed = changedFiles();
  if (changed.length === 0) process.exit(0);

  const stale = [];
  for (const s of subsystems) {
    const codeTouched = changed.some((f) => (s.code ?? []).some((g) => matches(g, f)));
    const ownerTouched = changed.some((f) => (s.owners ?? []).includes(f));
    if (codeTouched && !ownerTouched) stale.push(s);
  }
  if (stale.length) {
    const lines = stale.map(
      (s) => `  • ${s.name}: code changed, owner docs unchanged → ${s.owners.join(', ')}`,
    );
    process.stdout.write(
      `Context-drift notice (${range}...HEAD): review whether these specs need updating:\n${lines.join('\n')}\n`,
    );
  }
} catch {
  // fail-open
}
process.exit(0);
