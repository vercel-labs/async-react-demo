"use server";

import { cookies } from "next/headers";
import {
  comments,
  getNextCommentId,
  stars,
  votes,
  type Comment,
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

export async function toggleStar(taskId: string) {
  await delay(600);
  const userName = await getCurrentUser();
  if (!userName) return;

  const idx = stars.findIndex(
    (s) => s.taskId === taskId && s.userName === userName
  );
  if (idx >= 0) {
    stars.splice(idx, 1);
  } else {
    stars.push({ taskId, userName });
  }
}

export async function upvoteTask(taskId: string) {
  await delay(500);
  const userName = await getCurrentUser();
  if (!userName) return;

  const existing = votes.find(
    (v) => v.taskId === taskId && v.userName === userName
  );
  if (existing) return;

  votes.push({ taskId, userName });
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
