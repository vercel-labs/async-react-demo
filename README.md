# Async React Demo

A Next.js task board app demonstrating async coordination patterns — optimistic updates, Suspense boundaries, form actions, action props, and pending states. Also serves as a testing ground for the [Async React agent skill](https://github.com/vercel-labs/async-react).

The `[main](#)` branch has all async coordination patterns applied; the `[plain](#)` branch is the base app with legacy patterns and no feedback.

## App Features

- **Kanban board** — Three-column layout (Todo / In Progress / Done) with drag-and-drop and label filter chips
- **Create task** — Modal dialog with full form (title, description, status, priority, assignee, labels)
- **Task detail page** — Full task view with metadata, inline controls, and comment thread
- **Status changes** — Drag-and-drop between columns or change from the detail page (30% random failure rate to demo error handling)
- **Assignee reassignment** — Reassign tasks to team members (Sarah, Marcus, Elena, Jordan)
- **Priority cycling** — Cycle task priority (low → medium → high → low)
- **Comments** — Add and delete comments on any task
- **Label filtering** — Filter board by label via URL search params

## Anti-Patterns (plain branch)


| Where              | What's broken                                                                            | Async React fix                                                                |
| ------------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Board              | No `<Suspense>`, page blocks until all columns load                                      | `<Suspense>` boundaries with skeleton fallbacks                                |
| Drag-and-drop      | `useState` optimistic that never reverts on failure, raw `await` bypasses error boundary | `useOptimistic` (auto-reverts) + `startTransition` (errors bubble to `error.tsx`) |
| Create task modal  | `useEffect` + `fetch` to load form options, `onClick` submit via API route               | Server data as props, form `action` + server action, `useOptimistic` list add  |
| Task card controls | `onClick` → `await` → `setState` for inline priority/assignee, UI freezes                | Form `action` + `useOptimistic`                                                |
| Status select      | `onClick` → `await` → `setState`, UI freezes during update                               | Form `action` + `useOptimistic`                                                |
| Assignee select    | `onClick` → `await` → `setState`, no instant feedback                                    | Form `action` + `useOptimistic`                                                |
| Label filter       | `onChange` → `router.push`, no pending feedback                                          | `action` prop + `data-pending` CSS pattern                                     |
| Priority button    | `onClick` → `await` → `setState`, no instant feedback                                    | Form `action` + `useOptimistic` with reducer                                   |
| Comment form       | `onClick` → `await` → manual refetch                                                     | Form `action` + `useOptimistic` list add                                       |
| Comment list       | `useEffect` + `fetch` + manual state management                                          | Server component with `<Suspense>`                                             |
| Delete button      | `onClick` → `await` → callback, no feedback                                              | `useTransition` + `data-pending`                                               |


## Try It

Install the skill and prompt your agent against the `plain` branch:

```bash
npx skills add https://github.com/vercel-labs/async-react
```

```
Add async coordination to this app using the vercel-async-react skill
```

Output is not deterministic — the agent may not cover every interaction in one pass. Review what it did, then ask for what's missing:

```
The comments still use useEffect for fetching. Convert CommentList to a server component
with Suspense, and add optimistic add/delete.
```

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