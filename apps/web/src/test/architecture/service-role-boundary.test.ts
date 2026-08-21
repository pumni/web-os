import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const serviceRoleImport = '@pumni/supabase/service-role';
const compositionFixture = `
  import '${serviceRoleImport}';
  export const classNames = 'text-blue-500 backdrop-blur-md duration-200 ease-out z-50';
`;
const designRuleIds = [
  'pumni/no-raw-color',
  'pumni/no-ad-hoc-surface',
  'pumni/no-raw-timing',
  'pumni/no-raw-z-index',
];
// The full verify command runs ESLint, Vitest, and Next build concurrently.
// Allow the mechanical guard to initialize under that expected CI load.
const ESLINT_GUARD_TIMEOUT_MS = 60_000;

const eslint = new ESLint({
  cwd: appRoot,
  overrideConfigFile: path.join(appRoot, 'eslint.config.mjs'),
  ignore: false,
});

async function lintSourceAt(relativePath: string) {
  const [result] = await eslint.lintText(compositionFixture, {
    filePath: path.join(appRoot, relativePath),
  });
  return result?.messages ?? [];
}

function messagesByRule(messages: Awaited<ReturnType<typeof lintSourceAt>>) {
  return new Map(messages.map((message) => [message.ruleId, message]));
}

describe('ESLint mechanical guard composition', () => {
  it('keeps every independent guard active on an ordinary unapproved source file', async () => {
    const messages = messagesByRule(
      await lintSourceAt('src/features/profile/service-role-boundary-probe.ts'),
    );

    expect(messages.get('pumni/no-unapproved-service-role-import')?.severity).toBe(2);
    expect(designRuleIds.map((ruleId) => messages.get(ruleId)?.severity)).toEqual([
      2,
      2,
      2,
      1,
    ]);
  }, ESLINT_GUARD_TIMEOUT_MS);

  it('allows an approved service-role module without disabling design guards', async () => {
    const messages = messagesByRule(await lintSourceAt('src/app/api/webhooks/polar/route.ts'));

    expect(messages.has('pumni/no-unapproved-service-role-import')).toBe(false);
    expect(designRuleIds.map((ruleId) => messages.get(ruleId)?.severity)).toEqual([
      2,
      2,
      2,
      1,
    ]);
  }, ESLINT_GUARD_TIMEOUT_MS);
});
