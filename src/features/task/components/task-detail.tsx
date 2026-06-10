import { notFound } from "next/navigation";
import { StatusSelect } from "./status-select";
import { AssigneeSelect } from "./assignee-select";
import { PriorityButton } from "./priority-button";
import { RelativeTime } from "@/components/ui/relative-time";
import { getTask } from "@/features/task/task-queries";

export async function TaskDetail({ id }: { id: string }) {
  const task = await getTask(id);

  if (!task) notFound();

  return (
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
  );
}

export function TaskDetailSkeleton() {
  return (
    <div className="mb-8 rounded-xl border border-white/10 bg-white/[0.03] p-6">
      <div className="mb-4 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-16 animate-pulse rounded-full bg-white/[0.06]" />
          <div className="h-5 w-12 animate-pulse rounded-full bg-white/[0.06]" />
        </div>
        <div className="h-6 w-48 animate-pulse rounded bg-white/[0.06]" />
      </div>
      <div className="mb-6 space-y-2">
        <div className="h-4 w-full animate-pulse rounded bg-white/[0.05]" />
        <div className="h-4 w-11/12 animate-pulse rounded bg-white/[0.05]" />
        <div className="h-1 w-1/2 animate-pulse rounded bg-white/[0.05]" />
      </div>
      <div className="space-y-3 border-t border-white/10 pt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-4 w-16 animate-pulse rounded bg-white/[0.06]" />
            <div className="h-6 w-24 animate-pulse rounded bg-white/[0.06]" />
          </div>
        ))}
      </div>
    </div>
  );
}
