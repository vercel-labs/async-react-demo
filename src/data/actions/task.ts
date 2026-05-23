"use server";

import { z } from "zod/v4";
import { refresh } from "next/cache";
import {
  ASSIGNEES,
  LABELS,
  PRIORITY_CYCLE,
  type Assignee,
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
} from "@/lib/db";
import { delay } from "@/lib/utils";

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
    id: getNextTaskId(),
    ...parsed.data,
    createdAt: new Date(),
  };
  insertTask(task);
  refresh();
  return { success: true as const, task };
}

export async function cyclePriority(
  taskId: string,
): Promise<Priority | null> {
  await delay(500);
  const task = getTaskById(taskId);
  if (!task) return null;
  const newPriority = PRIORITY_CYCLE[task.priority];
  updateTaskPriority(taskId, newPriority);
  refresh();
  return newPriority;
}

export async function updateStatus(
  taskId: string,
  newStatus: Status,
): Promise<Status | null> {
  await delay(500);
  const updated = updateTaskStatus(taskId, newStatus);
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
  const updated = updateTaskAssignee(taskId, newAssignee as Assignee);
  if (!updated) return null;
  refresh();
  return newAssignee as Assignee;
}
