"use server";

import { cookies } from "next/headers";
import {
  comments,
  getNextCommentId,
  tasks,
  ASSIGNEES,
  type Assignee,
  type Comment,
  type Priority,
  type Status,
} from "./data";
import { delay } from "./utils";

async function getCurrentUser(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("taskboard-user")?.value ?? null;
}

export async function setUserName(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  if (!name) return;
  const cookieStore = await cookies();
  cookieStore.set("taskboard-user", name, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

const priorityCycle: Record<Priority, Priority> = {
  low: "medium",
  medium: "high",
  high: "low",
};

export async function cyclePriority(
  taskId: string
): Promise<Priority | null> {
  await delay(500);
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return null;
  task.priority = priorityCycle[task.priority];
  return task.priority;
}

export async function updateStatus(
  taskId: string,
  newStatus: Status
): Promise<Status | null> {
  await delay(500);
  if (Math.random() < 0.3) {
    throw new Error("Failed to update status — server error");
  }
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return null;
  task.status = newStatus;
  return task.status;
}

export async function reassignTask(
  taskId: string,
  newAssignee: string
): Promise<Assignee | null> {
  await delay(500);
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return null;
  if (!ASSIGNEES.includes(newAssignee as Assignee)) return null;
  task.assignee = newAssignee as Assignee;
  return task.assignee;
}

export async function addComment(
  taskId: string,
  content: string
): Promise<Comment | null> {
  await delay(800);
  const userName = await getCurrentUser();
  if (!userName || !content.trim()) return null;

  const comment: Comment = {
    id: getNextCommentId(),
    taskId,
    userName,
    content: content.trim(),
    createdAt: new Date(),
  };
  comments.push(comment);
  return comment;
}

export async function deleteComment(commentId: string) {
  await delay(500);
  const userName = await getCurrentUser();
  if (!userName) return;

  const idx = comments.findIndex(
    (c) => c.id === commentId && c.userName === userName
  );
  if (idx >= 0) {
    comments.splice(idx, 1);
  }
}
