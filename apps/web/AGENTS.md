<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

Use `nextjs_docs` (MCP) or `node_modules/next/dist/docs/` to look up an API before writing it. Never rely on training-data knowledge for Next.js 16 specifics.

## Async Request APIs (ALWAYS)

All request-time APIs are now async. Use `await` — sync access will throw at runtime.

```ts
// ✅ Correct
const { id } = await params;
const token = await cookies().get('token');
const query = await searchParams;

// ❌ Wrong — was valid in Next.js 14, breaks silently in 16
const { id } = params;
```

Affected: `params`, `searchParams`, `cookies()`, `headers()`, `draftMode()`.

Run `npx next typegen` to auto-generate `PageProps` and `RouteContext` types. Do **not** handcraft these interfaces — they drift.

## Cache Components (ALWAYS / NEVER)

`cacheComponents: true` in `next.config.ts` is the only cache flag. The old `experimental.ppr` and `experimental.dynamicIO` are removed.

### Placement rules

```ts
// ✅ 'use cache' at file level OR inside the function body that fetches data
'use cache';
export async function getUser(id: string) { ... }

// ✅ Inside function body
export async function getUser(id: string) {
  'use cache';
  ...
}

// ❌ NEVER inside a wrapper function — compiler treats it as a dynamic boundary
export function withCache() {
  async function inner() {
    'use cache'; // ← silently ignored as cache, becomes dynamic
    ...
  }
}
```

### `cacheLife()` minimums

Never use `cacheLife('seconds')` — it creates a dynamic hole in the PPR static shell without any warning.

```ts
// ✅ Minimum safe profiles
cacheLife('minutes');   // lowest sensible
cacheLife('hours');
cacheLife('days');

// ❌ Breaks PPR static shell
cacheLife('seconds');
```

### `cacheTag()` — parameterized tags

Always pass an identifying parameter to prevent cross-user cache collisions:

```ts
// ✅
cacheTag(`profile:${userId}`);
cacheTag(`post:${postId}`);

// ❌ Generic tag collides across users
cacheTag('profile');
```

### `updateTag()` — Server Actions only

`updateTag()` provides read-your-writes semantics. It only works inside Server Actions.

```ts
// ✅ Inside a Server Action
'use server';
export async function updateProfile(data: FormData) {
  await supabase.from('profiles').update(...);
  updateTag(`profile:${userId}`);
}

// ❌ Inside a Route Handler — throws at runtime
export async function PUT(req: Request) {
  updateTag('profile'); // ← runtime throw
}
```

### `revalidateTag()` — two parameters

The new Stale-While-Revalidate mechanism requires a lifecycle config as second argument:

```ts
// ✅
revalidateTag('posts', 'max');

// ❌ Old single-param form — compiles but uses legacy invalidation
revalidateTag('posts');
```

## Suspense & PPR (ALWAYS)

Wrap dynamic data boundaries with `<Suspense>`. Never render protected/user-specific content in the static fallback shell.

```tsx
// ✅ Static shell + dynamic hole
export default function Page() {
  return (
    <main>
      <StaticHeader />
      <Suspense fallback={<Skeleton />}>
        <DynamicFeed />
      </Suspense>
    </main>
  );
}
```

## Link transitionTypes (16.2+)

`<Link>` now accepts `transitionTypes` prop for App Router view transitions:

```tsx
import { addTransitionType } from 'react';
<Link href="/blog" transitionTypes={['slide-in']}>Blog</Link>
```

Use `React.addTransitionType` to register custom transition strings.

## Three-Tier Decision Model

| Category | Examples |
|----------|----------|
| **Always do** | `await params/searchParams/cookies/headers`, use `npx next typegen`, parameterize `cacheTag`, wrap dynamic content in `<Suspense>` |
| **Ask before doing** | Enabling `cacheComponents` for a new route, adding a new `cacheLife` profile, changing PPR boundaries |
| **Never do** | Place `'use cache'` in a wrapper, use `cacheLife('seconds')`, call `updateTag()` outside Server Actions, call `revalidateTag()` with one argument, use sync request API access |

<!-- END:nextjs-agent-rules -->
