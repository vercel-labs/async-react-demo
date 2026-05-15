"use server";

import { z } from "zod/v4";
import { updateTag } from "next/cache";
import {
  tasks,
  getNextTaskId,
  ASSIGNEES,
  LABELS,
  PRIORITY_CYCLE,
  type Assignee,
  type Label,
  type Priority,
  type Status,
} from "@/lib/data";
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
  tasks.unshift(task);
  updateTag("tasks");
  return { success: true as const, task };
}

export async function cyclePriority(taskId: string): Promise<Priority | null> {
  await delay(500);
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return null;
  task.priority = PRIORITY_CYCLE[task.priority];
  updateTag("tasks");
  updateTag(`task-${taskId}`);
  return task.priority;
}

export async function updateStatus(
  taskId: string,
  newStatus: Status,
): Promise<Status | null> {
  await delay(500);
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return null;
  task.status = newStatus;
  updateTag("tasks");
  updateTag(`task-${taskId}`);
  return task.status;
}

export async function reassignTask(
  taskId: string,
  newAssignee: string,
): Promise<Assignee | null> {
  await delay(500);
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return null;
  if (!ASSIGNEES.includes(newAssignee as Assignee)) return null;
  task.assignee = newAssignee as Assignee;
  updateTag("tasks");
  updateTag(`task-${taskId}`);
  return task.assignee;
}
