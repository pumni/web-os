---
description: Next.js 16 async request API rules — always loaded on Claude Code; other harnesses load them via the globs in frontmatter.
globs:
  - "apps/web/src/app/**/*.tsx"
  - "apps/web/src/app/**/*.ts"
---

# Next.js 16 Async Request APIs

Always loaded on Claude Code; other harnesses load them via the globs in frontmatter.

## Mandatory await pattern

Every request-time API requires `await`. The sync form **compiles but throws at runtime**.

| API | Correct |
|---|---|
| `params` | `const { id } = await params;` |
| `searchParams` | `const q = (await searchParams).q;` |
| `cookies()` | `const jar = await cookies();` |
| `headers()` | `const hdrs = await headers();` |
| `draftMode()` | `const { isEnabled } = await draftMode();` |

## Type generation

Before handcrafting `PageProps` or `RouteContext` types, run:

```bash
npx next typegen
```

This generates correct types from your actual route tree. Do not hand-write them — they drift from the real segment structure.

## Function signature

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
