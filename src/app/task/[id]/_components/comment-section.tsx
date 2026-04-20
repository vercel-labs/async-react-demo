import { getComments } from "@/lib/queries";
import { deleteComment } from "@/lib/actions";
import { CommentCard } from "./comment-card";
import { OptimisticComments } from "./optimistic-comments";
import { Skeleton } from "@/components/ui/skeleton";

export async function CommentSection({
  taskIdPromise,
}: {
  taskIdPromise: Promise<string>;
}) {
  const taskId = await taskIdPromise;
  const comments = await getComments(taskId);

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

      <OptimisticComments taskId={taskId} />

      <div className="space-y-1">
        {comments.map((comment) => (
          <CommentCard
            key={comment.id}
            comment={comment}
            deleteAction={
              comment.userName === "You" ? deleteComment : undefined
            }
          />
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

export function CommentSectionSkeleton() {
  return (
    <div>
      <h3 className="mb-4 text-[13px] font-medium text-white/60">Discussion</h3>
      <div className="mb-5">
        <div className="h-[42px] rounded-lg border border-white/[0.06] bg-white/[0.02]" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 rounded-lg bg-white/[0.03]" />
        ))}
      </div>
    </div>
  );
}
