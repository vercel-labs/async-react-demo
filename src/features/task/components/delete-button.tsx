"use client";

import { Trash2 } from "lucide-react";
import { deleteComment } from "@/features/task/task-actions";

export function DeleteButton({ commentId }: { commentId: string }) {
  async function handleClick() {
    await deleteComment(commentId);
  }

  return (
    <button
      onClick={handleClick}
      className="mt-0.5 rounded p-1 text-white/40 transition-colors hover:bg-white/[0.08] hover:text-red-300"
      aria-label="Delete comment"
    >
      <Trash2 className="size-3" />
    </button>
  );
}
