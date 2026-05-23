"use server";

import { z } from "zod/v4";
import { refresh } from "next/cache";
import type { Comment } from "@/lib/data";
import { getNextCommentId, insertComment, deleteCommentById } from "@/lib/db";
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
  refresh();
  return comment;
}

export async function deleteComment(commentId: string) {
  await delay(500);

  deleteCommentById(commentId, DEFAULT_USER);
  refresh();
}
