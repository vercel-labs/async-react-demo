import { cookies } from "next/headers";
import {
  comments,
  stars,
  tasks,
  votes,
  type Label,
  type Status,
} from "./data";
import { delay } from "./utils";

export async function getCurrentUser(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("taskboard-user")?.value ?? null;
}

export async function getTasks(status?: Status, label?: Label) {
  await delay(400);
  let filtered = tasks;
  if (status) {
    filtered = filtered.filter((t) => t.status === status);
  }
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

export async function getVoteCount(taskId: string) {
  return votes.filter((v) => v.taskId === taskId).length;
}

export async function hasUserVoted(taskId: string) {
  const userName = await getCurrentUser();
  if (!userName) return false;
  return votes.some((v) => v.taskId === taskId && v.userName === userName);
}

export async function getUserStars() {
  const userName = await getCurrentUser();
  if (!userName) return [];
  return stars.filter((s) => s.userName === userName).map((s) => s.taskId);
}

export async function hasUserStarred(taskId: string) {
  const userName = await getCurrentUser();
  if (!userName) return false;
  return stars.some((s) => s.taskId === taskId && s.userName === userName);
}
