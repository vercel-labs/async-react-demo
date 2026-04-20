"use client";

import { useOptimistic, useRef } from "react";
import { ArrowUp } from "lucide-react";
import { addComment } from "@/lib/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CommentCard } from "./comment-card";

type PendingComment = {
  id: string;
  content: string;
  userName: string;
  createdAt: string;
};

export function OptimisticComments({ taskId }: { taskId: string }) {
  const [pendingComments, setPendingComments] = useOptimistic<PendingComment[]>(
    []
  );
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <div className="mb-5">
        <form
          ref={formRef}
          className="relative"
          action={async (formData) => {
            const content = (formData.get("content") as string)?.trim();
            if (!content) return;
            formRef.current?.reset();

            const id = crypto.randomUUID();
            setPendingComments((current) => [
              {
                id,
                content,
                userName: "You",
                createdAt: new Date().toISOString(),
              },
              ...current,
            ]);

            await addComment(taskId, content);
          }}
        >
          <Input
            name="content"
            placeholder="Write a comment..."
            required
            className="pr-10"
          />
          <Button
            type="submit"
            variant="ghost"
            size="icon-xs"
            className="absolute right-1.5 top-1/2 -translate-y-1/2"
          >
            <ArrowUp className="size-3.5" />
          </Button>
        </form>
      </div>
      {pendingComments.length > 0 && (
        <div className="space-y-1">
          {pendingComments.map((comment) => (
            <CommentCard key={comment.id} comment={comment} pending />
          ))}
        </div>
      )}
    </>
  );
}
