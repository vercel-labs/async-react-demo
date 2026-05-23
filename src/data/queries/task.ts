import "server-only";

import { cache } from "react";
import { cacheTag } from "next/cache";
import { getAllTasks, getTasksByLabel, getTasksByStatusAndLabel, getTaskById as getTaskByIdFromDb, LABELS, type Label, type Status } from "@/lib/data";
import { delay } from "@/lib/utils";

export const getTasks = cache(async (label?: string) => {
  "use cache";
  cacheTag("tasks");

  await delay(400);
  const filtered = label && LABELS.includes(label as Label)
    ? getTasksByLabel(label)
    : getAllTasks();
  return filtered.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() }));
});

export const getTasksByStatus = cache(async (status: Status, label?: Label) => {
  "use cache";
  cacheTag("tasks");

  await delay(400);
  return getTasksByStatusAndLabel(status, label);
});

export const getTask = cache(async (id: string) => {
  "use cache";
  cacheTag("tasks", `task-${id}`);

  await delay(300);
  return getTaskByIdFromDb(id);
});
