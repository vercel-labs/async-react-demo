import "server-only";

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { Task, Comment, Status, Priority, Label, Assignee } from "./data";

const globalForPrisma = globalThis as unknown as { __prisma?: PrismaClient };
if (!globalForPrisma.__prisma) {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  globalForPrisma.__prisma = new PrismaClient({ adapter });
}
const prisma = globalForPrisma.__prisma;

function rowToTask(row: {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  labels: string[];
  assignee: string;
  createdAt: Date;
}): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status as Status,
    priority: row.priority as Priority,
    labels: row.labels as Label[],
    assignee: row.assignee as Assignee,
    createdAt: row.createdAt,
  };
}

function rowToComment(row: {
  id: string;
  taskId: string;
  userName: string;
  content: string;
  createdAt: Date;
}): Comment {
  return {
    id: row.id,
    taskId: row.taskId,
    userName: row.userName,
    content: row.content,
    createdAt: row.createdAt,
  };
}

// --- Query functions ---

export async function getAllTasks(): Promise<Task[]> {
  const rows = await prisma.task.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  });
  return rows.map(rowToTask);
}

export async function getTaskById(id: string): Promise<Task | null> {
  const row = await prisma.task.findUnique({ where: { id } });
  return row ? rowToTask(row) : null;
}

export async function getTasksByStatusAndLabel(
  status: Status,
  label?: Label,
): Promise<Task[]> {
  const rows = await prisma.task.findMany({
    where: {
      status,
      ...(label ? { labels: { has: label } } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  });
  return rows.map(rowToTask);
}

export async function getTasksByLabel(label: string): Promise<Task[]> {
  const rows = await prisma.task.findMany({
    where: { labels: { has: label } },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  });
  return rows.map(rowToTask);
}

export async function insertTask(
  task: Omit<Task, "createdAt"> & { createdAt: Date },
): Promise<void> {
  await prisma.task.create({
    data: {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      labels: task.labels,
      assignee: task.assignee,
      createdAt: task.createdAt,
    },
  });
}

export async function updateTaskStatus(
  taskId: string,
  status: Status,
): Promise<boolean> {
  const result = await prisma.task.updateMany({
    where: { id: taskId },
    data: { status },
  });
  return result.count > 0;
}

export async function updateTaskPriority(
  taskId: string,
  priority: Priority,
): Promise<boolean> {
  const result = await prisma.task.updateMany({
    where: { id: taskId },
    data: { priority },
  });
  return result.count > 0;
}

export async function updateTaskAssignee(
  taskId: string,
  assignee: Assignee,
): Promise<boolean> {
  const result = await prisma.task.updateMany({
    where: { id: taskId },
    data: { assignee },
  });
  return result.count > 0;
}

export async function getCommentsByTaskId(taskId: string): Promise<Comment[]> {
  const rows = await prisma.comment.findMany({
    where: { taskId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(rowToComment);
}

export async function insertComment(comment: Comment): Promise<void> {
  await prisma.comment.create({
    data: {
      id: comment.id,
      taskId: comment.taskId,
      userName: comment.userName,
      content: comment.content,
      createdAt: comment.createdAt,
    },
  });
}

export async function deleteCommentById(
  commentId: string,
  userName: string,
): Promise<string | null> {
  const comment = await prisma.comment.findFirst({
    where: { id: commentId, userName },
    select: { taskId: true },
  });
  if (!comment) return null;
  await prisma.comment.delete({ where: { id: commentId } });
  return comment.taskId;
}

export async function getNextTaskId(): Promise<string> {
  // Use timestamp + random suffix to avoid race condition collisions
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${ts}-${rand}`;
}

export async function getNextCommentId(): Promise<string> {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `c${ts}-${rand}`;
}
