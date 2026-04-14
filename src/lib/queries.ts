import { cookies } from "next/headers";
import { comments, tasks, type Label, type Status } from "./data";
import { delay } from "./utils";

export async function getCurrentUser(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("taskboard-user")?.value ?? null;
}

export async function getTasks(label?: Label) {
  await delay(400);
  let filtered = tasks;
  if (label) {
    filtered = filtered.filter((t) => t.labels.includes(label));
  }
  return filtered;
}

export async function getTasksByStatus(status: Status, label?: Label) {
  await delay(400);
  let filtered = tasks.filter((t) => t.status === status);
  if (label) {
    filtered = filtered.filter((t) => t.labels.includes(label));
  }
  return filtered;
}

export async function getTask(id: string) {
  await delay(300);
  return tasks.find((t) => t.id === id) ?? null;
}

export async function getComments(taskId: string) {
  await delay(350);
  return comments
    .filter((c) => c.taskId === taskId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
