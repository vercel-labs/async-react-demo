import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTask } from "@/data/queries/task";
import { StatusSelect } from "./_components/status-select";
import { AssigneeSelect } from "./_components/assignee-select";
import { PriorityButton } from "./_components/priority-button";
import { CommentSection } from "./_components/comment-section";
import { RelativeTime } from "@/components/relative-time";

export default async function TaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const task = await getTask(id);

  if (!task) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white"
      >
        <ArrowLeft className="size-3.5" />
        Back
      </Link>

      <div className="mb-8 rounded-xl border border-white/10 bg-white/[0.03] p-6">
        <div className="mb-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {task.labels.map((l) => (
              <span
                key={l}
                className="rounded-full bg-white/[0.1] px-2 py-0.5 font-mono text-[10px] text-white/80"
              >
                {l}
              </span>
            ))}
            <span className="font-mono text-[10px] text-white/40">
              <RelativeTime date={task.createdAt} />
            </span>
          </div>
          <h1 className="text-lg font-semibold tracking-tight">{task.title}</h1>
        </div>

        <p className="mb-6 text-sm leading-relaxed text-white/75">
          {task.description}
        </p>

        <div className="space-y-3 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-white/55">Status</span>
            <StatusSelect taskId={task.id} status={task.status} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-white/55">Assignee</span>
            <AssigneeSelect taskId={task.id} assignee={task.assignee} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-white/55">Priority</span>
            <PriorityButton taskId={task.id} priority={task.priority} />
          </div>
        </div>
      </div>

      <CommentSection taskId={task.id} />
    </div>
  );
}
