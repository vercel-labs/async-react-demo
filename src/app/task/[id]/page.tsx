import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTask, commentsFromTask } from "@/lib/queries";
import { TaskDetail, TaskDetailSkeleton } from "./_components/task-detail";
import { CommentList, CommentListSkeleton } from "./_components/comment-list";

export default function TaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const taskPromise = params.then(({ id }) => getTask(id));
  const commentsPromise = commentsFromTask(taskPromise);

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

      <Suspense fallback={<CommentListSkeleton />}>
        <CommentList commentsPromise={commentsPromise} userName="You" />
      </Suspense>
    </div>
  );
}
