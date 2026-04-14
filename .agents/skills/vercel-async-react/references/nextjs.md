# Async React in Next.js

How the App Router integrates with React's async coordination primitives. Only Next.js-specific details — for the primitives themselves, see `SKILL.md` and `patterns.md`.

---

## Server Actions + Cache Invalidation

Server actions are the mutation layer. They run on the server and integrate with the transition system via form `action` or `startTransition` on the client.

**Every server action that mutates data must invalidate.** Without invalidation, `useOptimistic` shows the instant result but the server never re-renders — so the optimistic value settles to stale data, and navigating away and back shows old state.

Two invalidation methods:

- **`refresh()`** — Invalidates the entire client router cache. The simplest option: import from `next/cache` and call at the end of the server action. Use when you don't have granular cache tags.
- **`updateTag(tag)`** — Marks specific cached entries as stale. More targeted: only server components using `cacheTag(tag)` re-render. Use when your queries have cache tags.

**Verify the import exists** — `refresh()` is a Next.js 16 API. Before using it, confirm it's available: `grep 'refresh' node_modules/next/cache.js`. If not found, fall back to `revalidatePath('/')` from `next/cache`.

```tsx
'use server';

import { refresh } from 'next/cache';

export async function toggleStar(taskId: string) {
  await db.star.toggle({ where: { taskId, userId } });
  refresh();
}
```

```tsx
'use server';

import { updateTag } from 'next/cache';

export async function deleteComment(id: string, eventSlug: string) {
  await db.comment.delete({ where: { id } });
  updateTag(`comments-${eventSlug}`);
}
```

### The Flow

User submits → `useOptimistic` shows instant result → server action runs → `refresh()` or `updateTag()` invalidates → server components re-render → optimistic value settles to real data.

**If you forget the invalidation call:** the optimistic update shows instantly, the mutation succeeds on the server, but the UI never updates with the real data. This is the most common bug when applying the skill.

### Return Errors, Don't Throw

For expected failures (validation, auth), return error info. Unexpected errors should throw and bubble to the nearest `error.tsx` boundary:

```tsx
export async function addComment(slug: string, formData: FormData): Promise<ActionResult> {
  const parsed = schema.safeParse({ content: formData.get('content') });
  if (!parsed.success) return { error: parsed.error.issues[0].message, success: false };

  await db.comment.create({ data: { content: parsed.data.content, eventSlug: slug } });
  updateTag(`comments-${slug}`);
  return { success: true };
}
```

---

## Router Behavior

### Navigation = Transition

The App Router wraps every `<Link>` navigation in `startTransition`. This means:
- Old page stays visible and interactive while the new page loads
- `<Suspense>` boundaries on the destination page resolve independently

### `router.push()` in Transitions

When called inside a `startTransition`, it coordinates with `useOptimistic` in the same transition:

```tsx
startTransition(async () => {
  setOptimisticIndex(newIndex);
  await router.push(newUrl);
});
// Both commit together
```

This is what makes action props work with Next.js navigation — the design component calls `startTransition`, sets optimistic state, and `await`s the `router.push()` passed via the action prop.

---

## Background Polling

For live data (Q&A feeds, collaborative features), use `startTransition` + `router.refresh()` on an interval:

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { startTransition, useEffect } from 'react';

export function usePolling(intervalMs = 5000) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      startTransition(() => router.refresh());
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
}
```

Because the refresh runs inside `startTransition`, it coordinates with `useOptimistic` — a mid-action refresh updates the base data without clobbering optimistic state. If using a reducer, React re-runs it with the latest base value so optimistic additions sit on top of fresh data.

---

## Error Boundaries

Next.js `error.tsx` files create error boundaries. Errors thrown inside transitions — including server action failures — automatically bubble to the nearest `error.tsx`. Use toast for expected errors to prevent the boundary from catching them.
