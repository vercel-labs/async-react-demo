import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const now = Date.now();
const hour = 3600_000;
const day = 24 * hour;

async function main() {
  // Clear existing data
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();

  await prisma.task.createMany({
    data: [
      { id: "1", title: "Redesign settings page", description: "The current settings page has poor information hierarchy. Needs a full redesign with grouped sections and better spacing.", status: "in-progress", priority: "high", labels: ["design", "frontend"], assignee: "Sarah", createdAt: new Date(now - 2 * day) },
      { id: "2", title: "Fix login redirect loop", description: "Users are getting stuck in a redirect loop when their session expires mid-navigation. Need to clear stale tokens.", status: "in-progress", priority: "high", labels: ["bug", "backend"], assignee: "Marcus", createdAt: new Date(now - 3 * day) },
      { id: "3", title: "Add dark mode toggle", description: "Implement a theme toggle in the header using CSS custom properties. Should persist preference to localStorage.", status: "done", priority: "medium", labels: ["feature", "frontend"], assignee: "Elena", createdAt: new Date(now - 5 * day) },
      { id: "4", title: "Set up CI/CD pipeline", description: "Configure GitHub Actions for automated testing, linting, and deployment to staging on PR merge.", status: "done", priority: "medium", labels: ["devops"], assignee: "Jordan", createdAt: new Date(now - 7 * day) },
      { id: "5", title: "Migrate database to PostgreSQL", description: "Move from SQLite to PostgreSQL for production. Update connection pooling, run migration scripts, verify data integrity.", status: "todo", priority: "high", labels: ["backend", "devops"], assignee: "Marcus", createdAt: new Date(now - 1 * day) },
      { id: "6", title: "Design system documentation", description: "Document all design tokens, component variants, and usage patterns. Publish as an internal Storybook site.", status: "todo", priority: "low", labels: ["design"], assignee: "Sarah", createdAt: new Date(now - 4 * day) },
      { id: "7", title: "Fix mobile nav overflow", description: "On small screens the navigation menu overflows horizontally. Need to switch to a hamburger menu below 768px.", status: "in-progress", priority: "medium", labels: ["bug", "frontend"], assignee: "Elena", createdAt: new Date(now - 6 * hour) },
      { id: "8", title: "Add search functionality", description: "Implement full-text search across tasks with debounced input and highlighted results.", status: "todo", priority: "medium", labels: ["feature", "frontend"], assignee: "Jordan", createdAt: new Date(now - 12 * hour) },
      { id: "9", title: "API rate limiting", description: "Implement rate limiting on public API endpoints using a sliding window counter in Redis.", status: "todo", priority: "low", labels: ["backend", "devops"], assignee: "Marcus", createdAt: new Date(now - 14 * day) },
      { id: "10", title: "Onboarding flow redesign", description: "Create a step-by-step onboarding wizard for new users. Include workspace setup, team invites, and a sample project.", status: "in-progress", priority: "high", labels: ["design", "feature"], assignee: "Sarah", createdAt: new Date(now - 2 * day) },
      { id: "11", title: "Fix date formatting inconsistency", description: "Some dates show as relative (2h ago) and others as absolute (Jan 5). Standardize to relative everywhere with a tooltip for absolute.", status: "done", priority: "low", labels: ["bug", "frontend"], assignee: "Elena", createdAt: new Date(now - 10 * day) },
      { id: "12", title: "Implement webhook system", description: "Allow users to register webhook URLs and receive POST notifications on task status changes.", status: "todo", priority: "medium", labels: ["feature", "backend"], assignee: "Jordan", createdAt: new Date(now - 21 * day) },
    ],
  });

  await prisma.comment.createMany({
    data: [
      { id: "c1", taskId: "1", userName: "Marcus", content: "I can help with the backend API changes needed for this.", createdAt: new Date(now - 1 * day) },
      { id: "c2", taskId: "1", userName: "Elena", content: "The mockups look great. Should we split this into smaller tickets?", createdAt: new Date(now - 18 * hour) },
      { id: "c3", taskId: "2", userName: "Sarah", content: "This is happening in production too. Users are reporting it.", createdAt: new Date(now - 2 * day) },
      { id: "c4", taskId: "5", userName: "Jordan", content: "I can set up the staging PostgreSQL instance this week.", createdAt: new Date(now - 8 * hour) },
      { id: "c5", taskId: "7", userName: "Sarah", content: "Let me know if you need the breakpoint specs from the design.", createdAt: new Date(now - 3 * hour) },
      { id: "c6", taskId: "8", userName: "Marcus", content: "Should we use a dedicated search service or keep it in-app?", createdAt: new Date(now - 6 * hour) },
      { id: "c7", taskId: "10", userName: "Elena", content: "The competitor analysis is done. Sharing the doc now.", createdAt: new Date(now - 1 * day) },
      { id: "c8", taskId: "1", userName: "Jordan", content: "Deployed the preview — check it out and leave feedback.", createdAt: new Date(now - 2 * hour) },
    ],
  });

  console.log("Seeded 12 tasks and 8 comments.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
