# Implementation Workflow

Follow these steps in order when adding async coordination to an app. Each step builds on the previous one.

There are two kinds of work:

- **Fix legacy patterns** — Replace `useState` + `useEffect` client-side fetching, `onClick` handlers, and competing state layers with server data + `useOptimistic` + form actions. These are actively broken — mutations and navigation don't coordinate.
- **Add coordination** — Take a working but non-interactive app (no feedback, no loading states, frozen UI during async work) and add transitions, optimistic updates, pending indicators, and Suspense boundaries.

The audit identifies both. Steps 2–3 are "add coordination." Step 4 is "fix legacy." Steps 5–6 are "add coordination." Most apps have a mix.

## Step 1: Audit the App

Before writing any code, scan the codebase and classify every async interaction.

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
3. Pass the data from a server component as a prop
4. Add `useOptimistic` for instant feedback on mutations
5. Use form `action` instead of `onClick`

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
- `useOptimistic` rolls back automatically on failure. Add a toast for user feedback.
- For list adds, generate a UUID on the client and pass it to the server to prevent duplicate flash.
- Dedup in the reducer when using background polling.

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
- Do mutations survive navigation? (Toggle, then switch tabs — no stale data)
- Does background refresh coordinate with user actions? (Action mid-poll — no clobber)
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
