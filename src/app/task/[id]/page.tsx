import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTask } from "@/data/queries/task";
import { TaskDetail, TaskDetailSkeleton } from "./_components/task-detail";
import {
  CommentSection,
  CommentSectionSkeleton,
} from "./_components/comment-section";

export const unstable_prefetch = "force-runtime";

export default function TaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const taskPromise = params.then(({ id }) => getTask(id));
  const taskIdPromise = params.then(({ id }) => id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/30 transition-colors hover:text-white/60"
      >
        <ArrowLeft className="size-3.5" />
        Back
      </Link>

      <Suspense fallback={<TaskDetailSkeleton />}>
        <TaskDetail taskPromise={taskPromise} />
      </Suspense>

      <h3 className="mb-4 text-[13px] font-medium text-white/60">Discussion</h3>

      <Suspense fallback={<CommentSectionSkeleton />}>
        <CommentSection taskIdPromise={taskIdPromise} />
      </Suspense>
    </div>
  );
}
