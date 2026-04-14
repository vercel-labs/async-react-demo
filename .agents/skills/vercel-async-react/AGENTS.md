# Async React

**Version 1.0.0**
Vercel Engineering
April 2026

> **Note:**
> This document is mainly for agents and LLMs to follow when implementing
> async coordination patterns in React applications. Humans may also find it useful,
> but guidance here is optimized for automation and consistency by
> AI-assisted workflows.

---

## Abstract

Guide for implementing async coordination patterns using React's primitives — transitions, useOptimistic, useActionState, Suspense, useDeferredValue, form actions, and the action props pattern. Covers the three async layers (design, router, data), optimistic updates, pending states, loading boundaries, stale-while-revalidate search, and coordination between mutations, navigation, and data loading. Works with any Suspense-enabled data source (server components, useSuspenseQuery, use()). Includes Next.js App Router integration with server actions, updateTag(), router behavior, and background polling.

---

## Table of Contents

1. [Core Reference](#when-to-add-coordination)
   - [When to Add Coordination](#when-to-add-coordination)
   - [Two Migration Paths](#two-migration-paths)
   - [Core Concepts](#core-concepts)
   - [How It All Connects](#how-it-all-connects)
   - [Common Mistakes](#common-mistakes)
2. [Implementation Workflow](#implementation-workflow)
   - [Step 1: Audit the App](#step-1-audit-the-app)
   - [Step 2: Add Suspense Boundaries](#step-2-add-suspense-boundaries)
   - [Step 3: Convert Design Components to Action Props](#step-3-convert-design-components-to-action-props)
   - [Step 4: Fix Legacy State Patterns](#step-4-fix-legacy-state-patterns)
   - [Step 5: Add Optimistic Updates](#step-5-add-optimistic-updates)
   - [Step 6: Add Pending Feedback](#step-6-add-pending-feedback)
   - [Step 7: Verify](#step-7-verify)
3. [Patterns](#async-react-patterns)
   - [Suspense Boundaries](#suspense-boundaries)
   - [Action Props (Design Components)](#action-props-design-components)
   - [Optimistic Mutations](#optimistic-mutations)
   - [Pessimistic Mutations (data-pending)](#pessimistic-mutations-data-pending)
   - [Deferred Values (Stale-While-Revalidate)](#deferred-values-stale-while-revalidate)
   - [Action State (useActionState)](#action-state-useactionstate)
   - [Double-Transition Pattern](#double-transition-pattern)
   - [Coordination](#coordination)
4. [Next.js Integration](#async-react-in-nextjs)
   - [Server Actions + Cache Invalidation](#server-actions--cache-invalidation)
   - [Router Behavior](#router-behavior)
   - [Background Polling](#background-polling)
   - [Error Boundaries](#error-boundaries)

---

Coordinate async UI states using React's built-in primitives. The core idea: wrap async work in **transitions**, and React tracks pending state, batches updates, and coordinates everything — loading, mutations, navigation — through a single pipeline. No competing state layers, no race conditions.

This is the combination of React 18's concurrent features and React 19's coordination APIs. The React team calls this "Async React" — a complete system for building responsive async applications through composable primitives. Based on [Ricky Hanlon's React Conf 2025 demo](https://github.com/rickhanlonii/async-react), the vision is that product code becomes simple and declarative because three infrastructure layers handle async coordination internally:

- **Routing** — The router uses transitions by default, so navigation never freezes the UI.
- **Data fetching** — The data layer uses Suspense by default, so loading states are declarative.
- **Design components** — UI components expose `action` props with built-in `useOptimistic` and delayed loading indicators, so product code just passes callbacks.

On fast networks (<150ms), the app feels synchronous — no visible loading states. On slow networks, loading states appear automatically.

## When to Add Coordination

Every async interaction creates an in-between state. Each has a primitive:

| Priority | Pattern | What it communicates | Primitive |
|----------|---------|---------------------|-----------|
| 1 | **Loading boundaries** | "Data is coming" | `<Suspense>` + skeleton fallback |
| 2 | **Optimistic mutation** | "Done (pending confirmation)" | `useOptimistic` + form `action` |
| 3 | **Action state** | "Submitted (here's the result)" | `useActionState` |
| 4 | **Transition feedback** | "Working on it" | `useTransition` or `useOptimistic(false)` |
| 5 | **Action props** | "Control responded instantly" | Design component with `action` prop |
| 6 | **Stale-while-revalidate** | "Searching (old results visible)" | `useDeferredValue` + Suspense-enabled source |

This is an implementation order, not a "pick one" list. Implement every pattern that fits the app. Only skip a pattern if the app has no use case for it.

### Choosing the Right Pattern

| User Interaction | Pattern | Why |
|-----------------|---------|-----|
| Page load / data fetching | `<Suspense>` with skeleton | Show structure instantly, stream data |
| Toggle (favorite, like) | Form `action` + `useOptimistic` | Instant visual toggle, auto-rollback on failure |
| One-way action (upvote) | Form `action` + `useOptimistic` with reducer | Increment-only, disable after |
| Adding to a list | `useOptimistic` + `crypto.randomUUID()` | Shared ID prevents duplicate flash |
| Move between groups (Kanban, categories) | `useOptimistic` with reducer + `useTransition` | Instant move, auto-revert on failure |
| Destructive action (delete) | `useOptimistic` or `useTransition` + `data-pending` | Optimistic delete with rollback, or pending feedback |
| Form submission (create, edit) | `useActionState` | Server response state, `isPending`, key-based reset |
| Chat / comment input | `useOptimistic` + immediate form clear | Input clears instantly, optimistic list add |
| Tab / filter switch | `action` prop on design component | Instant highlight, old content stays |
| Search / filter with async results | `useDeferredValue` + `useSuspenseQuery` | Stale results stay visible while fresh data loads |

For animations on these state changes, see the `vercel-react-view-transitions` skill.

For framework-specific integration (Next.js server actions, `refresh()`/`updateTag()` invalidation, router behavior, background polling), see the [Next.js Integration](#async-react-in-nextjs) section. **Every server action that mutates data must call `refresh()` or `updateTag()`** — without this, optimistic updates settle to stale data.

---

## Two Migration Paths

The skill handles two kinds of work:

- **Fix legacy patterns** — Replace `useState` + `useEffect` client-side fetching with server data as props + `useOptimistic` + form actions. These are actively broken: mutations and navigation compete because state lives in two places.
- **Add coordination** — Take a working but non-interactive app (no feedback, frozen UI during async work) and add `<Suspense>` boundaries, action props, optimistic updates, and pending indicators.

Most apps have a mix of both. The audit in Step 1 classifies each interaction.

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

**Derived pending from value comparison:** For design components that optimistically update a value, you can derive `isPending` by comparing the optimistic value to the server value instead of using `useTransition`:

```tsx
const [optimisticValue, setOptimisticValue] = useOptimistic(serverValue);
const isPending = optimisticValue !== serverValue;
```

Both approaches are valid — `useTransition` gives you a `startTransition` function, while value comparison is more compact when the component already has `useOptimistic`.

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

`formAction` on a button works the same way — it overrides the form's `action` and auto-wraps in a transition. This is useful for reusable submit button design components: the consumer keeps a plain `<form>`, and the button handles pending state internally via `formAction`:

```tsx
<form>
  <input name="content" required />
  <SubmitButton action={submitAction}>Post</SubmitButton>
</form>

// Inside SubmitButton — formAction handles the transition
<button type="submit" formAction={submitAction} disabled={isPending}>
  {isPending ? 'Posting...' : children}
</button>
```

### Action State

`useActionState` manages state derived from the result of an action — like `useReducer` but the reducer can be async and perform side effects. It gives you `isPending` for free and queues actions sequentially (each receives the previous result):

```tsx
const [state, formAction, isPending] = useActionState(
  async (prev, formData: FormData) => {
    const result = await submitForm(formData);
    if (result.error) return { ...prev, error: result.error };
    return { error: null, key: prev.key + 1 };
  },
  { error: null, key: 0 }
);

<form action={formAction}>
  <input name="title" required />
  {state.error && <p>{state.error}</p>}
  <button disabled={isPending}>{isPending ? 'Saving...' : 'Save'}</button>
</form>
```

**When to use `useActionState` vs other primitives:**

| Need | Use |
|------|-----|
| Server response state (validation errors, success/failure) | `useActionState` |
| Instant visual feedback before server responds | `useOptimistic` |
| Just `isPending` for a one-off action | `useTransition` or `useOptimistic(false)` |
| All of the above | `useActionState` + `useOptimistic` on top |

**Key-based form reset:** Increment a `key` in the returned state on success. Use that key on the form content to remount and reset all internal state — no manual `resetForm()` needed.

**Combining with `useOptimistic`:** `useOptimistic` reads from `useActionState`'s state and shows instant feedback while the action runs:

```tsx
const [state, formAction, isPending] = useActionState(updateAction, initialState);
const [optimisticValue, setOptimistic] = useOptimistic(state.value);
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

Show pending states without making parent components client components. Set `data-pending` on the transitioning element, **and add `has-data-pending:` styles on a parent** that should react. Both parts are required — `data-pending` without a parent reacting to it has no visible effect:

```tsx
<button data-pending={isPending ? '' : undefined}>Delete</button>

// Any ancestor (even a server component) reacts via CSS
<div className="has-data-pending:opacity-50">
  <Card />
</div>
```

For sibling elements, use `group` on a common ancestor:

```tsx
<div className="group">
  <FilterBar />   {/* sets data-pending internally */}
  <div className="group-has-data-pending:opacity-50 transition-opacity">
    <ContentGrid />
  </div>
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

- **Forgetting to invalidate after mutations** — The most common bug. `useOptimistic` shows the instant result, the server action succeeds, but without `refresh()` or `updateTag()` in the server action, the server never re-renders. The optimistic value settles to stale data, and navigating away and back shows old state. Every server action that mutates data must invalidate. See the [Next.js Integration](#async-react-in-nextjs) section.
- **`useState` + `useEffect` for server-derived state** — Creates the coordination problem. Fetch state client-side, manage it locally, and now mutations and navigation don't talk to each other. Fix: server data as props, `useOptimistic` for instant feedback.
- **`onClick` instead of form `action`** — Form actions get transition wrapping for free. Use `<form action={...}>` for mutations.
- **Calling `useOptimistic` setter outside an Action** — The setter must be called inside `startTransition` or a form `action`. Outside, React warns and the optimistic value briefly renders then reverts.
- **Competing data layers** — Don't mix `useOptimistic` with separate `useState` for the same data. One source of truth (server props), one overlay (`useOptimistic`).
- **Wrong boundary structure** — One big `<Suspense>` at the root means nothing renders until everything loads. But blindly splitting into siblings can cause layout shift (CLS) if a component above has unknown height. Choose boundaries based on the loading state you want for the page. Don't try to fix existing skeleton dimensions or CLS in fallbacks — that's a design concern, not an async coordination concern.
- **Using updater instead of reducer when base state can change** — If the base data might change while your Action is pending (e.g., from polling), use a reducer. Updaters only see state from when the Transition started; reducers re-run with the latest base value.
- **Raw `await` on server actions bypasses error boundaries** — Calling `await serverAction()` inside an `onClick` handler is not wrapped in a transition. If the action throws, the error is unhandled — it won't reach `error.tsx`. Wrap in `startTransition` or use a form `action` so errors bubble to the nearest error boundary and `useOptimistic` auto-reverts.
- **Exporting constants from `"use server"` files** — `"use server"` files can only export async functions. Shared constants (cycle maps, enum lists, option arrays) must live in a separate file (e.g., `data.ts`) and be imported by both the server action and the client component.
- **`data-pending` without a parent reacting to it** — Setting `data-pending` on a button does nothing by itself. A parent element must have `has-data-pending:` styles (e.g., `has-data-pending:opacity-50`) to create a visible effect. Always add both parts.
- **Silent optimistic rollback** — `useOptimistic` auto-reverts on failure, but the user sees the UI snap back with no explanation. Pair rollback with user-visible feedback: use `toast.error()` inside a `try/catch` in the transition, or add an `error.tsx` boundary for unexpected failures. The rollback handles the UI; the feedback handles the user.
- **State updates after `await` fall outside the transition** — Inside an async `startTransition`, state updates after an `await` are not part of the transition. This means cleanup like closing a dialog or resetting a form runs immediately instead of being batched with the re-render. Use a double-transition: wrap post-`await` state updates in another `startTransition`:

```tsx
startTransition(async () => {
  addOptimistic(newItem);
  await createItem(newItem);
  startTransition(() => {
    resetForm();
    setIsOpen(false);
  });
});
```

Without the inner `startTransition`, the dialog closes before the board re-renders with fresh data, causing a flash.

---

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
- **Data that updates without user action** — Live feeds, collaborative features. Candidates for background polling (see the [Background Polling](#background-polling) section).

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
6. **Ensure the server action invalidates** — call `refresh()` or `updateTag()` after mutating data. Without this, `useOptimistic` settles but the *next* render still shows stale data.
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

**Critical: the server action must invalidate.** Without `refresh()` or `updateTag()`, the optimistic update shows instantly but the server never re-renders — so navigating away and back shows stale data.

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
When the client needs to predict the server result for an optimistic update (e.g., cycling through enum values: low → medium → high → low), extract the logic into a shared constant or pure function. **Do not put constants in `"use server"` files** — those can only export async functions. Put shared constants in a separate file (e.g., `data.ts`, `constants.ts`) and import from both the server action and the client component:

```tsx
// data.ts (shared — not "use server")
export const PRIORITY_CYCLE: Record<Priority, Priority> = {
  low: 'medium', medium: 'high', high: 'low',
};

// actions.ts ("use server")
import { PRIORITY_CYCLE } from './data';

export async function cyclePriority(id: string) {
  // uses PRIORITY_CYCLE internally
}
```

The client imports `PRIORITY_CYCLE` from `data.ts` to compute the optimistic value without duplicating the logic.

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

### Common Implementation Mistakes

- **Skipping the audit** — Without classifying interactions, you'll miss coordination gaps or apply the wrong pattern.
- **Wrong boundary structure** — Siblings resolve in parallel but can cause CLS if sizes are unknown. A shared boundary avoids layout shift. Choose boundaries based on the loading state you want, not a blanket rule.
- **Using updaters when base state can change** — If polling or other users can change the base data during your Action, use a reducer so React re-runs it with the latest data.
- **Mixing `useState` with `useOptimistic` for the same data** — One source of truth: server props in, `useOptimistic` as overlay.
- **Action props on cross-route navigation** — If the destination has Suspense, the router handles it.

---

# Async React Patterns

Code reference for each primitive. For framework-specific patterns (Next.js server actions, router, background polling), see the [Next.js Integration](#async-react-in-nextjs) section.

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

import { startTransition, useOptimistic } from 'react';

type TabListProps = {
  tabs: { label: string; value: string }[];
  activeTab: string;
  changeAction?: (value: string) => void | Promise<void>;
  onChange?: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

export function TabList({ tabs, activeTab, changeAction, onChange }: TabListProps) {
  const [optimisticTab, setOptimisticTab] = useOptimistic(activeTab);
  const isPending = optimisticTab !== activeTab;

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

### SubmitButton — formAction with Pending Indicator

A reusable submit button that wraps any form's submission in a transition with pending state. Uses `formAction` on the button instead of `action` on the form — this auto-wraps in a transition (like form `action`) and passes `FormData`:

```tsx
'use client';

import { useOptimistic } from 'react';

type SubmitButtonProps = React.ComponentProps<'button'> & {
  action: (formData: FormData) => void | Promise<void>;
  onSubmit?: (formData: FormData) => void;
};

export function SubmitButton({ children, action, onSubmit, disabled, ...props }: SubmitButtonProps) {
  const [isPending, setIsPending] = useOptimistic(false);

  async function submitAction(formData: FormData) {
    onSubmit?.(formData);
    setIsPending(true);
    await action(formData);
  }

  return (
    <button type="submit" formAction={submitAction} disabled={isPending || disabled} {...props}>
      {isPending ? 'Submitting...' : children}
    </button>
  );
}
```

**Why `formAction` on the button instead of `action` on the form:** The consumer keeps a plain `<form>` and drops in `<SubmitButton>` — the button's `formAction` overrides the form's `action`. This makes the design component composable: the consumer controls the form, the button handles pending state. No `startTransition` needed — `formAction` wraps in a transition automatically.

**`onSubmit` callback:** Fires synchronously before the transition starts — useful for immediate side effects like clearing an input or closing a dropdown (same role as `onChange` on action-prop design components).

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

### Move Between Groups (Kanban, Categories)

When items move between groups (columns, categories, status buckets), use a reducer that remaps the item's group field. The optimistic update moves the item instantly; on failure, `useOptimistic` snaps it back:

```tsx
const [optimisticItems, moveItem] = useOptimistic(
  items,
  (state, { id, newStatus }: { id: string; newStatus: Status }) =>
    state.map(item => item.id === id ? { ...item, status: newStatus } : item)
);

function handleMove(id: string, newStatus: Status) {
  startTransition(async () => {
    moveItem({ id, newStatus });
    await updateStatus(id, newStatus);
  });
}
```

This works for drag-and-drop boards, category reassignment, priority changes — any interaction that moves an item between groups. The reducer re-runs with the latest base data if a background refresh arrives mid-action, so the move sits on top of fresh data.

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

### Immediate Form Clearing

For chat/comment UIs, the input should clear immediately when the user submits — not after the server responds. Two approaches:

**Controlled input — save value, clear state, pass saved value:**

```tsx
'use client';

import { useState, useOptimistic, useRef } from 'react';

export function CommentForm({ addAction }: { addAction: (content: string) => Promise<void> }) {
  const [content, setContent] = useState('');
  const [isPending, setIsPending] = useOptimistic(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async () => {
        if (!content.trim()) return;
        setIsPending(true);
        const text = content;
        setContent('');
        await addAction(text);
      }}
    >
      <input value={content} onChange={e => setContent(e.target.value)} disabled={isPending} />
      <button type="submit" disabled={!content.trim() || isPending}>Send</button>
    </form>
  );
}
```

The key: save `content` to a local variable *before* clearing. `setContent('')` runs inside the transition so the input clears optimistically. The saved `text` is passed to the action.

**Uncontrolled input — `formRef.reset()` before await:**

```tsx
async function submitAction(formData: FormData) {
  formRef.current?.reset();
  const result = await addComment(slug, formData);
  if (!result.success) toast.error(result.error);
}

<form ref={formRef}>
  <input name="content" required />
  <SubmitButton action={submitAction}>Post</SubmitButton>
</form>
```

Call `formRef.current?.reset()` at the top of the action — the input clears before the `await`. This works with uncontrolled inputs where you read values from `FormData`. Note: React's automatic form reset after `formAction` completes would also clear the input, but only *after* the action finishes — `formRef.reset()` makes it immediate.

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

### Grouped Pending (data-pending + group)

For sibling elements, use `group` on a common ancestor:

```tsx
<div className="group">
  <FilterBar />   {/* sets data-pending internally */}
  <div className="group-has-data-pending:opacity-50 transition-opacity">
    <ContentGrid />
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

## Action State (useActionState)

### Form with Server Response

`useActionState` manages state derived from an action result. The reducer receives `(prevState, payload)` and returns new state. When passed as a form `action`, the payload is `FormData` and React wraps the submission in a transition automatically:

```tsx
'use client';

import { useActionState, startTransition } from 'react';
import { saveItem } from '@/lib/actions';

export function CreateForm({ onSuccess }: { onSuccess?: () => void }) {
  const [{ error, key }, formAction, isPending] = useActionState(
    async (prev: { error: string | null; key: number }, formData: FormData) => {
      const result = await saveItem(formData);
      if ('error' in result) return { ...prev, error: result.error };
      startTransition(() => onSuccess?.());
      return { error: null, key: prev.key + 1 };
    },
    { error: null, key: 0 }
  );

  return (
    <form action={formAction}>
      <div key={key}>
        <input name="title" required />
        <textarea name="description" />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
```

**Key-based reset:** Incrementing `key` in the returned state remounts form content, resetting all internal state (inputs, `useState` hooks) without a manual `resetForm()`.

**Error handling:** Return expected errors as state and display inline. Throw unexpected errors — `useActionState` rethrows them to the nearest error boundary and cancels all queued actions.

### Combining with useOptimistic

`useOptimistic` reads from `useActionState`'s state for instant feedback:

```tsx
const [state, dispatchAction, isPending] = useActionState(updateAction, { count: 0 });
const [optimisticCount, setOptimisticCount] = useOptimistic(state.count);

function handleAdd() {
  startTransition(() => {
    setOptimisticCount(c => c + 1);
    dispatchAction({ type: 'ADD' });
  });
}
```

### When Not to Use

- If you just need optimistic feedback and don't care about the server response, `useOptimistic` alone is simpler.
- `useActionState` queues actions sequentially — each waits for the previous to complete. For parallel actions, use `useState` + `useTransition` directly.
- If the form has no validation/error state and no need for auto-reset, a plain form `action` with `useOptimistic(false)` for `isPending` is sufficient.

---

## Double-Transition Pattern

State updates after `await` inside an async `startTransition` fall outside the transition scope. This matters when you need to close a dialog, reset a form, or update UI after a mutation completes — those updates run immediately instead of being batched with the re-render from `refresh()`.

```tsx
function CreateDialog({ action }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useOptimistic(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <form action={async (formData) => {
        setIsPending(true);
        await action(formData);
        startTransition(() => {
          setIsOpen(false);
        });
      }}>
        <button type="submit" disabled={isPending}>
          {isPending ? 'Creating...' : 'Create'}
        </button>
      </form>
    </Dialog>
  );
}
```

The outer transition (from `<form action>`) wraps the `await`. The inner `startTransition` batches the dialog close with the re-render triggered by `refresh()` inside the server action. Without it, the dialog closes instantly while the page still shows stale data.

---

## Coordination

### Mutation + Navigation

Toggle a favorite, then switch to a filtered view. Both go through the transition system — `useOptimistic` handles the instant toggle, the tab switch triggers navigation, and React coordinates everything in a single render pass. The optimistic value settles when the server responds.

### Mutation + Background Refresh

A background data refresh arrives mid-action. If using a reducer, React re-runs it with the updated base data — your optimistic addition sits on top of the latest list. When the action completes, the optimistic overlay settles.

---

# Async React in Next.js

How the App Router integrates with React's async coordination primitives. Only Next.js-specific details — for the primitives themselves, see the sections above.

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

## Keeping Pages Non-Async (Static Shell)

To maximize the static shell with `cacheComponents`, pages should be **non-async**. Dynamic data access (`searchParams`, `params`, uncached fetches) must happen inside async server components wrapped in `<Suspense>`.

`searchParams` and `params` are promises in Next.js 16. Pass them as props into async components inside Suspense instead of awaiting them at the page level:

```tsx
// ✅ Non-async page — static shell renders instantly
export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return (
    <div>
      <Header />
      <Suspense fallback={<ResultsSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Results({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const data = await fetchResults(q);
  return <ResultsList data={data} />;
}
```

Client components using `useSearchParams()` are also dynamic — wrap them in `<Suspense>`:

```tsx
<Suspense>
  <FilterBar />  {/* uses useSearchParams() internally */}
</Suspense>
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

---

## When in Doubt

If unsure about the behavior or API of any React primitive (`useOptimistic`, `useActionState`, `useTransition`, `useDeferredValue`, `use`, `Suspense`), consult the official React docs at `https://react.dev/reference/react/<hook-name>` before guessing. These APIs are new and training data may be outdated or incorrect.
