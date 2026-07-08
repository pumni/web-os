/**
 * Review Gate static rules for Pumni Web OS (Next.js monorepo).
 *
 * Ported and adapted from the WTE-mobile analyzer. RN-only rules (Reanimated,
 * Skia, MMKV, i18n, Edge Functions) are intentionally omitted. Scan roots are
 * monorepo-aware: apps/web/src + packages, plus supabase/migrations for SQL.
 *
 * Flags:                                                   severity
 *   supabase-select-star            .select('*')               B1
 *   service-role-client             service-role in client     P0
 *   trusted-client-user-id-write    client write of user_id     B1
 *   swallowed-error                 empty catch in server I/O   B1
 *   missing-auth-uid-policy         user-owned RLS w/o auth.uid  B1
 *   rpc-user-id-without-auth-check  RPC p_user_id w/o auth.uid   B1
 *   mutation-without-invalidation   useMutation w/o cache update B2
 *   query-result-in-zustand         Query data mirrored to store B1
 *   missing-loading-state           useQuery w/o isLoading       B2
 *   route-business-logic            logic in app/ route files    B2
 *   server-action-missing-auth      action write w/o auth        B1
 *   server-action-missing-revalidation action write w/o cache    B2
 *   client-secret-env               private env in client        B1
 *   server-only-in-client           server module in client      B1
 *   cache-life-too-short            cacheLife('seconds')         B2
 *   cache-tag-unparameterized       cacheTag('literal')          B1
 *   legacy-middleware               middleware.ts is deprecated  B1
 *   image-priority-deprecated       priority on Next.js <Image>  B2
 *   single-arg-revalidate-tag       revalidateTag() w/ single arg B1
 *   test-weakening                  .only/.skip/empty catch test B1
 *
 * Note: a direct-env-access rule was considered but dropped — the project's
 * convention (docs/conventions/supabase-security.md, a P2 source) states that
 * NEXT_PUBLIC_* vars are public by design, so reading them via process.env is
 * idiomatic and must not be flagged.
 *
 * Modes: --self-test, --strict, --paths a,b,c
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RULES, RULE_INFO } from './review-gate-rules.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const ALLOWLIST_PATH = path.join(__dirname, 'ai-review-rule-allowlist.json');

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const selfTest = args.includes('--self-test');
const pathsArgIndex = args.indexOf('--paths');
const explicitPaths =
  pathsArgIndex >= 0 && args[pathsArgIndex + 1]
    ? args[pathsArgIndex + 1].split(',').filter(Boolean)
    : null;

const DEFAULT_SCAN_ROOTS = ['apps/web/src', 'packages'];
const SQL_ROOTS = ['supabase/migrations', 'supabase/seed.sql'];
const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const CLIENT_CODE_EXTENSIONS = new Set(['.ts', '.tsx']);
const SKIP_DIRS = new Set(['node_modules', '.git', '.next', '.turbo', 'coverage', 'dist']);

// Server-side I/O surfaces where a swallowed error is a real risk.
const API_SERVICE_PATTERN =
  /(?:^|\/)(?:apps\/web\/src\/features\/[^/]+\/(?:actions|queries)\.ts|apps\/web\/src\/lib\/.*\.ts|packages\/[^/]+\/src\/.*\.ts)$/;

function toPosix(filePath) {
  return filePath.replaceAll(path.sep, '/');
}
function relPath(filePath) {
  return toPosix(path.relative(ROOT, filePath));
}
function resolveRel(relativePath) {
  return path.resolve(ROOT, relativePath);
}
function lineNumber(content, index) {
  return content.slice(0, index).split(/\r?\n/).length;
}
function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function walk(relativeRoot) {
  const root = resolveRel(relativeRoot);
  if (!fs.existsSync(root)) return [];
  const results = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      results.push(...walk(relPath(entryPath)));
      continue;
    }
    if (entry.isFile() && CODE_EXTENSIONS.has(path.extname(entry.name))) {
      results.push(entryPath);
    }
  }
  return results;
}

function collectSqlFiles() {
  if (explicitPaths) {
    return explicitPaths.map(resolveRel).filter((f) => fs.existsSync(f) && f.endsWith('.sql'));
  }
  const out = [];
  for (const root of SQL_ROOTS) {
    const full = resolveRel(root);
    if (!fs.existsSync(full)) continue;
    const stat = fs.statSync(full);
    if (stat.isFile()) {
      out.push(full);
    } else {
      for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
        if (entry.isFile() && entry.name.endsWith('.sql')) out.push(path.join(full, entry.name));
      }
    }
  }
  return out;
}

function collectSqlEvidence(sqlFiles) {
  return sqlFiles.map((f) => readText(f)).join('\n');
}

function collectCodeFiles() {
  if (explicitPaths) {
    return explicitPaths
      .map(resolveRel)
      .filter((f) => fs.existsSync(f) && CODE_EXTENSIONS.has(path.extname(f)));
  }
  return DEFAULT_SCAN_ROOTS.flatMap(walk);
}

function isClientFile(content) {
  // "use client" directive near the top of the module.
  return /^﻿?\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*['"]use client['"]/.test(
    content.slice(0, 400),
  );
}

// -- allowlist ----------------------------------------------------------------

function loadAllowlist() {
  if (!fs.existsSync(ALLOWLIST_PATH)) return {};
  const parsed = JSON.parse(readText(ALLOWLIST_PATH));
  for (const [ruleId, entries] of Object.entries(parsed)) {
    if (!Array.isArray(entries)) throw new Error(`Allowlist for ${ruleId} must be an array.`);
    for (const entry of entries) {
      if (!entry.file || typeof entry.file !== 'string') {
        throw new Error(`Allowlist entry for ${ruleId} is missing file.`);
      }
      if (!entry.reason || typeof entry.reason !== 'string' || entry.reason.trim().length < 12) {
        throw new Error(
          `Allowlist entry for ${ruleId} in ${entry.file} must include a specific reason.`,
        );
      }
    }
  }
  return parsed;
}

function isAllowlisted(allowlist, finding) {
  const entries = allowlist[finding.ruleId] ?? [];
  return entries.some((entry) => {
    if (entry.file !== finding.file) return false;
    if (entry.line && entry.line !== finding.line) return false;
    if (entry.evidence && !finding.evidence.includes(entry.evidence)) return false;
    return true;
  });
}

function addFinding(findings, ruleId, file, content, index, evidence, detail) {
  findings.push({
    ruleId,
    file,
    line: lineNumber(content, index),
    evidence: evidence.trim(),
    detail,
    ...RULE_INFO[ruleId],
  });
}

// -- parser helpers -----------------------------------------------------------

function findBlockEnd(content, openIndex) {
  let depth = 0;
  let quote = null;
  for (let i = openIndex; i < content.length; i++) {
    const char = content[i];
    const previous = content[i - 1];
    if (quote) {
      if (char === quote && previous !== '\\') quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') depth++;
    if (char === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function findMatchingParen(content, openIndex) {
  let depth = 0;
  let quote = null;
  let templateDepth = 0;
  for (let i = openIndex; i < content.length; i++) {
    const char = content[i];
    const previous = content[i - 1];
    if (quote) {
      if (quote === '`' && char === '$' && content[i + 1] === '{') {
        templateDepth++;
        i++;
        continue;
      }
      if (templateDepth > 0) {
        if (char === '{') templateDepth++;
        if (char === '}') templateDepth--;
        continue;
      }
      if (char === quote && previous !== '\\') quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '(') depth++;
    if (char === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function getCallArgument(content, callStart) {
  const openIndex = content.indexOf('(', callStart);
  if (openIndex < 0) return null;
  const closeIndex = findMatchingParen(content, openIndex);
  if (closeIndex < 0) return null;
  return { text: content.slice(openIndex + 1, closeIndex), start: openIndex + 1, end: closeIndex };
}

function collectFunctionBlocks(content) {
  const blocks = [];
  const declarations =
    /export\s+async\s+function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*(?::[^{]+)?\{/g;
  const exportedAsyncConsts =
    /export\s+const\s+([A-Za-z_$][\w$]*)\s*=\s*async\s*(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*(?::[^{]+)?=>\s*\{/g;

  for (const regex of [declarations, exportedAsyncConsts]) {
    let match;
    while ((match = regex.exec(content)) !== null) {
      const openIndex = match.index + match[0].lastIndexOf('{');
      const closeIndex = findBlockEnd(content, openIndex);
      if (openIndex < 0 || closeIndex < 0) continue;
      blocks.push({
        name: match[1],
        start: match.index,
        bodyStart: openIndex + 1,
        bodyEnd: closeIndex,
        text: content.slice(openIndex + 1, closeIndex),
      });
    }
  }

  return blocks.sort((a, b) => a.start - b.start);
}

function previousIdentifierObjectContainsUserId(content, identifier, beforeIndex) {
  const prefix = content.slice(Math.max(0, beforeIndex - 7000), beforeIndex);
  const declarationRegex = new RegExp(
    `(?:const|let|var)\\s+${identifier}\\s*=\\s*([\\s\\S]{0,2500}?);`,
    'g',
  );
  let match;
  let lastMatch = null;
  while ((match = declarationRegex.exec(prefix)) !== null) lastMatch = match;
  return Boolean(lastMatch && /\buser_id\s*:/.test(lastMatch[1]));
}

function argumentContainsUserIdWrite(content, argument) {
  if (/\buser_id\s*:/.test(argument.text)) return true;
  const identifier = argument.text.trim().match(/^([A-Za-z_$][\w$]*)\b/)?.[1];
  if (!identifier) return false;
  return previousIdentifierObjectContainsUserId(content, identifier, argument.start);
}

// -- SQL helpers --------------------------------------------------------------

function compactSql(sql) {
  return sql.replace(/--.*$/gm, '').replace(/\s+/g, ' ').trim();
}

function findSqlStatements(content, startRegex) {
  const statements = [];
  let match;
  while ((match = startRegex.exec(content)) !== null) {
    const start = match.index;
    const dollarQuote = content.indexOf('$$', start);
    const semicolon = content.indexOf(';', start);
    let end = semicolon;
    if (dollarQuote >= 0 && (semicolon < 0 || dollarQuote < semicolon)) {
      const closing = content.indexOf('$$', dollarQuote + 2);
      if (closing >= 0) end = content.indexOf(';', closing + 2);
    }
    if (end < 0) end = content.length - 1;
    statements.push({ start, text: content.slice(start, end + 1) });
    startRegex.lastIndex = end + 1;
  }
  return statements;
}

function hasAuthUid(sql) {
  return /auth\s*\.\s*uid\s*\(/i.test(sql) || /"auth"\s*\.\s*"uid"\s*\(/i.test(sql);
}

function isUserOwnedPolicy(policyText) {
  const compact = compactSql(policyText).toLowerCase();
  if (/\busing\s*\(\s*true\s*\)|\bwith\s+check\s*\(\s*true\s*\)/.test(compact)) return false;
  if (/public read|publicly readable|to anon/.test(compact)) return false;
  return /\buser_id\b|\bowner\b|\btheir own\b|\bto authenticated\b/.test(compact);
}

function hasRlsWithCheckEvidence(sqlEvidence, tableName) {
  const escapedTable = tableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const policyRegex = new RegExp(
    `create\\s+policy[\\s\\S]{0,600}?on\\s+(?:(?:"public"|public)\\.)?"?${escapedTable}"?\\b[\\s\\S]{0,900}?with\\s+check\\s*\\([\\s\\S]{0,500}?user_id[\\s\\S]{0,120}?auth\\.uid\\s*\\(`,
    'i',
  );
  return policyRegex.test(sqlEvidence);
}

function hasRpcUserIdAuthCheck(functionText) {
  if (!hasAuthUid(functionText)) return false;
  const compact = compactSql(functionText).toLowerCase();
  return (
    /auth\s*\.\s*uid\s*\(\s*\)\s*(?:=|<>|!=|is\s+distinct\s+from)\s*p_user_id/.test(compact) ||
    /p_user_id\s*(?:=|<>|!=|is\s+distinct\s+from)\s*auth\s*\.\s*uid\s*\(\s*\)/.test(compact) ||
    /v_user_id\s*(?::=|=)\s*auth\s*\.\s*uid\s*\(\s*\)[\s\S]{0,500}v_user_id\s*(?:=|<>|!=|is\s+distinct\s+from)\s*p_user_id/.test(
      compact,
    ) ||
    /v_user_id\s*(?::=|=)\s*auth\s*\.\s*uid\s*\(\s*\)[\s\S]{0,500}p_user_id\s*(?:=|<>|!=|is\s+distinct\s+from)\s*v_user_id/.test(
      compact,
    )
  );
}

// -- analyzers ----------------------------------------------------------------

function analyzeSelectStar(files, findings) {
  const re = /\.select\(\s*(['"`])\*\1\s*\)/g;
  for (const file of files) {
    const rel = relPath(file);
    const content = readText(file);
    let m;
    while ((m = re.exec(content)) !== null) {
      addFinding(
        findings,
        RULES.SELECT_STAR,
        rel,
        content,
        m.index,
        m[0],
        'Supabase select-all hides data-shape drift and weakens reviewability.',
      );
    }
  }
}

function analyzeServiceRoleClient(files, findings) {
  const re = /\b(?:SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE|service_role|sb_secret_)[\w-]*/g;
  for (const file of files) {
    if (!CLIENT_CODE_EXTENSIONS.has(path.extname(file))) continue;
    const content = readText(file);
    if (!isClientFile(content)) continue; // server code may legitimately use service-role
    const rel = relPath(file);
    let m;
    while ((m = re.exec(content)) !== null) {
      addFinding(
        findings,
        RULES.SERVICE_ROLE_CLIENT,
        rel,
        content,
        m.index,
        m[0],
        'Client-bundle ("use client") code references a service-role / secret credential.',
      );
    }
  }
}

function analyzeClientSecretEnv(files, findings) {
  const dotEnv = /\bprocess\.env\.([A-Za-z_][A-Za-z0-9_]*)/g;
  const bracketEnv = /\bprocess\.env\[['"]([A-Za-z_][A-Za-z0-9_]*)['"]\]/g;

  for (const file of files) {
    if (!CLIENT_CODE_EXTENSIONS.has(path.extname(file))) continue;
    const content = readText(file);
    if (!isClientFile(content)) continue;
    const rel = relPath(file);

    for (const regex of [dotEnv, bracketEnv]) {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const envName = match[1];
        if (envName.startsWith('NEXT_PUBLIC_')) continue;
        addFinding(
          findings,
          RULES.CLIENT_SECRET_ENV,
          rel,
          content,
          match.index,
          match[0],
          `Client-bundle ("use client") code reads private environment variable ${envName}.`,
        );
      }
    }
  }
}

function analyzeServerOnlyImportsInClient(files, findings) {
  const importPattern = /\bimport\s+(?:type\s+)?(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g;
  const serverOnlySpecifier =
    /^(?:server-only|next\/server|@pumni\/auth(?:\/.*)?|@pumni\/env(?:\/.*)?|@pumni\/supabase\/server(?:\/.*)?|@pumni\/[^/]+\/server(?:\/.*)?|.*\/server)$/;

  for (const file of files) {
    if (!CLIENT_CODE_EXTENSIONS.has(path.extname(file))) continue;
    const content = readText(file);
    if (!isClientFile(content)) continue;
    const rel = relPath(file);
    let match;

    while ((match = importPattern.exec(content)) !== null) {
      const specifier = match[1];
      if (!serverOnlySpecifier.test(specifier)) continue;
      addFinding(
        findings,
        RULES.SERVER_ONLY_IN_CLIENT,
        rel,
        content,
        match.index,
        match[0],
        `Client-bundle ("use client") code imports server-only module ${specifier}.`,
      );
    }
  }
}

function analyzeCacheLifeTooShort(files, findings) {
  // Narrow regex: only `cacheLife('seconds')` with single/double quotes is a
  // guaranteed silent bug per apps/web/AGENTS.md. Other short profiles are
  // opinion, not bugs. Template literals are skipped (cannot statically resolve).
  const re = /\bcacheLife\(\s*(['"])seconds\1\s*\)/g;
  for (const file of files) {
    const rel = relPath(file);
    if (!CODE_EXTENSIONS.has(path.extname(file))) continue;
    const content = readText(file);
    let m;
    while ((m = re.exec(content)) !== null) {
      addFinding(
        findings,
        RULES.CACHE_LIFE_TOO_SHORT,
        rel,
        content,
        m.index,
        m[0],
        "cacheLife('seconds') punches a dynamic hole in the PPR static shell with no compiler warning.",
      );
    }
  }
}

function analyzeCacheTagUnparameterized(files, findings) {
  // Flag cacheTag('literal') / cacheTag("literal") where the literal has no
  // parameterizing separator and is not a template literal. Parameterized tags
  // use template literals (cacheTag(`profile:${id}`)) or string concatenation;
  // a bare single-arg literal is the cross-user collision pattern.
  // Skip tagged-template calls cacheTag(`...`) and calls passing a variable.
  const re = /\bcacheTag\(\s*(['"])([A-Za-z0-9_-]+)\1\s*\)/g;
  for (const file of files) {
    const rel = relPath(file);
    if (!CODE_EXTENSIONS.has(path.extname(file))) continue;
    const content = readText(file);
    let m;
    while ((m = re.exec(content)) !== null) {
      // A bare identifier without a `:` (or other namespace separator) is the
      // collision risk. Namespaced literals like cacheTag('posts:featured')
      // are acceptable as static, shared tags.
      const tagValue = m[2];
      if (tagValue.includes(':')) continue;
      addFinding(
        findings,
        RULES.CACHE_TAG_UNPARAMETERIZED,
        rel,
        content,
        m.index,
        m[0],
        `cacheTag('${tagValue}') with a non-parameterized literal collides across users/scopes.`,
      );
    }
  }
}

function analyzeUseCachePlacement(files, findings) {
  // 'use cache' inside a wrapper function that returns another function/arrow
  // is silently ignored by the Next.js cache compiler. Detect the pattern:
  //   function wrapper(fn) { return async () => { 'use cache'; ... }; }
  // The directive must be at file-level or directly in the fetch function body.
  const wrapperArrow = /\bfunction\s+\w+\s*\([^)]*\)\s*\{[\s\S]{0,200}?\breturn\b[\s\S]{0,200}?'use\s+cache'/g;
  const wrapperConst = /\bconst\s+\w+\s*=\s*(?:\([^)]*\)|[^=]*)\s*=>\s*(?:\([^)]*\)|[^=]*)\s*=>[\s\S]{0,200}?'use\s+cache'/g;

  for (const file of files) {
    const rel = relPath(file);
    if (!CODE_EXTENSIONS.has(path.extname(file))) continue;
    if (/(__tests__|\.test\.|\.spec\.)/.test(rel)) continue;
    const content = readText(file);
    // Skip files that already have file-level 'use cache' — those are fine.
    const hasFileLevelCache = /^\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*['"]use\s+cache['"]/.test(
      content.slice(0, 400),
    );

    for (const regex of [wrapperArrow, wrapperConst]) {
      regex.lastIndex = 0;
      let match;
      while ((match = regex.exec(content)) !== null) {
        if (hasFileLevelCache) {
          // The file-level directive makes the wrapper-level one redundant but
          // not harmful — skip.
          continue;
        }
        addFinding(
          findings,
          RULES.USE_CACHE_PLACEMENT,
          rel,
          content,
          match.index,
          content.slice(match.index, match.index + 100),
          "'use cache' inside a wrapper function is silently ignored — move it to the actual fetch function or file-level.",
        );
      }
    }
  }
}

function analyzeUpdateTagScope(files, findings) {
  // updateTag() is a Server Action API (revalidateTag for the cache, but inside
  // the action scope). Using it in a regular function or Route Handler throws at
  // runtime. Detect updateTag(...) in files that do NOT carry "use server".
  const updateTagRe = /\bupdateTag\s*\(/g;
  for (const file of files) {
    const rel = relPath(file);
    if (!CODE_EXTENSIONS.has(path.extname(file))) continue;
    if (/(__tests__|\.test\.|\.spec\.)/.test(rel)) continue;
    const content = readText(file);
    // File-level "use server" — this is a valid Server Action file.
    if (/^\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*['"]use\s+server['"]/.test(content.slice(0, 400))) {
      continue;
    }
    // Function-level "use server" (inline Server Action).
    updateTagRe.lastIndex = 0;
    let match;
    while ((match = updateTagRe.exec(content)) !== null) {
      // Skip prose mentions: in JSX text/attrs or comment-only lines.
      // Real code calls to updateTag() appear as standalone expressions, not
      // inside quotes or template-literal props.
      const lineStart = content.lastIndexOf('\n', match.index) + 1;
      const lineText = content.slice(lineStart, content.indexOf('\n', match.index));
      const lineIndex = match.index - lineStart;
      const beforeMatch = lineText.slice(0, lineIndex);
      // Inside a JSX string attribute (description="...updateTag()...") or
      // inside a code example (code={`...updateTag()...`}).
      if (/["'`]/.test(beforeMatch) && /description=|title=|label=|code=|placeholder=/i.test(lineText)) continue;
      if (/^s*(?:\/\/|\/\*|\`|\*)/.test(lineText.trim())) continue;
      // Skip if the match is in a JSX code block or string template.
      // Scan backward up to 800 chars for a function declaration that has "use server"
      const prefix = content.slice(Math.max(0, match.index - 800), match.index);
      if (/['"]use\s+server['"]/.test(prefix)) continue;
      // Also check forward for "use server" in the enclosing function body
      const suffix = content.slice(match.index, match.index + 400);
      if (/['"]use\s+server['"]/.test(suffix)) continue;

      addFinding(
        findings,
        RULES.UPDATE_TAG_SCOPE,
        rel,
        content,
        match.index,
        content.slice(match.index, Math.min(match.index + 60, content.length)),
        'updateTag() outside a "use server" scope throws at runtime — move to a Server Action.',
      );
    }
  }
}

function analyzeTrustedUserIdWrites(files, findings, sqlEvidence) {
  const fromRegex = /\.from\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
  for (const file of files) {
    const rel = relPath(file);
    if (!CLIENT_CODE_EXTENSIONS.has(path.extname(file))) continue;
    if (/(__tests__|\.test\.|\.spec\.)/.test(rel)) continue;
    const content = readText(file);
    if (!isClientFile(content)) continue; // only client-side writes are untrusted
    let fromMatch;
    while ((fromMatch = fromRegex.exec(content)) !== null) {
      const tableName = fromMatch[1];
      const statementEnd = content.indexOf(';', fromMatch.index);
      const scanEnd = statementEnd >= 0 ? statementEnd : fromMatch.index + 2000;
      const windowText = content.slice(fromMatch.index, scanEnd);
      const writeMatch = /\.(insert|upsert|update)\s*\(/.exec(windowText);
      if (!writeMatch) continue;
      const callStart = fromMatch.index + writeMatch.index;
      const argument = getCallArgument(content, callStart);
      if (!argument || !argumentContainsUserIdWrite(content, argument)) continue;
      if (hasRlsWithCheckEvidence(sqlEvidence, tableName)) continue;
      addFinding(
        findings,
        RULES.TRUSTED_USER_ID_WRITE,
        rel,
        content,
        argument.start,
        `${writeMatch[0]} payload contains user_id for table ${tableName}`,
        `Client writes user_id for ${tableName} without detected RLS WITH CHECK auth.uid() evidence.`,
      );
    }
  }
}

function analyzeSwallowedErrors(files, findings) {
  const catchRegex = /catch\s*\(([^)]*)\)\s*\{/g;
  const promiseCatchRegex = /\.catch\s*\(\s*(?:\([^)]*\)|[A-Za-z_$][\w$]*)?\s*=>\s*\{/g;
  const handledPattern =
    /\b(?:throw|return|console\.(?:error|warn|info|log)|logger\.|Sentry\.|captureException|setError|reportError)\b/;
  for (const file of files) {
    const rel = relPath(file);
    if (!API_SERVICE_PATTERN.test(rel)) continue;
    const content = readText(file);
    for (const regex of [catchRegex, promiseCatchRegex]) {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const openIndex = content.indexOf('{', match.index);
        const closeIndex = findBlockEnd(content, openIndex);
        if (closeIndex < 0) continue;
        const body = content.slice(openIndex + 1, closeIndex);
        const normalized = body
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/\/\/.*$/gm, '')
          .trim();
        if (normalized && handledPattern.test(normalized)) continue;
        addFinding(
          findings,
          RULES.SWALLOWED_ERROR,
          rel,
          content,
          match.index,
          content.slice(match.index, Math.min(closeIndex + 1, match.index + 160)),
          'Catch block in server I/O code does not visibly propagate, return, or log the error.',
        );
      }
    }
  }
}

function analyzeMissingAuthUidPolicies(sqlFiles, findings) {
  for (const file of sqlFiles) {
    const rel = relPath(file);
    const content = readText(file);
    for (const policy of findSqlStatements(content, /create\s+policy\b/gi)) {
      if (!isUserOwnedPolicy(policy.text)) continue;
      if (hasAuthUid(policy.text)) continue;
      addFinding(
        findings,
        RULES.MISSING_AUTH_UID_POLICY,
        rel,
        content,
        policy.start,
        policy.text.slice(0, 220),
        'User-owned RLS policy does not contain an auth.uid() owner predicate.',
      );
    }
  }
}

function analyzeRpcUserIdWithoutAuthCheck(sqlFiles, findings) {
  for (const file of sqlFiles) {
    const rel = relPath(file);
    const content = readText(file);
    for (const fn of findSqlStatements(content, /create\s+(?:or\s+replace\s+)?function\b/gi)) {
      if (!/\bp_user_id\b/i.test(fn.text)) continue;
      if (hasRpcUserIdAuthCheck(fn.text)) continue;
      addFinding(
        findings,
        RULES.RPC_USER_ID_WITHOUT_AUTH_CHECK,
        rel,
        content,
        fn.start,
        fn.text.slice(0, 220),
        'RPC accepts p_user_id without a detected auth.uid() comparison.',
      );
    }
  }
}

function analyzeMutationWithoutInvalidation(files, findings) {
  const mutationPattern = /\buseMutation\s*\(/g;
  const invalidationPresent = /\binvalidateQueries\b|\bsetQueryData\b|\brefetchQueries\b/;
  for (const file of files) {
    const rel = relPath(file);
    if (!rel.startsWith('apps/web/src/')) continue;
    if (!CLIENT_CODE_EXTENSIONS.has(path.extname(file))) continue;
    if (/(__tests__|\.test\.|\.spec\.)/.test(rel)) continue;
    const content = readText(file);
    if (!content.includes('useMutation')) continue;
    let match;
    while ((match = mutationPattern.exec(content)) !== null) {
      const openIndex = content.indexOf('{', match.index);
      if (openIndex < 0) continue;
      const closeIndex = findBlockEnd(content, openIndex);
      const body =
        closeIndex >= 0
          ? content.slice(openIndex, closeIndex + 1)
          : content.slice(openIndex, openIndex + 2000);
      if (!/\bonSuccess\b|\bonSettled\b/.test(body)) {
        if (!body.includes('supabase') && !body.includes('mutationFn') && !body.includes('action'))
          continue;
        addFinding(
          findings,
          RULES.MUTATION_WITHOUT_INVALIDATION,
          rel,
          content,
          match.index,
          content.slice(match.index, match.index + 120),
          'useMutation has no onSuccess/onSettled - cache may be stale after the mutation.',
        );
        continue;
      }
      const onSuccessMatch = body.match(
        /onSuccess\s*:\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{([\s\S]{0,1000})/,
      );
      const onSettledMatch = body.match(
        /onSettled\s*:\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{([\s\S]{0,1000})/,
      );
      const cbBodies = [onSuccessMatch?.[1], onSettledMatch?.[1]].filter(Boolean).join('\n');
      if (cbBodies && !invalidationPresent.test(cbBodies)) {
        if (cbBodies.trim().length < 80) continue;
        addFinding(
          findings,
          RULES.MUTATION_WITHOUT_INVALIDATION,
          rel,
          content,
          match.index,
          content.slice(match.index, match.index + 120),
          'useMutation onSuccess/onSettled does not call invalidateQueries or setQueryData.',
        );
      }
    }
  }
}

function analyzeQueryResultInZustand(files, findings) {
  const effectWithDataSetter =
    /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[^}]{0,500}set[A-Z][^(]*\([^)]*\bdata\b[^)]*\)[^}]{0,200}\}[^,]*,\s*\[[^\]]*\bdata\b[^\]]*\]\s*\)/gs;
  for (const file of files) {
    if (!file.endsWith('.ts') && !file.endsWith('.tsx')) continue;
    const rel = relPath(file);
    if (rel.includes('/stores/') || rel.includes('/__tests__/') || rel.includes('.test.')) continue;
    const content = readText(file);
    const hasUseQuery = /use(?:Query|InfiniteQuery)\s*\(/.test(content);
    if (!hasUseQuery || !/\buseEffect\s*\(/.test(content)) continue;
    let match;
    effectWithDataSetter.lastIndex = 0;
    while ((match = effectWithDataSetter.exec(content)) !== null) {
      if (/const\s*\{[^}]*\bdata\b/.test(content)) {
        addFinding(
          findings,
          RULES.QUERY_RESULT_IN_ZUSTAND,
          rel,
          content,
          match.index,
          match[0].slice(0, 120),
          'TanStack Query data is mirrored into a setter - server state must stay in the Query cache.',
        );
      }
    }
  }
}

function analyzeMissingLoadingState(files, findings) {
  for (const file of files) {
    if (!file.endsWith('.tsx')) continue;
    const rel = relPath(file);
    if (rel.includes('/__tests__/') || rel.includes('.test.')) continue;
    const content = readText(file);
    if (!/\buseQuery\s*\(/.test(content)) continue;
    if (!/return\s*\(?\s*</.test(content)) continue;
    const handlesLoading =
      /\bisLoading\b/.test(content) ||
      /\bisPending\b/.test(content) ||
      /\bSkeleton\b|\bSpinner\b|\bPlaceholder\b|\bLoading\b/.test(content) ||
      /isLoading\s*&&|\?\s*null\s*:/.test(content);
    if (handlesLoading) continue;
    const queryMatch = /\buseQuery\s*\(/.exec(content);
    if (queryMatch) {
      addFinding(
        findings,
        RULES.MISSING_LOADING_STATE,
        rel,
        content,
        queryMatch.index,
        queryMatch[0],
        'Component uses useQuery but does not handle isLoading/isPending.',
      );
    }
  }
}

function analyzeRouteBusinessLogic(files, findings) {
  // Next.js App Router files: page/layout/route/loading/error/template under app/.
  // Server Components legitimately read data; flag mutations and ad-hoc network/timers only.
  const ROUTE_FILE =
    /apps\/web\/src\/app\/.*\/(?:page|layout|route|template|loading|error|default)\.(?:t|j)sx?$/;
  const PATTERNS = [
    { pattern: /\buseMutation\s*\(/g, label: 'useMutation() definition' },
    { pattern: /\bfetch\s*\(\s*['"`]https?:/g, label: 'hardcoded external fetch()' },
    { pattern: /\bsetTimeout\s*\(/g, label: 'setTimeout()' },
  ];
  for (const file of files) {
    const rel = relPath(file);
    if (!ROUTE_FILE.test(rel)) continue;
    const content = readText(file);
    for (const { pattern, label } of PATTERNS) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        addFinding(
          findings,
          RULES.ROUTE_BUSINESS_LOGIC,
          rel,
          content,
          match.index,
          content.slice(match.index, match.index + 60),
          `Route file contains ${label} - move to a feature hook or service.`,
        );
      }
    }
  }
}

function analyzeServerActionWrites(files, findings) {
  const ACTION_FILE = /^apps\/web\/src\/features\/[^/]+\/actions\.ts$/;
  const writePattern =
    /\.from\(\s*['"`][^'"`]+['"`]\s*\)[\s\S]{0,1400}?\.(insert|update|upsert|delete)\s*\(/;
  const hasAuthCheck = /\b(?:requireUser|getUser)\s*\(|\bauth\s*\.\s*getUser\s*\(/;
  const hasRevalidation = /\b(?:revalidatePath|revalidateTag|updateTag|redirect)\s*\(/;

  for (const file of files) {
    const rel = relPath(file);
    if (!ACTION_FILE.test(rel)) continue;
    const content = readText(file);
    if (
      !/^﻿?\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*['"]use server['"]/.test(content.slice(0, 400))
    ) {
      continue;
    }

    const blocks = collectFunctionBlocks(content);
    for (const block of blocks) {
      const writeMatch = writePattern.exec(block.text);
      if (!writeMatch) continue;
      const writeIndex = block.bodyStart + writeMatch.index;

      if (!hasAuthCheck.test(block.text)) {
        addFinding(
          findings,
          RULES.SERVER_ACTION_MISSING_AUTH,
          rel,
          content,
          writeIndex,
          content.slice(writeIndex, writeIndex + 140),
          `Server Action ${block.name} writes through Supabase without a detected user auth check.`,
        );
      }

      if (!hasRevalidation.test(block.text)) {
        addFinding(
          findings,
          RULES.SERVER_ACTION_MISSING_REVALIDATION,
          rel,
          content,
          writeIndex,
          content.slice(writeIndex, writeIndex + 140),
          `Server Action ${block.name} writes through Supabase without cache revalidation or redirect.`,
        );
      }
    }
  }
}

function analyzeLegacyMiddleware(files, findings) {
  for (const file of files) {
    const rel = relPath(file);
    if (rel.endsWith('middleware.ts') || rel.endsWith('middleware.js')) {
      const content = readText(file);
      addFinding(
        findings,
        RULES.LEGACY_MIDDLEWARE,
        rel,
        content,
        0,
        'File name is middleware.ts/js',
        'middleware.ts is deprecated. Use proxy.ts instead.',
      );
    }
  }
}

function analyzeImagePriority(files, findings) {
  const re = /<Image\b[^>]*\bpriority\b/g;
  for (const file of files) {
    if (!file.endsWith('.tsx') && !file.endsWith('.jsx')) continue;
    const content = readText(file);
    const rel = relPath(file);
    let m;
    while ((m = re.exec(content)) !== null) {
      addFinding(
        findings,
        RULES.IMAGE_PRIORITY_DEPRECATED,
        rel,
        content,
        m.index,
        m[0],
        'The priority prop on <Image> is deprecated in Next.js 16. Use preload="eager" instead.',
      );
    }
  }
}

function analyzeSingleArgRevalidateTag(files, findings) {
  const re = /\brevalidateTag\s*\(/g;
  for (const file of files) {
    const content = readText(file);
    const rel = relPath(file);
    let m;
    while ((m = re.exec(content)) !== null) {
      const arg = getCallArgument(content, m.index);
      if (!arg) continue;
      const text = arg.text.trim();
      if (text.length > 0) {
        const commaCount = text.split(',').length - 1;
        if (commaCount === 0) {
          addFinding(
            findings,
            RULES.SINGLE_ARG_REVALIDATE_TAG,
            rel,
            content,
            m.index,
            'revalidateTag(' + arg.text + ')',
            'revalidateTag() must be called with two arguments in Next.js 16.',
          );
        }
      }
    }
  }
}

// Guards the verify-loop against reward-hacking: an agent told to "make the
// suite pass" can game a gate by focusing (`.only`), disabling (`.skip`), or
// swallowing a throwing assertion (empty `catch`) instead of fixing the code.
// Static presence is the signal — `.only` should never be committed; an
// intentional `.skip` goes through ai-review-rule-allowlist.json with a reason.
const TEST_FILE_PATTERN = /(?:__tests__|\.test\.|\.spec\.)/;

function analyzeTestWeakening(files, findings) {
  const focusRegex = /(?:describe|it|test)\s*\.\s*(only|skip)\b/g;
  const catchRegex = /catch\s*(?:\([^)]*\))?\s*\{/g;
  for (const file of files) {
    const rel = relPath(file);
    if (!TEST_FILE_PATTERN.test(rel)) continue;
    const content = readText(file);

    focusRegex.lastIndex = 0;
    let match;
    while ((match = focusRegex.exec(content)) !== null) {
      const kind = match[1];
      addFinding(
        findings,
        RULES.TEST_WEAKENING,
        rel,
        content,
        match.index,
        content.slice(match.index, match.index + 40),
        kind === 'only'
          ? '`.only` silently disables every other test in the file — never commit it.'
          : '`.skip` disables a test; remove it or allowlist it with a tracked reason.',
      );
    }

    catchRegex.lastIndex = 0;
    while ((match = catchRegex.exec(content)) !== null) {
      const openIndex = content.indexOf('{', match.index);
      const closeIndex = findBlockEnd(content, openIndex);
      if (closeIndex < 0) continue;
      const body = content
        .slice(openIndex + 1, closeIndex)
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
        .trim();
      if (body) continue; // only a truly-empty catch swallows the failure
      addFinding(
        findings,
        RULES.TEST_WEAKENING,
        rel,
        content,
        match.index,
        content.slice(match.index, Math.min(closeIndex + 1, match.index + 80)),
        'Empty catch in a test swallows a failing assertion; assert the error with expect(...).toThrow().',
      );
    }
  }
}

// -- driver -------------------------------------------------------------------

function runAnalysis({ files, sqlFiles, sqlEvidence, allowlist }) {
  const findings = [];
  analyzeSelectStar(files, findings);
  analyzeServiceRoleClient(files, findings);
  analyzeClientSecretEnv(files, findings);
  analyzeServerOnlyImportsInClient(files, findings);
  analyzeCacheLifeTooShort(files, findings);
  analyzeCacheTagUnparameterized(files, findings);
  analyzeUseCachePlacement(files, findings);
  analyzeUpdateTagScope(files, findings);
  analyzeTrustedUserIdWrites(files, findings, sqlEvidence);
  analyzeSwallowedErrors(files, findings);
  analyzeMissingAuthUidPolicies(sqlFiles, findings);
  analyzeRpcUserIdWithoutAuthCheck(sqlFiles, findings);
  analyzeMutationWithoutInvalidation(files, findings);
  analyzeQueryResultInZustand(files, findings);
  analyzeMissingLoadingState(files, findings);
  analyzeRouteBusinessLogic(files, findings);
  analyzeServerActionWrites(files, findings);
  analyzeLegacyMiddleware(files, findings);
  analyzeImagePriority(files, findings);
  analyzeSingleArgRevalidateTag(files, findings);
  analyzeTestWeakening(files, findings);
  return findings.filter((f) => !isAllowlisted(allowlist, f));
}

function printFinding(f) {
  console.error(`[${f.severity}] ${f.ruleId}`);
  console.error(`File: ${f.file}:${f.line}`);
  console.error(`Evidence: ${f.evidence}`);
  console.error(`Detail: ${f.detail}`);
  console.error(`Fix: ${f.fix}`);
  console.error('');
}

function runSelfTest() {
  const serverFile = 'apps/web/src/features/selftest/actions.ts';
  const clientFile = 'apps/web/src/features/selftest/form.tsx';
  const stateFile = 'apps/web/src/features/selftest/panel.tsx';
  const routeFile = 'apps/web/src/app/selftest/page.tsx';
  const routeHandlerFile = 'apps/web/src/app/selftest/route.ts';
  const sqlFile = 'supabase/migrations/00000000000000_selftest.sql';
  const middlewareFile = 'apps/web/src/middleware.ts';
  const testFile = 'apps/web/src/test/selftest/weak.test.ts';

  const serverFixture = `
    "use server";
    import 'server-only';
    import { createSupabaseServerClient } from '@pumni/supabase/server';
    export async function listAll() {
      const supabase = createSupabaseServerClient();
      return supabase.from('profiles').select('*').eq('user_id', 'ok');
    }
    export async function risky() {
      try {
        await listAll();
      } catch (error) {
      }
    }
    export async function unsafeWrite(input) {
      const supabase = createSupabaseServerClient();
      return supabase.from('profiles').update({ username: input.username }).eq('id', input.id);
    }
    export async function cachedShort() {
      'use cache';
      cacheLife('seconds');
      cacheTag('profile');
      revalidateTag('stale_tag');
    }
    function withRetry(fn: () => Promise<unknown>) {
      return async () => {
        'use cache';
        return fn();
      };
    }
  `;
  const clientFixture = `
    'use client';
    import { requireUser } from '@pumni/auth';
    import { supabase } from '@pumni/supabase/client';
    const privateEnv = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    export async function badWrite(userId) {
      return supabase.from('orphan_table').upsert({ user_id: userId, name: 'x' });
    }
  `;
  const stateFixture = `
    "use client";
    import { useEffect } from 'react';
    import { useMutation, useQuery } from '@tanstack/react-query';
    import { useProfileStore } from '@/stores/profile';
    import { saveProfile } from './actions';
    export function SelftestPanel() {
      const { data } = useQuery({ queryKey: ['selftest'], queryFn: async () => ({ name: 'x' }) });
      const setProfile = useProfileStore((state) => state.setProfile);
      useEffect(() => {
        setProfile(data);
      }, [data, setProfile]);
      const mutation = useMutation({ mutationFn: saveProfile });
      return (
        <div>
          <button onClick={() => mutation.mutate(data)}>Save {data?.name}</button>
          <Image src="/img.png" priority />
        </div>
      );
    }
  `;
  const routeFixture = `
    "use client";
    import { useMutation } from '@tanstack/react-query';
    export default function Page() {
      const mutation = useMutation({ mutationFn: async () => ({ ok: true }) });
      return <button onClick={() => mutation.mutate()}>Save</button>;
    }
  `;
  const routeHandlerFixture = `
    import { revalidateTag } from 'next/cache';
    export async function GET() {
      updateTag('stale_profile');
      revalidateTag('posts', 'max');
      return Response.json({ ok: true });
    }
  `;
  const sqlFixture = `
    create policy "Users view own unsafe" on public.unsafe_things
      for select to authenticated using (user_id = p_user_id);
    create policy "Users view own safe" on public.safe_things
      for select to authenticated using (user_id = auth.uid());
    create or replace function public.unsafe_rpc(p_user_id uuid) returns jsonb
      language plpgsql as $$
      begin return jsonb_build_object('user_id', p_user_id); end; $$;
  `;

  const testFixture = `
    import { describe, it, expect } from 'vitest';
    describe.only('weak suite', () => {
      it('does a thing', () => {
        expect(1).toBe(1);
      });
      it.skip('pending', () => {});
      it('swallows', () => {
        try {
          mightThrow();
        } catch (error) {
        }
      });
    });
  `;
  const map = {
    [resolveRel(serverFile)]: serverFixture,
    [resolveRel(clientFile)]: clientFixture,
    [resolveRel(stateFile)]: stateFixture,
    [resolveRel(routeFile)]: routeFixture,
    [resolveRel(routeHandlerFile)]: routeHandlerFixture,
    [resolveRel(sqlFile)]: sqlFixture,
    [resolveRel(middlewareFile)]: 'export default function middleware() {}',
    [resolveRel(testFile)]: testFixture,
  };
  const original = fs.readFileSync;
  fs.readFileSync = (filePath, ...rest) =>
    map[filePath] !== undefined ? map[filePath] : original.call(fs, filePath, ...rest);

  try {
    const findings = runAnalysis({
      files: [
        resolveRel(serverFile),
        resolveRel(clientFile),
        resolveRel(stateFile),
        resolveRel(routeFile),
        resolveRel(routeHandlerFile),
        resolveRel(middlewareFile),
        resolveRel(testFile),
      ],
      sqlFiles: [resolveRel(sqlFile)],
      sqlEvidence: sqlFixture,
      allowlist: {},
    });
    const found = new Set(findings.map((f) => f.ruleId));
    const expected = Object.values(RULES);
    const missing = expected.filter((r) => !found.has(r));
    if (missing.length > 0) {
      console.error(`Self-test FAILED. Missing rules: ${missing.join(', ')}`);
      console.error(`Rule types fired: ${[...found].sort().join(', ') || '(none)'}`);
      console.error('Findings:');
      for (const f of findings) printFinding(f);
      process.exit(1);
    }
    console.log(
      `Review gate static rule self-test passed (${expected.length}/${expected.length} expected rule types fired).`,
    );
    console.log(`Rule types fired: ${[...found].sort().join(', ')}`);
  } finally {
    fs.readFileSync = original;
  }
}

if (selfTest) {
  runSelfTest();
  process.exit(0);
}

let allowlist;
try {
  allowlist = loadAllowlist();
} catch (error) {
  console.error(`[ERROR] ${error.message}`);
  process.exit(1);
}

const files = collectCodeFiles();
const sqlFiles = collectSqlFiles();
const sqlEvidence = collectSqlEvidence(sqlFiles);
const findings = runAnalysis({ files, sqlFiles, sqlEvidence, allowlist });

if (findings.length > 0) {
  for (const f of findings) printFinding(f);
  console.error(
    `Review gate static checks failed with ${findings.length} finding(s).${strict ? ' Strict mode enabled.' : ''}`,
  );
  process.exit(1);
}

console.log(
  `Review gate static checks passed (${files.length} code file(s), ${sqlFiles.length} SQL file(s) scanned${strict ? ', strict mode' : ''}).`,
);
