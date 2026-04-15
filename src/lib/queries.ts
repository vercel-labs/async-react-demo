import { cache } from "react";
import { comments, tasks, type Label, type Status, type Task } from "./data";
import { delay } from "./utils";

const DEFAULT_USER = "You";

export async function getCurrentUser(): Promise<string> {
  return DEFAULT_USER;
}

export const getTasks = cache(async (label?: Label) => {
  await delay(400);
  let filtered = tasks;
  if (label) {
    filtered = filtered.filter((t) => t.labels.includes(label));
  }
  return filtered;
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

export async function commentsFromTask(taskPromise: Promise<Task | null>) {
  const task = await taskPromise;
  if (!task) return null;
  const taskComments = await getComments(task.id);
  return {
    taskId: task.id,
    comments: taskComments.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    })),
  };
}

export const getComments = cache(async (taskId: string) => {
  await delay(350);
  return comments
    .filter((c) => c.taskId === taskId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
});
