import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTask } from "@/lib/queries";
import { StatusSelect } from "./_components/status-select";
import { AssigneeSelect } from "./_components/assignee-select";
import { PriorityButton } from "./_components/priority-button";
import { CommentList } from "./_components/comment-list";
import { cn, timeAgo } from "@/lib/utils";

const labelStyle = "bg-white/[0.06] text-white/50";

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
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/30 transition-colors hover:text-white/60"
      >
        <ArrowLeft className="size-3.5" />
        Back
      </Link>

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
            <StatusSelect taskId={task.id} initialStatus={task.status} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-white/30">Assignee</span>
            <AssigneeSelect
              taskId={task.id}
              initialAssignee={task.assignee}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-white/30">Priority</span>
            <PriorityButton
              taskId={task.id}
              initialPriority={task.priority}
            />
          </div>
        </div>
      </div>

      <CommentList taskId={task.id} userName="You" />
    </div>
  );
}
