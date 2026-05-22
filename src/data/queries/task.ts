import "server-only";

import { cache } from "react";
import { tasks, LABELS, type Label, type Status } from "@/lib/data";
import { delay } from "@/lib/utils";

export const getTasks = cache(async (label?: string) => {
  await delay(400);
  let filtered = tasks;
  if (label && LABELS.includes(label as Label)) {
    filtered = filtered.filter((t) => t.labels.includes(label as Label));
  }
  return filtered.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() }));
});

export const getTasksByStatus = cache(async (status: Status, label?: Label) => {
  await delay(400);
  let filtered = tasks.filter((t) => t.status === status);
  if (label) {
    filtered = filtered.filter((t) => t.labels.includes(label));
  }
  return filtered;
});

export const getTask = cache(async (id: string) => {
  await delay(300);
  return tasks.find((t) => t.id === id) ?? null;
});
