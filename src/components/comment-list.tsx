"use client";

import { startTransition, useOptimistic } from "react";
import { CommentForm } from "./comment-form";
import { DeleteButton } from "./delete-button";
import { timeAgo } from "@/lib/utils";
import { addComment, deleteComment } from "@/lib/actions";

type SerializedComment = {
  id: string;
  taskId: string;
  userName: string;
  content: string;
  createdAt: string;
};

export function CommentList({
  taskId,
  comments,
  userName,
}: {
  taskId: string;
  comments: SerializedComment[];
  userName: string;
}) {
  const [optimisticComments, dispatch] = useOptimistic(
    comments,
    (
      state,
      action:
        | { type: "add"; comment: SerializedComment }
        | { type: "delete"; id: string }
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

  async function handleAddAction(content: string) {
    const tempId = crypto.randomUUID();
    dispatch({
      type: "add",
      comment: {
        id: tempId,
        taskId,
        userName,
        content,
        createdAt: new Date().toISOString(),
      },
    });
    await addComment(taskId, content);
  }

  function handleDeleteAction(commentId: string) {
    startTransition(async () => {
      dispatch({ type: "delete", id: commentId });
      await deleteComment(commentId);
    });
  }

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
        <CommentForm addAction={handleAddAction} />
      </div>

      <div className="space-y-1">
        {optimisticComments.map((comment) => (
          <div
            key={comment.id}
            className={`group/comment rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.02] ${
              "deleting" in comment && (comment as SerializedComment & { deleting?: boolean }).deleting
                ? "opacity-50"
                : ""
            }`}
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
              {comment.userName === userName && (
                <div className="opacity-0 transition-opacity group-hover/comment:opacity-100">
                  <DeleteButton
                    deleteAction={() => handleDeleteAction(comment.id)}
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        {optimisticComments.length === 0 && (
          <p className="py-10 text-center text-[13px] text-white/20">
            No comments yet
          </p>
        )}
      </div>
    </div>
  );
}
