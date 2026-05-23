export type Status = "todo" | "in-progress" | "done";
export type Priority = "low" | "medium" | "high";
export type Label =
  | "design"
  | "frontend"
  | "backend"
  | "devops"
  | "bug"
  | "feature";

export const ASSIGNEES = ["Sarah", "Marcus", "Elena", "Jordan"] as const;
export type Assignee = (typeof ASSIGNEES)[number];

export type Task = {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  labels: Label[];
  assignee: Assignee;
  createdAt: Date;
};

export type Comment = {
  id: string;
  taskId: string;
  userName: string;
  content: string;
  createdAt: Date;
};

export const PRIORITY_CYCLE: Record<Priority, Priority> = {
  low: "medium",
  medium: "high",
  high: "low",
};

export const LABELS: Label[] = [
  "design",
  "frontend",
  "backend",
  "devops",
  "bug",
  "feature",
];

import { db } from "./db";

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
  const result = db
    .prepare("UPDATE tasks SET status = ? WHERE id = ?")
    .run(status, taskId);
  return result.changes > 0;
}

export function updateTaskPriority(
  taskId: string,
  priority: Priority,
): boolean {
  const result = db
    .prepare("UPDATE tasks SET priority = ? WHERE id = ?")
    .run(priority, taskId);
  return result.changes > 0;
}

export function updateTaskAssignee(
  taskId: string,
  assignee: Assignee,
): boolean {
  const result = db
    .prepare("UPDATE tasks SET assignee = ? WHERE id = ?")
    .run(assignee, taskId);
  return result.changes > 0;
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
