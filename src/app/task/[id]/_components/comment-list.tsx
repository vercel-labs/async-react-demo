"use client";

import { useCallback, useEffect, useState } from "react";
import { CommentForm } from "./comment-form";
import { DeleteButton } from "./delete-button";
import { timeAgo } from "@/lib/utils";
import type { Comment } from "@/lib/data";

export function CommentList({
  taskId,
  userName,
}: {
  taskId: string;
  userName: string;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    const res = await fetch(`/api/comments/${taskId}?t=${Date.now()}`);
    const data = await res.json();
    setComments(
      data.map((c: Comment & { createdAt: string }) => ({
        ...c,
        createdAt: new Date(c.createdAt),
      }))
    );
    setIsLoading(false);
  }, [taskId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional legacy pattern for demo
    fetchComments();
  }, [fetchComments]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-lg bg-white/[0.03]"
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-4 text-[13px] font-medium text-white/60">
        Discussion
        {comments.length > 0 && (
          <span className="ml-1.5 font-mono text-[10px] text-white/30">
            {comments.length}
          </span>
        )}
      </h3>

      <div className="mb-5">
        <CommentForm taskId={taskId} onCommentAdded={fetchComments} />
      </div>

      <div className="space-y-1">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="group/comment rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/[0.1] font-mono text-[9px] text-white/70">
                  {comment.userName[0]}
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[13px] font-medium text-white/90">
                      {comment.userName}
                    </span>
                    <span className="font-mono text-[10px] text-white/35">
                      {timeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-white/70">
                    {comment.content}
                  </p>
                </div>
              </div>
              {comment.userName === userName && (
                <div className="opacity-0 transition-opacity group-hover/comment:opacity-100">
                  <DeleteButton
                    commentId={comment.id}
                    onDeleted={fetchComments}
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <p className="py-10 text-center text-[13px] text-white/20">
            No comments yet
          </p>
        )}
      </div>
    </div>
  );
}
