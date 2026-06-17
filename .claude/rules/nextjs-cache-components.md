---
description: Next.js 16 Cache Components rules — loaded automatically when reading/writing server data functions or files with 'use cache'.
globs:
  - "apps/web/src/features/**/queries.ts"
  - "apps/web/src/features/**/actions.ts"
  - "apps/web/src/app/**/*.ts"
  - "apps/web/src/app/**/*.tsx"
---

# Next.js 16 Cache Components

Loaded automatically when you open feature query/action files or App Router segments.

## Placement — where to put `'use cache'`

```ts
// ✅ File-level directive
'use cache';
export async function getProfile(userId: string) {
  return supabase.from('profiles').select('id, display_name').eq('id', userId);
}

// ✅ Inside the function body that directly fetches
export async function getProfile(userId: string) {
  'use cache';
  return supabase.from('profiles').select('id, display_name').eq('id', userId);
}

// ❌ Inside a wrapper — silently becomes dynamic, cache is ignored
function withRetry(fn: () => Promise<unknown>) {
  return async () => {
    'use cache'; // ← WRONG PLACEMENT
    return fn();
  };
}
```

## `cacheLife()` — minimum profiles

| Profile | Safe? | Notes |
|---------|-------|-------|
| `'seconds'` | ❌ | Silently breaks PPR static shell |
| `'minutes'` | ✅ | Minimum safe value |
| `'hours'` | ✅ | Recommended for stable reference data |
| `'days'` | ✅ | Long-lived content |

## `cacheTag()` — always parameterize

```ts
// ✅ User-scoped tags prevent cross-user cache collisions
cacheTag(`profile:${userId}`);
cacheTag(`post:${postId}`);

// ❌ Generic tags collide across users
cacheTag('profile');
```

## `updateTag()` — Server Actions only

```ts
// ✅ Server Action
'use server';
export async function updateProfile(data: FormData) {
  const user = await requireUser();
  await supabase.from('profiles').update({ ... }).eq('id', user.id);
  updateTag(`profile:${user.id}`);
}

// ❌ Route Handler — runtime throw
export async function PUT(req: Request) {
  updateTag('profile'); // ← throws at runtime
}
```

## `revalidateTag()` — two parameters

```ts
// ✅ SWR lifecycle config required
revalidateTag('posts', 'max');

// ❌ Single-param form uses legacy invalidation, no type error
revalidateTag('posts');
```

## Suspense boundaries

Every dynamic component must be wrapped in `<Suspense>`. Never render protected content in the fallback shell.

```tsx
// ✅
<Suspense fallback={<Skeleton />}>
  <UserFeed userId={userId} />
</Suspense>

// ❌ Protected content visible before auth resolves
<Suspense fallback={<PrivateUserName />}>
  ...
</Suspense>
```
