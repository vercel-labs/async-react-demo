# Implementation Workflow

Follow these steps in order when adding async coordination to an app. Each step builds on the previous one.

There are two kinds of work:

- **Fix legacy patterns** — Replace `useState` + `useEffect` client-side fetching, `onClick` handlers, and competing state layers with server data + `useOptimistic` + form actions. These are actively broken — mutations and navigation don't coordinate.
- **Add coordination** — Take a working but non-interactive app (no feedback, no loading states, frozen UI during async work) and add transitions, optimistic updates, pending indicators, and Suspense boundaries.

The audit identifies both. Steps 2–3 are "add coordination." Step 4 is "fix legacy." Steps 5–6 are "add coordination." Most apps have a mix.

## Step 1: Audit the App

Before writing any code, scan the codebase and classify every async interaction.

**Quick scan — run these searches to find candidates:**

```
grep -r "useState.*useEffect" --include="*.tsx"   # Legacy fetch patterns
grep -r "onClick.*await" --include="*.tsx"         # Async onClick handlers → form actions
grep -r "router\.refresh" --include="*.tsx"        # Client-side invalidation → move server-side
grep -r "/api/" --include="*.tsx"                  # API routes that might be unnecessary
grep -r "onChange" --include="*.tsx"                # Design components missing action props
grep -r "window\.location" --include="*.tsx"       # Hard refreshes → router.refresh or refresh()
```

**Look for legacy patterns to fix:**

- **Every `useState` + `useEffect` pair** — Client-side data fetching that should be server data passed as props. This is the #1 source of coordination bugs: mutations and navigation don't talk to each other because state lives in two places.
- **Every `onClick` that calls an async function** — Should be a form `action` (gets transition wrapping for free) or wrapped in `startTransition`.
- **Every API route created just for client-side fetching** — Often a sign of the `useEffect` anti-pattern. The data should come from the server component and flow as props.

**Look for missing coordination:**

- **Every async component** — Any component with `await`. Candidates for `<Suspense>` boundaries.
- **Every `<Suspense>` boundary** — Check if fallbacks match the content layout. Missing or spinner-only fallbacks cause layout shift.
- **Every mutation** — Form submissions, button clicks that call server actions. Classify each: does the user expect instant feedback (optimistic), or is confirmation important (pessimistic)?
- **Every navigation trigger** — Check if the control provides instant visual feedback (tab highlight, filter selection).
- **Every design component** (tabs, chips, toggles) — Check if they support an `action` prop. If they have `onChange` but not `action`, they're candidates.
- **Data that updates without user action** — Live feeds, collaborative features. Candidates for background polling (see `nextjs.md`).

Then produce an interaction map:

```
| Component      | Interaction     | Current Behavior       | Category     | Pattern              |
|----------------|-----------------|------------------------|--------------|----------------------|
| DataGrid       | Page load       | Global spinner         | Add coord.   | Suspense + skeleton  |
| LikeButton     | Toggle          | useEffect + useState   | Fix legacy   | useOptimistic + form |
| DeleteButton   | Destructive     | No feedback            | Add coord.   | useOptimistic or useTransition |
| TabNav         | Tab switch      | onChange (freezes)      | Add coord.   | action prop          |
| VoteButton     | One-way vote    | onSubmit (freezes)     | Add coord.   | useOptimistic + form |
```

## Step 2: Add Suspense Boundaries

For every async component, decide: should this block the page, or stream in?

```tsx
<Suspense fallback={<GridSkeleton />}>
  <DataGrid />
</Suspense>
```

**Rules:**

- Push dynamic data access deep in the component tree. Keep pages non-async when possible.
- Co-locate skeletons with their components — export both from the same file.
- Skeleton fallbacks must match the content layout (same heights, same grid). Otherwise you get CLS.
- Sibling `<Suspense>` boundaries resolve independently and stream in parallel. Use siblings when components have independent data and predictable sizes.
- If a component above has an unknown height, sibling boundaries below it will cause layout shift (CLS) when it resolves. In that case, wrap both in a single boundary so the entire region appears at once. Choose the boundary structure that produces the best loading state for the page.

## Step 3: Convert Design Components to Action Props

For every design component that uses `onChange` and triggers a navigation or state update:

1. Check if the component already supports `action` internally (many do)
2. If yes, just change the consumer: `onChange={handler}` → `action={handler}`
3. If no, add the pattern inside the component:

```tsx
function TabNav({ tabs, activeIndex, action, onChange }) {
  const [optimisticIndex, setOptimisticIndex] = useOptimistic(activeIndex);
  const [isPending, startTransition] = useTransition();

  function handleClick(value, index) {
    if (action) {
      startTransition(async () => {
        setOptimisticIndex(index);
        await action(value);
      });
    } else {
      onChange?.(value);
    }
  }
}
```

**Rules:**

- Support both `action` and `onChange` for backward compatibility.
- Set `data-pending` on the component root so consumers can style pending states via CSS.
- By convention, name callback props with "Action" to signal they'll run inside a transition — this tells consumers they can call `useOptimistic` setters inside them.
- Action props aren't needed when the destination has `<Suspense>` boundaries — the router handles that. Action props are for instant feedback on the control itself.

## Step 4: Fix Legacy State Patterns

For every `useState` + `useEffect` pair that fetches server-derived data:

1. Delete the API endpoint (if created just for this)
2. Delete the `useEffect` fetch and local `useState`
3. Pass the data from a server component as a prop — **but first check if the data is actually server-only.** Constants (enums, option lists, static arrays) can often be imported directly in client components. Don't add server component props for data that's just a constant in a shared file.
4. Add `useOptimistic` for instant feedback on mutations
5. Use form `action` instead of `onClick`
6. **Ensure the server action invalidates** — call `refresh()` or `updateTag()` after mutating data (see `nextjs.md`). Without this, `useOptimistic` settles but the *next* render still shows stale data.
7. **Remove `key` props used to force remounts on data changes** — When migrating from `useState(initialValue)` to `useOptimistic(serverValue)`, remove any `key` prop used to reset state when props change. `useOptimistic` tracks the base value automatically; `key`-based remounting is only needed for `useState`.

**Before (broken coordination):**
```tsx
const [isFavorited, setIsFavorited] = useState(false);
useEffect(() => {
  fetch(`/api/favorites/${id}`).then(r => r.json()).then(d => setIsFavorited(d.value));
}, [id]);

async function handleClick() {
  setIsFavorited(!isFavorited);
  await toggleFavorite(id);
}
```

Problems: values flash stale after navigation, mutations and tab switches don't coordinate, initial render shows wrong state.

**After (coordinated):**
```tsx
const [optimistic, setOptimistic] = useOptimistic(hasFavorited); // prop from server

<form action={async () => {
  setOptimistic(!optimistic);
  await toggleFavorite(id);
}}>
```

Server component passes `hasFavorited` as a prop. `useOptimistic` provides instant toggle. Form action wraps in a transition. Mutations and navigation now coordinate through the same system.

**Critical: the server action must invalidate.** Without `refresh()` or `updateTag()`, the optimistic update shows instantly but the server never re-renders — so navigating away and back shows stale data. See `nextjs.md` for the invalidation patterns.

## Step 5: Add Optimistic Updates

For every mutation where the user expects instant feedback:

### Toggle
```tsx
const [optimistic, setOptimistic] = useOptimistic(serverValue);

<form action={async () => {
  setOptimistic(!optimistic);
  await toggleAction(id);
}}>
```

### Multi-value (use a reducer)
```tsx
const [optimistic, dispatch] = useOptimistic(
  { isFollowing, followerCount },
  (current, shouldFollow) => ({
    isFollowing: shouldFollow,
    followerCount: current.followerCount + (shouldFollow ? 1 : -1),
  })
);
```

### One-way
```tsx
const [optimistic, setOptimistic] = useOptimistic(
  { count: voteCount, hasVoted },
  (state) => ({ count: state.count + 1, hasVoted: true })
);
```

### List add
```tsx
const [optimisticItems, addOptimistic] = useOptimistic(
  items,
  (state, newItem) => {
    if (state.some(i => i.id === newItem.id)) return state;
    return [...state, { ...newItem, pending: true }];
  }
);

async function submitAction(formData: FormData) {
  const id = crypto.randomUUID();
  addOptimistic({ id, text: formData.get('text') });
  const result = await createItem(id, formData);
  if (result.error) toast.error(result.error);
}
```

### Move between groups
```tsx
const [optimisticItems, moveItem] = useOptimistic(
  items,
  (state, { id, newGroup }) =>
    state.map(item => item.id === id ? { ...item, group: newGroup } : item)
);

function handleMove(id, newGroup) {
  startTransition(async () => {
    moveItem({ id, newGroup });
    await updateGroup(id, newGroup);
  });
}
```

### Optimistic delete
```tsx
const [optimisticItems, removeItem] = useOptimistic(
  items,
  (currentItems, idToRemove) =>
    currentItems.map(item =>
      item.id === idToRemove ? { ...item, deleting: true } : item
    )
);
```

**Rules:**
- The setter must be called inside an Action (`startTransition` or form `action`). Inside an Action prop, call it directly.
- Use reducers (not updaters) when the base state might change during the Action — reducers re-run with the latest base value.
- `useOptimistic` rolls back automatically on failure. Pair rollback with user-visible feedback — a toast or inline error message — so the user understands why the UI reverted. Silent rollback with no feedback is confusing.
- For list adds, generate a UUID on the client and pass it to the server to prevent duplicate flash.
- Dedup in the reducer when using background polling.
- **Every server action that mutates data must invalidate** — call `refresh()` or `updateTag()` so server components re-render with fresh data. Optimistic updates are an overlay; without invalidation, the base data never updates.

### Shared mutation logic
When the client needs to predict the server result for an optimistic update (e.g., cycling through enum values: low → medium → high → low), extract the logic into a shared constant or pure function. Server actions can export non-async values alongside async functions:

```tsx
// actions.ts
export const PRIORITY_CYCLE: Record<Priority, Priority> = {
  low: 'medium', medium: 'high', high: 'low',
};

export async function cyclePriority(id: string) {
  'use server';
  // uses PRIORITY_CYCLE internally
}
```

The client imports `PRIORITY_CYCLE` to compute the optimistic value without duplicating the logic.

### Complex forms with controlled state
For modals or forms with many fields (multi-select, radio groups, dependent selects), keep `useState` for the UI controls. Wrap the submission in a `<form action>` that reads from the controlled state directly — form actions accept closures, not just `FormData`:

```tsx
const [labels, setLabels] = useState<string[]>([]);
const [priority, setPriority] = useState('medium');

<form action={async () => {
  addOptimistic({ labels, priority, ... });
  await createItem({ labels, priority, ... });
}}>
  {/* controlled inputs for complex UI */}
  <button type="submit">Create</button>
</form>
```

This is not a `useState` anti-pattern — controlled state for complex UI is fine. The anti-pattern is using `useState` for **server-derived data** or **mutation results**.

### Post-await state updates (double-transition)

State updates after `await` inside an async `startTransition` fall outside the transition scope. If you close a dialog or reset a form after awaiting a server action, those updates run immediately — before `refresh()` re-renders the page with fresh data.

Wrap post-`await` state updates in another `startTransition`:

```tsx
<form action={async () => {
  addOptimistic(newItem);
  await createItem(newItem);
  // Inner transition batches dialog close with the re-render
  startTransition(() => {
    resetForm();
    setIsOpen(false);
  });
}}>
```

Without the inner `startTransition`, the dialog closes while the page still shows stale data, causing a visual flash.

## Step 6: Add Pending Feedback

For interactions where you want to show "working" without optimistic results, use `useTransition` + `data-pending`:

```tsx
const [isPending, startTransition] = useTransition();

<button
  data-pending={isPending ? '' : undefined}
  disabled={isPending}
  onClick={() => startTransition(async () => await deleteAction(id))}
>
```

Parent (can be a server component):
```tsx
<div className="has-data-pending:opacity-50 transition-opacity">
  <Card />
</div>
```

**Rules:**
- `data-pending` + CSS `:has()` bubbles pending state up without client component wrappers.
- For grouped regions, use `group-has-data-pending:opacity-50`.

## Step 7: Verify

Walk through every row in the interaction map from Step 1:

- Does loading avoid layout shift? (Skeleton matches content)
- Does the mutation provide feedback? (Optimistic or pending indicator)
- Does navigation feel responsive? (Controls highlight immediately)
- Do mutations persist after navigation? (Mutate, navigate away, navigate back — fresh data shows)
- Do mutations survive navigation? (Toggle, then switch tabs — no stale data)
- Does background refresh coordinate with user actions? (Action mid-poll — no clobber)
- Does every server action call `refresh()` or `updateTag()`? (Without this, optimistic updates settle but server data is stale)
- Do errors surface correctly? (Unexpected → error boundary, expected → toast)

---

## Common Mistakes

- **Skipping the audit** — Without classifying interactions, you'll miss coordination gaps or apply the wrong pattern.
- **Wrong boundary structure** — Siblings resolve in parallel but can cause CLS if sizes are unknown. A shared boundary avoids layout shift. Choose boundaries based on the loading state you want, not a blanket rule.
- **Using updaters when base state can change** — If polling or other users can change the base data during your Action, use a reducer so React re-runs it with the latest data.
- **Mixing `useState` with `useOptimistic` for the same data** — One source of truth: server props in, `useOptimistic` as overlay.
- **Action props on cross-route navigation** — If the destination has Suspense, the router handles it.

---

For framework-specific steps (Next.js server actions, `updateTag()`, router behavior, background polling), see `nextjs.md`.
