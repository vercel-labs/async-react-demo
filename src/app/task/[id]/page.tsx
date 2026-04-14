import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTask } from "@/lib/queries";
import { StatusSelect } from "@/components/status-select";
import { AssigneeSelect } from "@/components/assignee-select";
import { PriorityButton } from "@/components/priority-button";
import { CommentSection, CommentSectionSkeleton } from "@/components/comment-section";
import { cn, timeAgo } from "@/lib/utils";

const labelStyle = "bg-white/[0.06] text-white/50";

async function TaskDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const task = await getTask(id);

  if (!task) notFound();

  return (
    <>
      <div className="mb-8 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="mb-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {task.labels.map((l) => (
              <span
                key={l}
                className={cn(
                  "rounded-full px-2 py-0.5 font-mono text-[10px]",
                  labelStyle
                )}
              >
                {l}
              </span>
            ))}
            <span className="font-mono text-[10px] text-white/20">
              {timeAgo(task.createdAt)}
            </span>
          </div>
          <h1 className="text-lg font-semibold tracking-tight">
            {task.title}
          </h1>
        </div>

        <p className="mb-6 text-sm leading-relaxed text-white/50">
          {task.description}
        </p>

        <div className="space-y-3 border-t border-white/[0.06] pt-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-white/30">Status</span>
            <StatusSelect taskId={task.id} status={task.status} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-white/30">Assignee</span>
            <AssigneeSelect taskId={task.id} assignee={task.assignee} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-white/30">Priority</span>
            <PriorityButton taskId={task.id} priority={task.priority} />
          </div>
        </div>
      </div>

      <Suspense fallback={<CommentSectionSkeleton />}>
        <CommentSection taskId={task.id} />
      </Suspense>
    </>
  );
}

function TaskDetailSkeleton() {
  return (
    <>
      <div className="mb-8 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="mb-4 space-y-3">
          <div className="flex gap-2">
            <div className="h-5 w-16 animate-pulse rounded-full bg-white/[0.04]" />
            <div className="h-5 w-12 animate-pulse rounded-full bg-white/[0.04]" />
          </div>
          <div className="h-6 w-48 animate-pulse rounded bg-white/[0.04]" />
        </div>
        <div className="mb-6 space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-white/[0.03]" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-white/[0.03]" />
        </div>
        <div className="space-y-3 border-t border-white/[0.06] pt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 w-14 animate-pulse rounded bg-white/[0.03]" />
              <div className="h-6 w-24 animate-pulse rounded bg-white/[0.04]" />
            </div>
          ))}
        </div>
      </div>
      <CommentSectionSkeleton />
    </>
  );
}

export default function TaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
        <TaskDetail params={params} />
      </Suspense>
    </div>
  );
}
