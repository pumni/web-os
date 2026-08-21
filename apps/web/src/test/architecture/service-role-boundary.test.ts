import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const serviceRoleImport = '@pumni/supabase/service-role';

const eslint = new ESLint({
  cwd: appRoot,
  overrideConfigFile: path.join(appRoot, 'eslint.config.mjs'),
  ignore: false,
});

async function lintImportAt(relativePath: string) {
  const [result] = await eslint.lintText(`import '${serviceRoleImport}';`, {
    filePath: path.join(appRoot, relativePath),
  });
  return result?.messages ?? [];
}

describe('service-role ESLint boundary', () => {
  it('rejects an import from an unapproved server module', async () => {
    const messages = await lintImportAt('src/features/profile/service-role-boundary-probe.ts');

    expect(
      messages.some(
        (message) =>
          message.ruleId === 'no-restricted-syntax' &&
          message.message.includes('service-role imports are restricted'),
      ),
    ).toBe(true);
  }, 30_000);

  it('allows the existing approved webhook server module', async () => {
    const messages = await lintImportAt('src/app/api/webhooks/polar/route.ts');

    expect(
      messages.some(
        (message) =>
          message.ruleId === 'no-restricted-syntax' &&
          message.message.includes('service-role imports are restricted'),
      ),
    ).toBe(false);
  }, 30_000);
});
