import { getComments } from "@/features/task/task-queries";
import { deleteComment } from "@/features/task/task-actions";
import { CommentCard } from "./comment-card";
import { OptimisticComments } from "./optimistic-comments";
import { Skeleton } from "@/components/ui/skeleton";

export async function CommentSection({ taskId }: { taskId: string }) {
  const comments = await getComments(taskId);

  return (
    <div>
      <OptimisticComments taskId={taskId} />

      <div className="space-y-1">
        {comments.map((comment) => (
          <CommentCard
            key={comment.id}
            comment={comment}
            deleteAction={
              comment.userName === "You"
                ? deleteComment.bind(null, comment.id)
                : undefined
            }
          />
        ))}

        {comments.length === 0 && (
          <p className="py-10 text-center text-[13px] text-white/40">
            No comments yet
          </p>
        )}
      </div>
    </div>
  );
}

export function CommentSectionSkeleton() {
  return <Skeleton className="h-64 rounded-xl bg-white/[0.03]" />;
}
