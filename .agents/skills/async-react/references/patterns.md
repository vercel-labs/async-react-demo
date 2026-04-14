# Async React Patterns

Code reference for each primitive. See `implementation.md` for the step-by-step workflow. For framework-specific patterns (Next.js server actions, router, background polling), see `nextjs.md`.

---

## Suspense Boundaries

### Basic

```tsx
import { Suspense } from 'react';

export default function Page() {
  return (
    <div>
      <Header />
      <Suspense fallback={<GridSkeleton />}>
        <DataGrid />
      </Suspense>
    </div>
  );
}
```

### Skeleton Co-location

Export skeleton components from the same file as their component:

```tsx
export async function DataGrid() {
  const data = await fetchData();
  return <div className="grid">{data.map(item => <Card key={item.id} item={item} />)}</div>;
}

export function DataGridSkeleton() {
  return (
    <div className="grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-md bg-black/15 dark:bg-white/15 h-32" />
      ))}
    </div>
  );
}
```

### Boundary Structure

Sibling boundaries stream in parallel — each resolves independently:

```tsx
<Suspense fallback={<ProfileSkeleton />}>
  <UserProfile userId={id} />
</Suspense>
<Suspense fallback={<PostsSkeleton />}>
  <UserPosts userId={id} />
</Suspense>
```

Use siblings when components have independent data **and predictable sizes**. If a component above has an unknown height, siblings below it cause layout shift (CLS) when it resolves. In that case, wrap both in a single boundary:

```tsx
<Suspense fallback={<PageSkeleton />}>
  <VariableHeightHeader slug={slug} />
  <ContentFeed slug={slug} />
</Suspense>
```

Choose the boundary structure that produces the best loading state for the page — there's no single rule.

---

## Action Props (Design Components)

### TabList — Full Implementation

Support both `changeAction` and `onChange`. The "Action" suffix signals the callback runs inside a transition. The action prop accepts `void | Promise<void>`, so consumers don't need their own `startTransition`:

```tsx
'use client';

import { useOptimistic, useTransition } from 'react';

type TabListProps = {
  tabs: { label: string; value: string }[];
  activeTab: string;
  changeAction?: (value: string) => void | Promise<void>;
  onChange?: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

export function TabList({ tabs, activeTab, changeAction, onChange }: TabListProps) {
  const [optimisticTab, setOptimisticTab] = useOptimistic(activeTab);
  const [isPending, startTransition] = useTransition();

  function handleTabChange(e: React.MouseEvent<HTMLButtonElement>, value: string) {
    onChange?.(e);
    startTransition(async () => {
      setOptimisticTab(value);
      await changeAction?.(value);
    });
  }

  return (
    <div data-pending={isPending ? '' : undefined}>
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={e => handleTabChange(e, tab.value)}
          className={tab.value === optimisticTab ? 'active' : ''}
        >
          {tab.label}
        </button>
      ))}
      {isPending && <Spinner />}
    </div>
  );
}
```

`onChange` fires synchronously before the transition starts — useful for validation or `event.preventDefault()`. The action prop handles the async coordination.

### Consumer Usage

```tsx
// Before — freezes until navigation completes
<TabList tabs={tabs} activeTab={current} onChange={() => navigate(value)} />

// After — tab highlights instantly, spinner shows during async work
<TabList tabs={tabs} activeTab={current} changeAction={value => navigate(value)} />
```

### Customizing Pending UI (hideSpinner + data-pending)

When the consumer wants custom pending treatment instead of the built-in spinner, they add their own `useTransition` and use `data-pending` for CSS-based feedback:

```tsx
function PostTabs() {
  const [isPending, startTransition] = useTransition();

  return (
    <div data-pending={isPending ? '' : undefined}>
      <TabList
        hideSpinner
        tabs={tabs}
        activeTab={current}
        changeAction={value => {
          startTransition(() => {
            navigate(value);
          });
        }}
      />
    </div>
  );
}
```

The optimistic tab switch still happens inside `TabList`. The consumer's `isPending` drives `data-pending` on a wrapper, and descendants use `group-has-data-pending:` to style themselves.

### EditableText — displayValue Pattern

For components where the display format differs from the raw value, accept a `displayValue` prop as either a static `ReactNode` or a function that receives the optimistic value:

```tsx
type EditableTextProps = {
  value: string;
  displayValue?: ((value: string) => React.ReactNode) | React.ReactNode;
  onChange?: (e: React.SyntheticEvent) => void;
  action: (value: string) => void | Promise<void>;
};

export function EditableText({ value, displayValue, action, onChange }: EditableTextProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticValue, setOptimisticValue] = useOptimistic(value);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function handleCommit(e: React.SyntheticEvent) {
    setIsEditing(false);
    if (draft === optimisticValue) return;
    onChange?.(e);
    startTransition(async () => {
      setOptimisticValue(draft);
      await action(draft);
    });
  }

  const resolvedDisplay = optimisticValue
    ? typeof displayValue === 'function'
      ? displayValue(optimisticValue)
      : (displayValue ?? optimisticValue)
    : null;

  // ... render editing input or display button with resolvedDisplay
}
```

Consumer usage:

```tsx
<EditableText
  value={price}
  action={savePrice}
  displayValue={value => formatCurrency(Number(value))}
/>
```

The formatted display updates instantly on commit because the function receives the optimistic value.

### Pending Indicator with useOptimistic

A design component can use `useOptimistic(false)` to show pending state without `useTransition`:

```tsx
export function SubmitButton({ action, children }) {
  const [isPending, setIsPending] = useOptimistic(false);

  return (
    <button
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          setIsPending(true);
          await action();
        });
      }}
    >
      {isPending ? 'Submitting...' : children}
    </button>
  );
}
```

This pattern automatically shows pending state however the `action` prop is used — state update, navigation, POST, or any combination.

---

## Optimistic Mutations

### Toggle (Boolean)

```tsx
'use client';

import { useOptimistic } from 'react';

export function LikeButton({ isLiked, toggleAction }) {
  const [optimistic, setOptimistic] = useOptimistic(isLiked);

  return (
    <form action={async () => {
      setOptimistic(!optimistic);
      await toggleAction();
    }}>
      <button type="submit">
        {optimistic ? '❤️' : '🤍'}
      </button>
    </form>
  );
}
```

No `startTransition` needed — form `action` already wraps in a transition. The setter is called inside an Action prop.

### Multi-Value (Reducer)

When an optimistic update affects multiple related values, use a reducer:

```tsx
const [optimistic, dispatch] = useOptimistic(
  { isFollowing: user.isFollowing, count: user.followerCount },
  (current, shouldFollow) => ({
    isFollowing: shouldFollow,
    count: current.count + (shouldFollow ? 1 : -1),
  })
);

function handleClick() {
  startTransition(async () => {
    dispatch(!optimistic.isFollowing);
    await followAction(!optimistic.isFollowing);
  });
}
```

### One-Way (Counter)

```tsx
const [optimistic, setOptimistic] = useOptimistic(
  { count: voteCount, hasVoted },
  (state) => ({ count: state.count + 1, hasVoted: true })
);

<form action={async () => {
  setOptimistic(null);
  await upvote(id);
}}>
  <button disabled={optimistic.hasVoted}>👍 {optimistic.count}</button>
</form>
```

### Optimistic Delete (with Error Recovery)

You can use `useOptimistic` for destructive actions too. On failure, the item reappears automatically:

```tsx
const [optimisticItems, removeItem] = useOptimistic(
  items,
  (currentItems, idToRemove) =>
    currentItems.map(item =>
      item.id === idToRemove ? { ...item, deleting: true } : item
    )
);

function handleDelete(id) {
  startTransition(async () => {
    removeItem(id);
    try {
      await deleteAction(id);
    } catch (e) {
      toast.error(e.message);
    }
  });
}
```

Style deleted items with reduced opacity. If the action fails, `useOptimistic` reverts and the item reappears.

### List Add (UUID Dedup)

```tsx
const [optimisticItems, addOptimistic] = useOptimistic(
  items,
  (state, newItem: Item) => {
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

Pass the client-generated ID to the server action so the optimistic item and real response share the same key. Use a reducer (not an updater) so that if the base list changes during the Action (e.g., from polling), React re-runs the reducer with the latest data.

---

## Pessimistic Mutations (data-pending)

When you don't want to show the result optimistically but still need feedback:

```tsx
'use client';

import { useTransition } from 'react';

export function DeleteButton({ id, deleteAction }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      data-pending={isPending ? '' : undefined}
      disabled={isPending}
      onClick={() => startTransition(async () => await deleteAction(id))}
    >
      Delete
    </button>
  );
}
```

Parent (can be a server component):

```tsx
<div className="has-data-pending:opacity-50 transition-opacity">
  <CardContent />
  <DeleteButton id={item.id} deleteAction={deleteItem} />
</div>
```

CSS `:has([data-pending])` bubbles the pending state up without the parent needing to be a client component.

### Grouped Pending (data-pending + group)

For design components that affect a larger region:

```tsx
<div className="group" data-pending={isPending ? '' : undefined}>
  <div className="group-has-data-pending:opacity-50">
    <Grid />
  </div>
</div>
```

---

## Deferred Values (Stale-While-Revalidate)

### Async Search with useSuspenseQuery

Extract data fetching into a separate component that uses a Suspense-enabled data source. Use `useDeferredValue` so old results stay visible while fresh data loads:

```tsx
import { useState, useDeferredValue, Suspense } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

export function SearchCombobox({ asyncSearchFn, onSelect, placeholder = 'Search...' }) {
  const [filterText, setFilterText] = useState('');
  const deferredFilterText = useDeferredValue(filterText);
  const isStale = filterText !== deferredFilterText;

  return (
    <div>
      <input
        placeholder={placeholder}
        value={filterText}
        onChange={e => setFilterText(e.target.value)}
      />
      {deferredFilterText.length >= 2 && (
        <ErrorBoundary fallback={<div>Error loading results</div>}>
          <Suspense fallback={<div>Loading results...</div>}>
            <div className={isStale ? 'animate-pulse' : ''}>
              <SearchResults
                query={deferredFilterText}
                asyncSearchFn={asyncSearchFn}
                onItemClick={onSelect}
              />
            </div>
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  );
}

function SearchResults({ query, asyncSearchFn, onItemClick }) {
  const { data: results } = useSuspenseQuery({
    queryKey: ['search', query],
    queryFn: () => asyncSearchFn(query),
  });

  if (!results?.length) return <span>No results found</span>;

  return results.map(item => (
    <div key={item.id} onClick={() => onItemClick(item)}>
      {item.name}
    </div>
  ));
}
```

How it works:
- The input stays responsive — `filterText` updates immediately on every keystroke.
- `deferredFilterText` lags behind, so `SearchResults` keeps showing stale results while `useSuspenseQuery` fetches fresh data.
- `isStale` (comparing the two values) drives a visual indicator on the stale content.
- On first load, the `<Suspense>` fallback shows. On subsequent changes, old results stay visible.
- `useSuspenseQuery` provides built-in caching — repeated queries show instant cache hits.

This pattern works with any Suspense-enabled data source, not just TanStack Query.

---

## Coordination

### Mutation + Navigation

Toggle a favorite, then switch to a filtered view. Both go through the transition system — `useOptimistic` handles the instant toggle, the tab switch triggers navigation, and React coordinates everything in a single render pass. The optimistic value settles when the server responds.

### Mutation + Background Refresh

A background data refresh arrives mid-action. If using a reducer, React re-runs it with the updated base data — your optimistic addition sits on top of the latest list. When the action completes, the optimistic overlay settles.
