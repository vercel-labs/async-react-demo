import Link from "next/link";
import { ArrowUpCircle } from "lucide-react";
import { StarButton } from "./star-button";
import { getTasks, getVoteCount } from "@/lib/queries";
import type { Label, Status } from "@/lib/data";
import { cn } from "@/lib/utils";

const labelStyle = "bg-white/[0.06] text-white/50";

export async function TaskGrid({
  status,
  label,
}: {
  status?: Status;
  label?: Label;
}) {
  const tasks = await getTasks(status, label);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/40">
        <p className="text-sm">No tasks found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}

async function TaskCard({ task }: { task: Awaited<ReturnType<typeof getTasks>>[number] }) {
  const voteCount = await getVoteCount(task.id);

  return (
    <Link
      href={`/task/${task.id}`}
      className="group rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium leading-snug text-white group-hover:text-white">
          {task.title}
        </h3>
        <StarButton taskId={task.id} />
      </div>

      <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-white/50">
        {task.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
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
        </div>

        <div className="flex items-center gap-3">
          {voteCount > 0 && (
            <span className="flex items-center gap-1 font-mono text-xs text-white/40">
              <ArrowUpCircle className="size-3" />
              {voteCount}
            </span>
          )}
          <div
            className="flex size-6 items-center justify-center rounded-full bg-white/10 font-mono text-[10px] text-white/60"
            title={task.assignee}
          >
            {task.assignee[0]}
          </div>
        </div>
      </div>
    </Link>
  );
}
