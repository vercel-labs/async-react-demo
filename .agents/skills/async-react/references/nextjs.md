# Async React in Next.js

How the App Router integrates with React's async coordination primitives. Only Next.js-specific details — for the primitives themselves, see `SKILL.md` and `patterns.md`.

---

## Server Actions + Cache Invalidation

Server actions are the mutation layer. They run on the server and integrate with the transition system via form `action` or `startTransition` on the client.

After mutating data, invalidate the cache so server components re-render with fresh data. Use `updateTag()` to mark cached entries as stale:

```tsx
'use server';

import { updateTag } from 'next/cache';

export async function deleteComment(id: string, eventSlug: string) {
  await db.comment.delete({ where: { id } });
  updateTag(`comments-${eventSlug}`);
}
```

### The Flow

User submits → `useOptimistic` shows instant result → server action runs → `updateTag()` invalidates cache → server components re-render → optimistic value settles to real data.

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
