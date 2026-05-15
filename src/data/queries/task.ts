import "server-only";

import { cache } from "react";
import { cacheTag } from "next/cache";
import { tasks, type Label, type Status } from "@/lib/data";
import { delay } from "@/lib/utils";

export const getTasks = cache(async (label?: Label) => {
  "use cache";
  cacheTag("tasks");

  await delay(400);
  let filtered = tasks;
  if (label) {
    filtered = filtered.filter((t) => t.labels.includes(label));
  }
  return filtered;
});

export const getTasksByStatus = cache(async (status: Status, label?: Label) => {
  "use cache";
  cacheTag("tasks");

  await delay(400);
  let filtered = tasks.filter((t) => t.status === status);
  if (label) {
    filtered = filtered.filter((t) => t.labels.includes(label));
  }
  return filtered;
});

export const getTask = cache(async (id: string) => {
  "use cache";
  cacheTag("tasks", `task-${id}`);

  await delay(300);
  return tasks.find((t) => t.id === id) ?? null;
});
