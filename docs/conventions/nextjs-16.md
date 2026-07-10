---
description: Next.js 16 canonical rules — async request APIs, Cache Components, route props, PPR. Read before writing any Next.js 16 app code, queries, or Server Actions.
---

# Next.js 16 Canonical Rules

> **Not the Next.js in your training data.** APIs, conventions, and file structure
> differ. Look up specifics in `node_modules/next/dist/docs/` or the `nextjs_docs`
> MCP — never rely on training-data knowledge.

## Async Request APIs

Every request-time API requires `await`. The sync form **compiles but throws at
runtime**.

| API | Correct |
|---|---|
| `params` | `const { id } = await params;` |
| `searchParams` | `const q = (await searchParams).q;` |
| `cookies()` | `const jar = await cookies();` |
| `headers()` | `const hdrs = await headers();` |
| `draftMode()` | `const { isEnabled } = await draftMode();` |

### Type generation

Before handcrafting `PageProps` or `RouteContext` types, run:

```bash
npx next typegen
```

This generates correct types from your actual route tree. Do not hand-write
them — they drift from the real segment structure.

### Function signature

```ts
// ✅
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
}

// ❌ — old sync signature, causes runtime throw in Next.js 16
export default function Page({ params }: { params: { slug: string } }) {
  const { slug } = params;
}
```

## Route Props

Prefer global `PageProps<"...">` and `LayoutProps<"...">` helpers when a route
needs typed `params`, `searchParams`, or named slots. Simple layouts that only
accept `children` may keep local `React.ReactNode` typing.

## Cache Components (`'use cache'`)

`cacheComponents: true` is enabled in `apps/web/next.config.ts`.

### Placement — where to put `'use cache'`

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

### `cacheLife()` — minimum profiles

| Profile | Safe? | Notes |
|---|---|---|
| `'seconds'` | ❌ | Silently breaks PPR static shell |
| `'minutes'` | ✅ | Minimum safe value |
| `'hours'` | ✅ | Recommended for stable reference data |
| `'days'` | ✅ | Long-lived content |

### `cacheTag()` — always parameterize

```ts
// ✅ User-scoped tags prevent cross-user cache collisions
cacheTag(`profile:${userId}`);
cacheTag(`post:${postId}`);

// ❌ Generic tags collide across users
cacheTag('profile');
```

### `updateTag()` — Server Actions only

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

### `revalidateTag()` — two parameters

```ts
// ✅ SWR lifecycle config required
revalidateTag('posts', 'max');

// ❌ Single-param form uses legacy invalidation, no type error
revalidateTag('posts');
```

## PPR (Partial Pre-Rendering) & Suspense

To make a route serve an instant static shell with PPR: mark the cached server
function with `'use cache'`, give it a parameterized `cacheTag(...)` and a safe
`cacheLife(...)`, and wrap every dynamic child in `<Suspense>`. Build-time
validation flags a dynamic read with no cache or Suspense boundary.

Protected layouts must keep auth checks behind a local Suspense boundary with a
static fallback shell that does **not** render protected children before
authentication resolves.

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

## Route Segment Config

Keep Next.js route segment config exports (`dynamic`, `revalidate`,
`fetchCache`) and the `'use cache'` directive in Server Components. Never place
them in `"use client"` pages or components.
