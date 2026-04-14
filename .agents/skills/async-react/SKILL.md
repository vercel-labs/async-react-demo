---
name: async-react
description: Guide for implementing async coordination patterns using React's primitives — transitions, useOptimistic, Suspense, useDeferredValue, action props, and form actions. Use this skill when the user wants to add optimistic updates, pending states, loading boundaries, action props on design components, form actions, stale-while-revalidate search, or coordinate mutations with navigation. Also use when the user mentions useOptimistic, useTransition, startTransition, useDeferredValue, useSuspenseQuery, action prop, data-pending, optimistic UI, or asks about handling async in-between states in React.
license: MIT
metadata:
  author: vercel
  version: '1.0.0'
---

# Async React

Coordinate async UI states using React's built-in primitives. The core idea: wrap async work in **transitions**, and React tracks pending state, batches updates, and coordinates everything — loading, mutations, navigation — through a single pipeline. No competing state layers, no race conditions.

This is the combination of React 18's concurrent features and React 19's coordination APIs. The React team calls this "Async React" — a complete system for building responsive async applications through composable primitives. It spans three layers: **async data** (Suspense, server components), **async router** (transitions on navigation), and **async design** (action props on UI components).

## When to Add Coordination

Every async interaction creates an in-between state. Each has a primitive:

| Priority | Pattern | What it communicates | Primitive |
|----------|---------|---------------------|-----------|
| 1 | **Loading boundaries** | "Data is coming" | `<Suspense>` + skeleton fallback |
| 2 | **Optimistic mutation** | "Done (pending confirmation)" | `useOptimistic` + form `action` |
| 3 | **Transition feedback** | "Working on it" | `useTransition` or `useOptimistic(false)` |
| 4 | **Action props** | "Control responded instantly" | Design component with `action` prop |
| 5 | **Stale-while-revalidate** | "Searching (old results visible)" | `useDeferredValue` + Suspense-enabled source |

This is an implementation order, not a "pick one" list. Implement every pattern that fits the app. Only skip a pattern if the app has no use case for it.

### Choosing the Right Pattern

| User Interaction | Pattern | Why |
|-----------------|---------|-----|
| Page load / data fetching | `<Suspense>` with skeleton | Show structure instantly, stream data |
| Toggle (favorite, like) | Form `action` + `useOptimistic` | Instant visual toggle, auto-rollback on failure |
| One-way action (upvote) | Form `action` + `useOptimistic` with reducer | Increment-only, disable after |
| Adding to a list | `useOptimistic` + `crypto.randomUUID()` | Shared ID prevents duplicate flash |
| Destructive action (delete) | `useOptimistic` or `useTransition` + `data-pending` | Optimistic delete with rollback, or pending feedback |
| Tab / filter switch | `action` prop on design component | Instant highlight, old content stays |
| Search / filter with async results | `useDeferredValue` + `useSuspenseQuery` | Stale results stay visible while fresh data loads |

For animations on these state changes, see the `vercel-react-view-transitions` skill.

For framework-specific integration (Next.js server actions, `updateTag()`, router behavior, background polling), see `references/nextjs.md`.

---

## Two Migration Paths

The skill handles two kinds of work:

- **Fix legacy patterns** — Replace `useState` + `useEffect` client-side fetching with server data as props + `useOptimistic` + form actions. These are actively broken: mutations and navigation compete because state lives in two places.
- **Add coordination** — Take a working but non-interactive app (no feedback, frozen UI during async work) and add `<Suspense>` boundaries, action props, optimistic updates, and pending indicators.

Most apps have a mix of both. The audit in Step 1 classifies each interaction.

## Implementation Workflow

When adding async coordination to an existing app, **follow `references/implementation.md` step by step.** Start with the audit — do not skip it.

---

## Core Concepts

### Transitions (Actions)

Any function run inside `startTransition` is called an **Action**. React tracks `isPending` automatically. By convention, callbacks called inside `startTransition` are named with "Action" (e.g., `submitAction`, `deleteAction`).

```tsx
const [isPending, startTransition] = useTransition();

function deleteAction() {
  startTransition(async () => {
    await deleteItem(id);
  });
}
```

The transition keeps the current UI visible and interactive until the action completes. Multiple updates inside a transition commit together — no intermediate flickers. Errors thrown inside transitions bubble to error boundaries.

### Optimistic Updates

`useOptimistic` shows instant updates while an Action runs in the background. Unlike `useState` (which defers updates inside transitions), `useOptimistic` updates **immediately**. The optimistic value persists while the Action is pending, then settles to the source of truth (props or state) when the transition completes. On failure, it automatically reverts.

```tsx
const [optimisticValue, setOptimistic] = useOptimistic(serverValue);

<form action={async () => {
  setOptimistic(newValue);
  await mutate();
}}>
```

The setter must be called inside an Action (`startTransition` or form `action`). When inside an Action prop, you can call it directly — the parent already wraps in `startTransition`. If called outside an Action, React will warn and the optimistic state will briefly render then revert.

The reducer form handles complex state (increment, add to list, multi-field updates):

```tsx
const [optimisticState, dispatch] = useOptimistic(
  { count, isFollowing },
  (current, action) => ({
    count: current.count + (action ? 1 : -1),
    isFollowing: action,
  })
);
```

Reducers are essential when the base state might change while your Action is pending (e.g., from polling). React re-runs the reducer with the updated base value to recalculate what to show.

`useOptimistic` can also be used as a **pending indicator** — `useOptimistic(false)` lets a design component show "Submitting..." without needing `useTransition`:

```tsx
const [isPending, setIsPending] = useOptimistic(false);

<button onClick={() => {
  startTransition(async () => {
    setIsPending(true);
    await action();
  });
}}>
  {isPending ? 'Submitting...' : 'Submit'}
</button>
```

### Suspense Boundaries

Declarative loading boundaries. Place them around any component that uses a **Suspense-enabled data source** — async server components, `useSuspenseQuery` (TanStack Query), `use()` with promises, or `lazy()`. Each boundary resolves independently.

```tsx
<Suspense fallback={<Skeleton />}>
  <AsyncContent />
</Suspense>
```

Push data access deep in the component tree. The static shell renders instantly; dynamic parts stream in. Co-locate skeletons with their components — export both from the same file.

Transitions interact with Suspense: when you trigger an update inside `startTransition` that causes a component to suspend, the old content stays visible instead of showing the fallback again. This is what makes tab switches and navigation feel smooth.

### Deferred Values (Stale-While-Revalidate)

`useDeferredValue` defers re-rendering for a value, keeping old content visible while fresh data loads. Combined with a Suspense-enabled data source, it creates a stale-while-revalidate pattern:

```tsx
const [filterText, setFilterText] = useState('');
const deferredFilter = useDeferredValue(filterText);
const isStale = filterText !== deferredFilter;

<input value={filterText} onChange={e => setFilterText(e.target.value)} />
<div className={isStale ? 'animate-pulse' : ''}>
  <Suspense fallback={<Spinner />}>
    <SearchResults query={deferredFilter} />
  </Suspense>
</div>
```

The input stays responsive. `SearchResults` keeps showing stale results (with a visual indicator) while `useSuspenseQuery` fetches fresh data for the deferred value. On first load, the `<Suspense>` fallback shows; on subsequent changes, old results stay visible. This works with any Suspense-enabled data source — server components, TanStack Query, or `use()` with a cached promise.

### Form Actions

A form's `action` prop wraps the callback in a transition automatically — same coordination as `startTransition`, but declarative. Prefer form actions over `onClick` for mutations:

```tsx
<form action={async (formData) => {
  setOptimistic(newValue);
  await serverAction(formData);
}}>
  <button type="submit">Submit</button>
</form>
```

### Action Props Pattern

Design components (tabs, chips, selects, inline editors, toggles) expose an `action` or `changeAction` prop. Internally, the component wraps the callback in `startTransition` with `useOptimistic`. Consumers just swap one prop name — the component handles async coordination:

```tsx
// Consumer — one prop change: onChange → changeAction
<TabList tabs={tabs} activeTab={current} changeAction={value => navigate(value)} />

// Inside the design component
function TabList({ tabs, activeTab, changeAction }) {
  const [optimisticTab, setOptimisticTab] = useOptimistic(activeTab);
  const [isPending, startTransition] = useTransition();

  function handleTabChange(value) {
    startTransition(async () => {
      setOptimisticTab(value);
      await changeAction(value);
    });
  }
}
```

This pattern belongs in the design layer — custom components, component libraries, design systems. The naming convention matters: **suffixing with "Action"** (e.g., `changeAction`, `submitAction`, `setValueAction`) signals the callback will run inside a transition and that `useOptimistic` setters can be called inside it. The action prop accepts both sync and async functions (`void | Promise<void>`), so consumers don't need their own `startTransition` wrapper.

**`onChange` alongside action props:** Design components should support both. `onChange` fires synchronously before the transition starts — useful for validation, `event.preventDefault()`, or other synchronous side effects. The action prop handles the async coordination.

**Customizing pending UI:** Design components can include a built-in spinner by default. For cases where the consumer needs custom pending treatment, the component can accept a `hideSpinner` prop. The consumer then adds their own `useTransition` and uses `data-pending` for CSS-based feedback on surrounding content.

**`displayValue` for formatted optimistic state:** When the displayed format differs from the raw value (e.g., currency formatting), accept a `displayValue` prop that can be either a static `ReactNode` or a function `(value) => ReactNode`. The function form receives the optimistic value, so the formatted display updates instantly on commit.

**When action props aren't needed:** If the navigation target has `<Suspense>` boundaries, the framework's router already keeps the old page visible. Action props are for instant visual feedback *on the control itself* (tab highlight, pill selection).

### The `data-pending` CSS Pattern

Show pending states without making parent components client components. Set `data-pending` on the transitioning element, style ancestors with CSS `:has()`:

```tsx
<button data-pending={isPending ? '' : undefined}>Delete</button>

// Any ancestor (even a server component) reacts via CSS
<div className="has-data-pending:opacity-50">
  <Card />
</div>
```

For grouped pending states, use Tailwind's `group` variant:

```tsx
<div className="group" data-pending={isPending ? '' : undefined}>
  <div className="group-has-data-pending:opacity-50">{children}</div>
</div>
```

---

## How It All Connects

Transitions create a shared coordination pipeline. Every async operation — navigation, mutations, data fetching — goes through `startTransition`. This means:

- **Navigation + Mutations**: Optimistic updates survive tab switches. The optimistic value persists while the framework fetches new data for the destination.
- **Mutations + Background Refresh**: A background data refresh arriving mid-action doesn't clobber your optimistic state. When the action completes, `useOptimistic` settles to the latest value.
- **Suspense + Navigation**: Navigation wrapped in a transition keeps the old page visible while Suspense boundaries on the new page resolve independently.

No competing data layers. Everything goes through React.

---

## Common Mistakes

- **`useState` + `useEffect` for server-derived state** — Creates the coordination problem. Fetch state client-side, manage it locally, and now mutations and navigation don't talk to each other. Fix: server data as props, `useOptimistic` for instant feedback.
- **`onClick` instead of form `action`** — Form actions get transition wrapping for free. Use `<form action={...}>` for mutations.
- **Calling `useOptimistic` setter outside an Action** — The setter must be called inside `startTransition` or a form `action`. Outside, React warns and the optimistic value briefly renders then reverts.
- **Competing data layers** — Don't mix `useOptimistic` with separate `useState` for the same data. One source of truth (server props), one overlay (`useOptimistic`).
- **Wrong boundary structure** — One big `<Suspense>` at the root means nothing renders until everything loads. But blindly splitting into siblings can cause layout shift (CLS) if a component above has unknown height. Choose boundaries based on the loading state you want for the page.
- **Using updater instead of reducer when base state can change** — If the base data might change while your Action is pending (e.g., from polling), use a reducer. Updaters only see state from when the Transition started; reducers re-run with the latest base value.

---

## Reference Files

- **`references/implementation.md`** — Step-by-step audit and implementation workflow. Start here.
- **`references/patterns.md`** — Detailed code patterns for each primitive.
- **`references/nextjs.md`** — Next.js App Router integration: server actions, `updateTag()`, router behavior, background polling, error boundaries.

## Full Compiled Document

For the complete guide with all reference files expanded: `AGENTS.md`
