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
  return (
    <div aria-hidden>
      <div className="mb-5 rounded-md bg-white/[0.03] p-2">
        <Skeleton className="h-5 w-36 rounded bg-white/[0.06]" />
      </div>
      <div className="rounded-lg px-3 py-2.5">
        <div className="flex items-start gap-2.5">
          <Skeleton className="mt-0.5 size-5 shrink-0 rounded-full bg-white/[0.08]" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-3.5 w-24 rounded bg-white/[0.06]" />
            <Skeleton className="mt-2 h-3 w-48 max-w-full rounded bg-white/[0.05]" />
          </div>
        </div>
      </div>
    </div>
  );
}
