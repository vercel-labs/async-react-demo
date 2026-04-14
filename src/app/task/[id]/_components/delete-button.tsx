"use client";

import { Trash2 } from "lucide-react";
import { deleteComment } from "@/lib/actions";

export function DeleteButton({
  commentId,
  onDeleted,
}: {
  commentId: string;
  onDeleted: () => void;
}) {
  async function handleClick() {
    await deleteComment(commentId);
    onDeleted();
  }

  return (
    <button
      onClick={handleClick}
      className="mt-0.5 rounded p-1 text-white/15 transition-colors hover:bg-white/[0.06] hover:text-white/40"
      aria-label="Delete comment"
    >
      <Trash2 className="size-3" />
    </button>
  );
}
