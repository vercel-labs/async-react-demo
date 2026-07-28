import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { LABELS, type Label, type Status } from "@/lib/data";
import {
  getAllTasks,
  getTasksByLabel,
  getTasksByStatusAndLabel,
  getTaskById as getTaskByIdFromDb,
  getCommentsByTaskId,
} from "@/lib/db";
import { delay } from "@/lib/utils";

export async function getTasks(label?: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("tasks");

  await delay(400);
  const filtered =
    label && LABELS.includes(label as Label)
      ? await getTasksByLabel(label)
      : await getAllTasks();
  return filtered.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() }));
}

export async function getTasksByStatus(status: Status, label?: Label) {
  "use cache";
  cacheLife("hours");
  cacheTag("tasks");

  await delay(400);
  return getTasksByStatusAndLabel(status, label);
}

export async function getTask(id: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("tasks", `task-${id}`);

  await delay(300);
  return getTaskByIdFromDb(id);
}

export async function getComments(taskId: string) {
  await delay(350);
  return getCommentsByTaskId(taskId);
}
