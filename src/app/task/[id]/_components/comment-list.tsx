"use client";

import { use, useOptimistic } from "react";
import { CommentForm } from "./comment-form";
import { DeleteButton } from "./delete-button";
import { deleteComment } from "@/lib/actions";
import { timeAgo } from "@/lib/utils";
import type { Comment } from "@/lib/data";
import type { commentsFromTask } from "@/lib/queries";

type SerializedComment = Omit<Comment, "createdAt"> & { createdAt: string };

export function CommentList({
  commentsPromise,
  userName,
}: {
  commentsPromise: ReturnType<typeof commentsFromTask>;
  userName: string;
}) {
  const data = use(commentsPromise);
  if (!data) return null;

  const { taskId, comments } = data;

  const [optimisticComments, updateComments] = useOptimistic(
    comments,
    (
      state: SerializedComment[],
      action: { type: "add"; comment: SerializedComment } | { type: "delete"; id: string }
    ) => {
      if (action.type === "add") {
        if (state.some((c) => c.id === action.comment.id)) return state;
        return [action.comment, ...state];
      }
      if (action.type === "delete") {
        return state.map((c) =>
          c.id === action.id ? { ...c, deleting: true } : c
        ) as (SerializedComment & { deleting?: boolean })[];
      }
      return state;
    }
  );

  return (
    <div>
      <h3 className="mb-4 text-[13px] font-medium text-white/60">
        Discussion
        {optimisticComments.length > 0 && (
          <span className="ml-1.5 font-mono text-[10px] text-white/30">
            {optimisticComments.length}
          </span>
        )}
      </h3>

      <div className="mb-5">
        <CommentForm
          taskId={taskId}
          addCommentAction={(comment) =>
            updateComments({ type: "add", comment })
          }
        />
      </div>

      <div className="space-y-1">
        {optimisticComments.map((comment) => {
          const isDeleting = "deleting" in comment && comment.deleting;
          return (
            <div
              key={comment.id}
              className={`group/comment rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.02] ${
                isDeleting ? "opacity-30" : ""
              } ${"pending" in comment && comment.pending ? "animate-pulse" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06] font-mono text-[9px] text-white/50">
                    {comment.userName[0]}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[13px] font-medium text-white/70">
                        {comment.userName}
                      </span>
                      <span className="font-mono text-[10px] text-white/20">
                        {timeAgo(new Date(comment.createdAt))}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-white/50">
                      {comment.content}
                    </p>
                  </div>
                </div>
                {comment.userName === userName && !isDeleting && (
                  <div className="opacity-0 transition-opacity group-hover/comment:opacity-100">
                    <DeleteButton
                      deleteAction={async () => {
                        updateComments({ type: "delete", id: comment.id });
                        await deleteComment(comment.id);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {optimisticComments.length === 0 && (
          <p className="py-10 text-center text-[13px] text-white/20">
            No comments yet
          </p>
        )}
      </div>
    </div>
  );
}

export function CommentListSkeleton() {
  return (
    <div>
      <h3 className="mb-4 text-[13px] font-medium text-white/60">
        Discussion
      </h3>
      <div className="mb-5">
        <div className="h-[42px] rounded-lg border border-white/[0.06] bg-white/[0.02]" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-lg bg-white/[0.03]"
          />
        ))}
      </div>
    </div>
  );
}
