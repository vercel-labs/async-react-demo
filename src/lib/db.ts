import "server-only";

import Database from "better-sqlite3";
import path from "path";
import type { Task, Comment, Status, Priority, Label, Assignee } from "./data";

const DB_PATH = path.join(process.cwd(), "data.db");

function getDb() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'todo',
      priority TEXT NOT NULL DEFAULT 'medium',
      labels TEXT NOT NULL DEFAULT '[]',
      assignee TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );
  `);

  // Seed if empty
  const count = db.prepare("SELECT COUNT(*) as c FROM tasks").get() as {
    c: number;
  };
  if (count.c === 0) {
    seed(db);
  }

  return db;
}

function seed(db: Database.Database) {
  const now = Date.now();
  const hour = 3600_000;
  const day = 24 * hour;

  const insertTask = db.prepare(`
    INSERT INTO tasks (id, title, description, status, priority, labels, assignee, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertComment = db.prepare(`
    INSERT INTO comments (id, task_id, user_name, content, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const seedAll = db.transaction(() => {
    const tasks = [
      [
        "1",
        "Redesign settings page",
        "The current settings page has poor information hierarchy. Needs a full redesign with grouped sections and better spacing.",
        "in-progress",
        "high",
        '["design","frontend"]',
        "Sarah",
        new Date(now - 2 * day).toISOString(),
      ],
      [
        "2",
        "Fix login redirect loop",
        "Users are getting stuck in a redirect loop when their session expires mid-navigation. Need to clear stale tokens.",
        "in-progress",
        "high",
        '["bug","backend"]',
        "Marcus",
        new Date(now - 3 * day).toISOString(),
      ],
      [
        "3",
        "Add dark mode toggle",
        "Implement a theme toggle in the header using CSS custom properties. Should persist preference to localStorage.",
        "done",
        "medium",
        '["feature","frontend"]',
        "Elena",
        new Date(now - 5 * day).toISOString(),
      ],
      [
        "4",
        "Set up CI/CD pipeline",
        "Configure GitHub Actions for automated testing, linting, and deployment to staging on PR merge.",
        "done",
        "medium",
        '["devops"]',
        "Jordan",
        new Date(now - 7 * day).toISOString(),
      ],
      [
        "5",
        "Migrate database to PostgreSQL",
        "Move from SQLite to PostgreSQL for production. Update connection pooling, run migration scripts, verify data integrity.",
        "todo",
        "high",
        '["backend","devops"]',
        "Marcus",
        new Date(now - 1 * day).toISOString(),
      ],
      [
        "6",
        "Design system documentation",
        "Document all design tokens, component variants, and usage patterns. Publish as an internal Storybook site.",
        "todo",
        "low",
        '["design"]',
        "Sarah",
        new Date(now - 4 * day).toISOString(),
      ],
      [
        "7",
        "Fix mobile nav overflow",
        "On small screens the navigation menu overflows horizontally. Need to switch to a hamburger menu below 768px.",
        "in-progress",
        "medium",
        '["bug","frontend"]',
        "Elena",
        new Date(now - 6 * hour).toISOString(),
      ],
      [
        "8",
        "Add search functionality",
        "Implement full-text search across tasks with debounced input and highlighted results.",
        "todo",
        "medium",
        '["feature","frontend"]',
        "Jordan",
        new Date(now - 12 * hour).toISOString(),
      ],
      [
        "9",
        "API rate limiting",
        "Implement rate limiting on public API endpoints using a sliding window counter in Redis.",
        "todo",
        "low",
        '["backend","devops"]',
        "Marcus",
        new Date(now - 14 * day).toISOString(),
      ],
      [
        "10",
        "Onboarding flow redesign",
        "Create a step-by-step onboarding wizard for new users. Include workspace setup, team invites, and a sample project.",
        "in-progress",
        "high",
        '["design","feature"]',
        "Sarah",
        new Date(now - 2 * day).toISOString(),
      ],
      [
        "11",
        "Fix date formatting inconsistency",
        "Some dates show as relative (2h ago) and others as absolute (Jan 5). Standardize to relative everywhere with a tooltip for absolute.",
        "done",
        "low",
        '["bug","frontend"]',
        "Elena",
        new Date(now - 10 * day).toISOString(),
      ],
      [
        "12",
        "Implement webhook system",
        "Allow users to register webhook URLs and receive POST notifications on task status changes.",
        "todo",
        "medium",
        '["feature","backend"]',
        "Jordan",
        new Date(now - 21 * day).toISOString(),
      ],
    ];

    for (const t of tasks) {
      insertTask.run(...t);
    }

    const comments = [
      [
        "c1",
        "1",
        "Marcus",
        "I can help with the backend API changes needed for this.",
        new Date(now - 1 * day).toISOString(),
      ],
      [
        "c2",
        "1",
        "Elena",
        "The mockups look great. Should we split this into smaller tickets?",
        new Date(now - 18 * hour).toISOString(),
      ],
      [
        "c3",
        "2",
        "Sarah",
        "This is happening in production too. Users are reporting it.",
        new Date(now - 2 * day).toISOString(),
      ],
      [
        "c4",
        "5",
        "Jordan",
        "I can set up the staging PostgreSQL instance this week.",
        new Date(now - 8 * hour).toISOString(),
      ],
      [
        "c5",
        "7",
        "Sarah",
        "Let me know if you need the breakpoint specs from the design.",
        new Date(now - 3 * hour).toISOString(),
      ],
      [
        "c6",
        "8",
        "Marcus",
        "Should we use a dedicated search service or keep it in-app?",
        new Date(now - 6 * hour).toISOString(),
      ],
      [
        "c7",
        "10",
        "Elena",
        "The competitor analysis is done. Sharing the doc now.",
        new Date(now - 1 * day).toISOString(),
      ],
      [
        "c8",
        "1",
        "Jordan",
        "Deployed the preview — check it out and leave feedback.",
        new Date(now - 2 * hour).toISOString(),
      ],
    ];

    for (const c of comments) {
      insertComment.run(...c);
    }
  });

  seedAll();
}

// Singleton per process via globalThis
const globalDb = globalThis as unknown as { __db?: Database.Database };
if (!globalDb.__db) {
  globalDb.__db = getDb();
}

export const db = globalDb.__db;

// --- Row types and converters ---

type TaskRow = {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  labels: string;
  assignee: Assignee;
  created_at: string;
};

type CommentRow = {
  id: string;
  task_id: string;
  user_name: string;
  content: string;
  created_at: string;
};

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    labels: JSON.parse(row.labels) as Label[],
    assignee: row.assignee,
    createdAt: new Date(row.created_at),
  };
}

function rowToComment(row: CommentRow): Comment {
  return {
    id: row.id,
    taskId: row.task_id,
    userName: row.user_name,
    content: row.content,
    createdAt: new Date(row.created_at),
  };
}

// --- Query functions ---

export function getAllTasks(): Task[] {
  const rows = db
    .prepare("SELECT * FROM tasks ORDER BY created_at DESC")
    .all() as TaskRow[];
  return rows.map(rowToTask);
}

export function getTaskById(id: string): Task | null {
  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as
    | TaskRow
    | undefined;
  return row ? rowToTask(row) : null;
}

export function getTasksByStatusAndLabel(
  status: Status,
  label?: Label,
): Task[] {
  if (label) {
    const rows = db
      .prepare(
        "SELECT * FROM tasks WHERE status = ? AND labels LIKE ? ORDER BY created_at DESC",
      )
      .all(status, `%"${label}"%`) as TaskRow[];
    return rows.map(rowToTask);
  }
  const rows = db
    .prepare("SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC")
    .all(status) as TaskRow[];
  return rows.map(rowToTask);
}

export function getTasksByLabel(label: string): Task[] {
  const rows = db
    .prepare("SELECT * FROM tasks WHERE labels LIKE ? ORDER BY created_at DESC")
    .all(`%"${label}"%`) as TaskRow[];
  return rows.map(rowToTask);
}

export function insertTask(
  task: Omit<Task, "createdAt"> & { createdAt: Date },
): void {
  db.prepare(
    "INSERT INTO tasks (id, title, description, status, priority, labels, assignee, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(
    task.id,
    task.title,
    task.description,
    task.status,
    task.priority,
    JSON.stringify(task.labels),
    task.assignee,
    task.createdAt.toISOString(),
  );
}

export function updateTaskStatus(taskId: string, status: Status): boolean {
  return (
    db.prepare("UPDATE tasks SET status = ? WHERE id = ?").run(status, taskId)
      .changes > 0
  );
}

export function updateTaskPriority(
  taskId: string,
  priority: Priority,
): boolean {
  return (
    db
      .prepare("UPDATE tasks SET priority = ? WHERE id = ?")
      .run(priority, taskId).changes > 0
  );
}

export function updateTaskAssignee(
  taskId: string,
  assignee: Assignee,
): boolean {
  return (
    db
      .prepare("UPDATE tasks SET assignee = ? WHERE id = ?")
      .run(assignee, taskId).changes > 0
  );
}

export function getCommentsByTaskId(taskId: string): Comment[] {
  const rows = db
    .prepare(
      "SELECT * FROM comments WHERE task_id = ? ORDER BY created_at DESC",
    )
    .all(taskId) as CommentRow[];
  return rows.map(rowToComment);
}

export function insertComment(comment: Comment): void {
  db.prepare(
    "INSERT INTO comments (id, task_id, user_name, content, created_at) VALUES (?, ?, ?, ?, ?)",
  ).run(
    comment.id,
    comment.taskId,
    comment.userName,
    comment.content,
    comment.createdAt.toISOString(),
  );
}

export function deleteCommentById(
  commentId: string,
  userName: string,
): string | null {
  const row = db
    .prepare("SELECT task_id FROM comments WHERE id = ? AND user_name = ?")
    .get(commentId, userName) as { task_id: string } | undefined;
  if (!row) return null;
  db.prepare("DELETE FROM comments WHERE id = ? AND user_name = ?").run(
    commentId,
    userName,
  );
  return row.task_id;
}

export function getNextTaskId(): string {
  const row = db
    .prepare("SELECT MAX(CAST(id AS INTEGER)) as max_id FROM tasks")
    .get() as { max_id: number | null };
  return String((row.max_id ?? 0) + 1);
}

export function getNextCommentId(): string {
  const row = db
    .prepare(
      "SELECT MAX(CAST(SUBSTR(id, 2) AS INTEGER)) as max_id FROM comments",
    )
    .get() as { max_id: number | null };
  return `c${(row.max_id ?? 0) + 1}`;
}
