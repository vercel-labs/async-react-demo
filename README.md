# Async React Demo

A Next.js task board demonstrating async React coordination — optimistic updates, transitions, pending feedback, and form state management.

The [`main`](https://github.com/vercel-labs/async-react-demo/tree/main) branch has all async coordination patterns applied; the [`plain`](https://github.com/vercel-labs/async-react-demo/tree/plain) branch is the base app without any coordination.

**[Live Demo](https://async-react-demo.labs.vercel.dev/)**

## App Features

- **Kanban board** — Three-column layout (Todo / In Progress / Done) with drag-and-drop and label filter chips
- **Create task** — Modal dialog with full form (title, description, status, priority, assignee, labels)
- **Task detail page** — Full task view with metadata, inline controls, and comment thread
- **Priority cycling** — Cycle task priority (low → medium → high → low)
- **Assignee reassignment** — Reassign tasks to team members
- **Comments** — Add and delete comments on any task

## Async React Patterns

| Where | What happens | How |
|-------|-------------|-----|
| Task detail page | Page shell paints immediately, sections stream in as data resolves | `<Suspense>` boundaries with promise-passing |
| Drag-and-drop | Card moves to target column instantly, reverts on failure | `useOptimistic` with reducer + `startTransition` |
| Task card controls | Priority updates instantly on click | `useOptimistic` with updater function |
| Label filter | Chip highlights immediately, board dims while filtered data loads | `useTransition` + `data-pending` + action props |
| Create task modal | Button shows "Creating...", dialog closes with fresh board in one step | `useActionState` + key-based form reset + double `startTransition` |
| Comment form | New comment appears immediately while server catches up | Form `action` + `useOptimistic` list add |
| Delete button | Comment card fades to 30% opacity during deletion | `useOptimistic(false)` + `data-pending` CSS |
| Repeat navigation | Cached reads and runtime prefetch make navigations instant | `'use cache'` + `cacheTag` + `updateTag` + `unstable_prefetch` |

See the [Interactive Apps guide](https://nextjs.org/docs/app/guides/interactive-apps) for a step-by-step walkthrough.

## Setup

```bash
pnpm install
pnpm run dev
```

## Tech Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- shadcn/ui
- Geist Sans + Mono fonts
- In-memory data store with simulated delays

## Credits

Based on [Ricky Hanlon's Async React demo](https://github.com/rickhanlonii/async-react) from the [React Conf 2025 talk](https://www.youtube.com/watch?v=TQQPAU21ZUw). See the [Async React Working Group](https://github.com/reactwg/async-react/discussions) for the latest on making Async React the default for React apps.