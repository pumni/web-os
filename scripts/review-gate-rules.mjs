export const RULES = {
  SELECT_STAR: 'supabase-select-star',
  SERVICE_ROLE_CLIENT: 'service-role-client',
  TRUSTED_USER_ID_WRITE: 'trusted-client-user-id-write',
  SWALLOWED_ERROR: 'swallowed-error',
  MISSING_AUTH_UID_POLICY: 'missing-auth-uid-policy',
  RPC_USER_ID_WITHOUT_AUTH_CHECK: 'rpc-user-id-without-auth-check',
  MUTATION_WITHOUT_INVALIDATION: 'mutation-without-invalidation',
  QUERY_RESULT_IN_ZUSTAND: 'query-result-in-zustand',
  MISSING_LOADING_STATE: 'missing-loading-state',
  ROUTE_BUSINESS_LOGIC: 'route-business-logic',
  SERVER_ACTION_MISSING_AUTH: 'server-action-missing-auth',
  SERVER_ACTION_MISSING_REVALIDATION: 'server-action-missing-revalidation',
  CLIENT_SECRET_ENV: 'client-secret-env',
  SERVER_ONLY_IN_CLIENT: 'server-only-in-client',
  CACHE_LIFE_TOO_SHORT: 'cache-life-too-short',
  CACHE_TAG_UNPARAMETERIZED: 'cache-tag-unparameterized',
  USE_CACHE_PLACEMENT: 'use-cache-placement',
  UPDATE_TAG_SCOPE: 'update-tag-scope',
  LEGACY_MIDDLEWARE: 'legacy-middleware',
  IMAGE_PRIORITY_DEPRECATED: 'image-priority-deprecated',
  SINGLE_ARG_REVALIDATE_TAG: 'single-arg-revalidate-tag',
  TEST_WEAKENING: 'test-weakening',
  SERVICE_ROLE_IMPORT_ALLOWLIST: 'service-role-import-allowlist',
  QUOTA_PRECHECK_NOT_ATOMIC: 'quota-precheck-not-atomic',
};

export const RULE_INFO = {
  [RULES.SELECT_STAR]: {
    severity: 'B1',
    summary: 'Supabase reads must use explicit projection columns.',
    fix: 'Replace with explicit projection columns.',
  },
  [RULES.SERVICE_ROLE_CLIENT]: {
    severity: 'P0',
    summary: 'Service-role and secret Supabase credentials must never enter client bundles.',
    fix: 'Remove service-role / secret key usage from client-bundle ("use client") code. Service-role is server-only.',
  },
  [RULES.TRUSTED_USER_ID_WRITE]: {
    severity: 'B1',
    summary: 'Client writes must not trust client-supplied user_id values.',
    fix: 'Write user_id from a Server Action using auth.uid(), or document RLS WITH CHECK auth.uid() evidence.',
  },
  [RULES.SWALLOWED_ERROR]: {
    severity: 'B1',
    summary: 'Server I/O errors must be propagated, returned, or logged.',
    fix: 'Throw, return an explicit failure value, or log diagnostic context before continuing.',
  },
  [RULES.MISSING_AUTH_UID_POLICY]: {
    severity: 'B1',
    summary: 'User-owned RLS policies must include an auth.uid() owner predicate.',
    fix: 'Add an auth.uid() owner predicate or document why the policy is not user-owned.',
  },
  [RULES.RPC_USER_ID_WITHOUT_AUTH_CHECK]: {
    severity: 'B1',
    summary: 'RPC functions accepting p_user_id must compare it to auth.uid().',
    fix: 'Compare p_user_id to auth.uid() or derive the user id internally from auth.uid().',
  },
  [RULES.MUTATION_WITHOUT_INVALIDATION]: {
    severity: 'B2',
    summary: 'TanStack Query mutations must refresh or update affected cached data.',
    fix: 'Add onSuccess/onSettled invalidateQueries() or setQueryData() so the cache reflects the mutation.',
  },
  [RULES.QUERY_RESULT_IN_ZUSTAND]: {
    severity: 'B1',
    summary: 'TanStack Query result data must not be mirrored into Zustand stores.',
    fix: 'Use TanStack Query data directly. Zustand holds client UI state only, never server data.',
  },
  [RULES.MISSING_LOADING_STATE]: {
    severity: 'B2',
    summary: 'Client components using useQuery must render a loading or pending state.',
    fix: 'Handle isLoading/isPending: show a loading indicator, skeleton, or placeholder while data is undefined.',
  },
  [RULES.ROUTE_BUSINESS_LOGIC]: {
    severity: 'B2',
    summary: 'App Router route files should compose UI, not own mutations or ad-hoc network logic.',
    fix: 'Move mutations / network logic into a feature hook (apps/web/src/features). Route files compose UI only.',
  },
  [RULES.SERVER_ACTION_MISSING_AUTH]: {
    severity: 'B1',
    summary: 'Server Actions that write through Supabase must derive the user server-side first.',
    fix: 'Call requireUser()/auth check before writing; validate input with Zod.',
  },
  [RULES.SERVER_ACTION_MISSING_REVALIDATION]: {
    severity: 'B2',
    summary: 'Mutating Server Actions must invalidate or update Next.js cache state.',
    fix: 'After writing, revalidate the related cache tag/path.',
  },
  [RULES.CLIENT_SECRET_ENV]: {
    severity: 'B1',
    summary: 'Client files must only read NEXT_PUBLIC_* environment variables.',
    fix: 'Move private environment access to server-only code, or expose only an intentional NEXT_PUBLIC_* value.',
  },
  [RULES.SERVER_ONLY_IN_CLIENT]: {
    severity: 'B1',
    summary: 'Client files must not import server-only auth, env, or Supabase server modules.',
    fix: 'Move the import behind a Server Component, Server Action, or server-only helper boundary.',
  },
  [RULES.CACHE_LIFE_TOO_SHORT]: {
    severity: 'B2',
    summary: "cacheLife('seconds') creates a dynamic hole in the PPR static shell with no warning.",
    fix: "Use cacheLife('minutes') at minimum; prefer 'hours' or 'days' for stable reference data.",
  },
  [RULES.CACHE_TAG_UNPARAMETERIZED]: {
    severity: 'B1',
    summary: 'cacheTag() with a non-parameterized literal collides across users.',
    fix: "Pass an identifying parameter: cacheTag(`profile:${userId}`) instead of cacheTag('profile').",
  },
  [RULES.USE_CACHE_PLACEMENT]: {
    severity: 'B1',
    summary: "'use cache' inside a wrapper function is silently ignored by the compiler.",
    fix: "Move 'use cache' to the file-level or the actual fetch function body, not a wrapper that returns another function.",
  },
  [RULES.UPDATE_TAG_SCOPE]: {
    severity: 'B1',
    summary: 'updateTag() is a Server Action API and throws at runtime outside "use server" files.',
    fix: 'Move the updateTag() call into a "use server" Server Action, or use revalidateTag() in Route Handlers.',
  },
  [RULES.LEGACY_MIDDLEWARE]: {
    severity: 'B1',
    summary: 'middleware.ts is deprecated. Use proxy.ts instead.',
    fix: 'Replace middleware.ts with proxy.ts on the Node.js runtime.',
  },
  [RULES.IMAGE_PRIORITY_DEPRECATED]: {
    severity: 'B2',
    summary: 'priority prop on Next.js <Image> is deprecated.',
    fix: 'Use the standard HTML preload="eager" attribute instead.',
  },
  [RULES.SINGLE_ARG_REVALIDATE_TAG]: {
    severity: 'B1',
    summary: 'revalidateTag() must be called with two arguments in Next.js 16.',
    fix: "Specify a revalidation profile: revalidateTag(tag, 'max').",
  },
  [RULES.TEST_WEAKENING]: {
    severity: 'B1',
    summary:
      'Test files must not be silently weakened (.only / .skip / empty catch that swallows a failing assertion).',
    fix: 'Remove `.only`/`.skip` and the empty catch; assert the error with expect(...).toThrow(). For an intentional skip, allowlist it with a tracked reason.',
  },
  [RULES.SERVICE_ROLE_IMPORT_ALLOWLIST]: {
    severity: 'P0',
    summary: 'Service-role Supabase client imports must be on the allowlist.',
    fix: 'Remove service-role import or request permission to add to the allowlist in scripts/review-gate-rules.mjs.',
  },
  [RULES.QUOTA_PRECHECK_NOT_ATOMIC]: {
    severity: 'B1',
    summary: 'Quota precheck functions must perform atomic checks using locks and volatile stability.',
    fix: 'Mark the function volatile and acquire a transaction-scoped pg_advisory_xact_lock on the owner/room ID.',
  },
};

export const ALLOWED_SERVICE_ROLE_MODULES = [
  'apps/web/src/app/api/webhooks/polar/route.ts',
  'apps/web/src/features/billing/webhook-handlers.ts',
  'apps/web/src/shared/lib/audit.ts',
  'apps/web/src/features/billing/queries.ts',
  'apps/web/src/features/watch/queries.ts',
  'apps/web/src/features/billing/jobs/functions.ts',
  'apps/web/src/features/profile/queries.ts',
];
