import { getComments } from "@/lib/queries";
import { CommentList } from "./comment-list";

export async function CommentSection({ taskId }: { taskId: string }) {
  const comments = await getComments(taskId);

  const serialized = comments.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));

  return <CommentList taskId={taskId} comments={serialized} userName="You" />;
}

export function CommentSectionSkeleton() {
  return (
    <div>
      <h3 className="mb-4 text-[13px] font-medium text-white/60">
        Discussion
      </h3>
      <div className="mb-5">
        <div className="h-[42px] rounded-lg bg-white/[0.02] border border-white/[0.06]" />
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
