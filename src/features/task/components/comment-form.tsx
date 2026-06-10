"use client";

import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { addComment } from "@/features/task/task-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CommentForm({ taskId }: { taskId: string }) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!content.trim() || isSubmitting) return;
    setIsSubmitting(true);
    await addComment(taskId, content);
    setContent("");
    setIsSubmitting(false);
  }

  return (
    <div className="relative">
      <Input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder="Write a comment..."
        className="pr-10"
        disabled={isSubmitting}
      />
      <Button
        onClick={handleSubmit}
        disabled={!content.trim() || isSubmitting}
        variant="ghost"
        size="icon-xs"
        className="absolute right-1.5 top-1/2 -translate-y-1/2"
      >
        <ArrowUp className="size-3.5" />
      </Button>
    </div>
  );
}
