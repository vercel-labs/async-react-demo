import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTask } from "@/lib/queries";
import { StatusSelect } from "./_components/status-select";
import { AssigneeSelect } from "./_components/assignee-select";
import { PriorityButton } from "./_components/priority-button";
import {
  CommentSection,
  CommentSectionSkeleton,
} from "./_components/comment-section";
import { cn, timeAgo } from "@/lib/utils";

const labelStyle = "bg-white/[0.06] text-white/50";

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

      <div className="mb-8 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
        <Suspense fallback={<TaskHeaderSkeleton />}>
          <TaskHeader params={params} />
        </Suspense>

        <div className="space-y-3 border-t border-white/[0.06] pt-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-white/30">Status</span>
            <Suspense fallback={<ControlSkeleton />}>
              <TaskStatus params={params} />
            </Suspense>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-white/30">Assignee</span>
            <Suspense fallback={<ControlSkeleton />}>
              <TaskAssignee params={params} />
            </Suspense>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-white/30">Priority</span>
            <Suspense fallback={<ControlSkeleton />}>
              <TaskPriority params={params} />
            </Suspense>
          </div>
        </div>
      </div>

      <Suspense fallback={<CommentSectionSkeleton />}>
        <TaskComments params={params} />
      </Suspense>
    </div>
  );
}

async function TaskHeader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await getTask(id);
  if (!task) notFound();

  return (
    <div className="mb-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {task.labels.map((l) => (
          <span
            key={l}
            className={cn(
              "rounded-full px-2 py-0.5 font-mono text-[10px]",
              labelStyle,
            )}
          >
            {l}
          </span>
        ))}
        <span className="font-mono text-[10px] text-white/20">
          {timeAgo(task.createdAt)}
        </span>
      </div>
      <h1 className="text-lg font-semibold tracking-tight">{task.title}</h1>
      <p className="mt-4 mb-6 text-sm leading-relaxed text-white/50">
        {task.description}
      </p>
    </div>
  );
}

async function TaskStatus({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await getTask(id);
  if (!task) return null;
  return <StatusSelect taskId={task.id} status={task.status} />;
}

async function TaskAssignee({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await getTask(id);
  if (!task) return null;
  return <AssigneeSelect taskId={task.id} assignee={task.assignee} />;
}

async function TaskPriority({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await getTask(id);
  if (!task) return null;
  return <PriorityButton taskId={task.id} priority={task.priority} />;
}

async function TaskComments({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await getTask(id);
  if (!task) return null;
  return <CommentSection taskId={task.id} />;
}

function TaskHeaderSkeleton() {
  return (
    <div className="mb-4 space-y-3">
      <div className="flex gap-2">
        <div className="h-5 w-16 animate-pulse rounded-full bg-white/[0.04]" />
        <div className="h-5 w-12 animate-pulse rounded-full bg-white/[0.04]" />
      </div>
      <div className="h-6 w-48 animate-pulse rounded bg-white/[0.04]" />
      <div className="mt-4 mb-6 space-y-2">
        <div className="h-4 w-full animate-pulse rounded bg-white/[0.03]" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-white/[0.03]" />
      </div>
    </div>
  );
}

function ControlSkeleton() {
  return <div className="h-6 w-24 animate-pulse rounded bg-white/[0.04]" />;
}
