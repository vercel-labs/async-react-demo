"use server";

import { z } from "zod/v4";
import { refresh } from "next/cache";
import {
  ASSIGNEES,
  LABELS,
  PRIORITY_CYCLE,
  type Assignee,
  type Comment,
  type Label,
  type Priority,
  type Status,
} from "@/lib/data";
import {
  getNextTaskId,
  insertTask,
  getTaskById,
  updateTaskStatus,
  updateTaskPriority,
  updateTaskAssignee,
  getNextCommentId,
  insertComment,
  deleteCommentById,
} from "@/lib/db";
import { delay } from "@/lib/utils";

const DEFAULT_USER = "You";

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().default(""),
  status: z.enum(["todo", "in-progress", "done"]).default("todo"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  assignee: z.enum(ASSIGNEES).default(ASSIGNEES[0]),
  labels: z.array(z.enum(LABELS)).default([]),
});

export async function createTask(data: {
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  assignee: string;
  labels: Label[];
}) {
  await delay(600);

  const parsed = createTaskSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0].message };
  }

  const task = {
    id: await getNextTaskId(),
    ...parsed.data,
    createdAt: new Date(),
  };
  await insertTask(task);
  refresh();
  return { success: true as const, task };
}

export async function cyclePriority(taskId: string): Promise<Priority | null> {
  await delay(500);
  const task = await getTaskById(taskId);
  if (!task) return null;
  const newPriority = PRIORITY_CYCLE[task.priority];
  await updateTaskPriority(taskId, newPriority);
  refresh();
  return newPriority;
}

export async function updateStatus(
  taskId: string,
  newStatus: Status,
): Promise<Status | null> {
  await delay(500);
  const updated = await updateTaskStatus(taskId, newStatus);
  if (!updated) return null;
  refresh();
  return newStatus;
}

export async function reassignTask(
  taskId: string,
  newAssignee: string,
): Promise<Assignee | null> {
  await delay(500);
  if (!ASSIGNEES.includes(newAssignee as Assignee)) return null;
  const updated = await updateTaskAssignee(taskId, newAssignee as Assignee);
  if (!updated) return null;
  refresh();
  return newAssignee as Assignee;
}

const addCommentSchema = z.object({
  taskId: z.string().min(1),
  content: z.string().min(1, "Content is required"),
});

export async function addComment(
  taskId: string,
  content: string,
): Promise<Comment | null> {
  const parsed = addCommentSchema.safeParse({ taskId, content });
  if (!parsed.success) return null;

  await delay(800);

  const comment: Comment = {
    id: await getNextCommentId(),
    taskId: parsed.data.taskId,
    userName: DEFAULT_USER,
    content: parsed.data.content.trim(),
    createdAt: new Date(),
  };
  await insertComment(comment);
  refresh();
  return comment;
}

export async function deleteComment(commentId: string) {
  await delay(500);

  await deleteCommentById(commentId, DEFAULT_USER);
  refresh();
}
