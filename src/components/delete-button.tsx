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
      className="text-white/20 transition-colors hover:text-white/50"
      aria-label="Delete comment"
    >
      <Trash2 className="size-3" />
    </button>
  );
}
