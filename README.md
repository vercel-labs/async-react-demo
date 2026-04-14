# Async React Demo

A Vercel-style task board app built with **intentionally broken patterns** — designed as the "before" app for the [async-react skill](https://github.com/aurorascharff/next16-miami-guide/.agents/skills/async-react).

## Anti-Patterns Present

| Feature | Broken Pattern | Async React Fix |
|---------|---------------|-----------------|
| **StarButton** | `useState` + `useEffect` fetching `/api/stars/[id]` | Server data as props + `useOptimistic` + form `action` |
| **StatusTabs** | `onChange` → `router.push`, UI freezes | `changeAction` prop with `useOptimistic` + `useTransition` |
| **LabelFilter** | `onChange` → `router.push`, no pending feedback | `action` prop + `data-pending` CSS pattern |
| **TaskGrid** | No `<Suspense>`, page blocks on data load | `<Suspense>` boundaries with skeleton fallbacks |
| **VoteButton** | `onClick` → `await` → `setState`, no instant feedback | Form `action` + `useOptimistic` with reducer |
| **CommentForm** | `onClick` → `await` → manual refetch | Form `action` + `useOptimistic` list add with UUID |
| **CommentList** | `useEffect` fetch + manual state management | Server component with `<Suspense>` |
| **DeleteButton** | `onClick` → `await` → manual refetch, no feedback | `useTransition` + `data-pending` |

## Setup

```bash
pnpm install
pnpm run dev
```

## Tech Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- shadcn/ui (base-nova, neutral)
- Geist Sans + Mono fonts
- In-memory data with simulated delays (no database)
