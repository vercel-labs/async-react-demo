import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  TaskDetail,
  TaskDetailSkeleton,
} from "@/features/task/components/task-detail";
import {
  CommentSection,
  CommentSectionSkeleton,
} from "@/features/task/components/comment-section";

export const prefetch = "allow-runtime";

export default function TaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white"
      >
        <ArrowLeft className="size-3.5" />
        Back
      </Link>

      <Suspense fallback={<TaskDetailSkeleton />}>
        {params.then(({ id }) => (
          <>
            <TaskDetail id={id} />

            <h3 className="mb-4 text-[13px] font-medium text-white/60">
              Discussion
            </h3>

            <Suspense fallback={<CommentSectionSkeleton />}>
              <CommentSection taskId={id} />
            </Suspense>
          </>
        ))}
      </Suspense>
    </div>
  );
}
