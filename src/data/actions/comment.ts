"use server";

import { z } from "zod/v4";
import { updateTag } from "next/cache";
import { getNextCommentId, insertComment, deleteCommentById, type Comment } from "@/lib/data";
import { delay } from "@/lib/utils";

const DEFAULT_USER = "You";

const addCommentSchema = z.object({
  taskId: z.string().min(1),
  content: z.string().min(1, "Content is required"),
});

export async function addComment(
  taskId: string,
  content: string,
): Promise<Comment | null> {
  const parsed = addCommentSchema.safeParse({ taskId, content });
  if (!parsed.success) return null;

  await delay(800);

  const comment: Comment = {
    id: getNextCommentId(),
    taskId: parsed.data.taskId,
    userName: DEFAULT_USER,
    content: parsed.data.content.trim(),
    createdAt: new Date(),
  };
  insertComment(comment);
  updateTag(`comments-${taskId}`);
  return comment;
}

export async function deleteComment(commentId: string) {
  await delay(500);

  const taskId = deleteCommentById(commentId, DEFAULT_USER);
  if (taskId) {
    updateTag(`comments-${taskId}`);
  }
}
