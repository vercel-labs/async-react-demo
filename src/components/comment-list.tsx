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
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-lg bg-white/5"
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/70">
          Comments
          <span className="ml-2 font-mono text-xs text-white/40">
            {comments.length}
          </span>
        </h3>
      </div>

      <div className="mb-4">
        <CommentForm taskId={taskId} onCommentAdded={fetchComments} />
      </div>

      <div className="space-y-3">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="rounded-lg border border-white/5 bg-white/[0.03] p-3"
          >
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-5 items-center justify-center rounded-full bg-white/10 font-mono text-[10px] text-white/60">
                  {comment.userName[0]}
                </div>
                <span className="text-xs font-medium text-white/70">
                  {comment.userName}
                </span>
                <span className="font-mono text-[10px] text-white/30">
                  {timeAgo(comment.createdAt)}
                </span>
              </div>
              {comment.userName === userName && (
                <DeleteButton
                  commentId={comment.id}
                  onDeleted={fetchComments}
                />
              )}
            </div>
            <p className="text-sm leading-relaxed text-white/60">
              {comment.content}
            </p>
          </div>
        ))}

        {comments.length === 0 && (
          <p className="py-8 text-center text-sm text-white/30">
            No comments yet
          </p>
        )}
      </div>
    </div>
  );
}
