"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { addComment } from "@/lib/actions";

export function CommentForm({
  taskId,
  onCommentAdded,
}: {
  taskId: string;
  onCommentAdded: () => void;
}) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!content.trim() || isSubmitting) return;
    setIsSubmitting(true);
    await addComment(taskId, content);
    setContent("");
    setIsSubmitting(false);
    onCommentAdded();
  }

  return (
    <div className="flex gap-2">
      <input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder="Add a comment..."
        className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
        disabled={isSubmitting}
      />
      <button
        onClick={handleSubmit}
        disabled={!content.trim() || isSubmitting}
        className="rounded-lg bg-white/10 px-3 py-2 text-white/60 transition-colors hover:bg-white/15 hover:text-white disabled:opacity-40"
      >
        <Send className="size-4" />
      </button>
    </div>
  );
}
