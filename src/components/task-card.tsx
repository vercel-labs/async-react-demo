"use client";

import { useOptimistic } from "react";
import { useRouter } from "next/navigation";
import { cyclePriority, reassignTask, PRIORITY_CYCLE } from "@/lib/actions";
import { cn } from "@/lib/utils";
import {
  ASSIGNEES,
  type Assignee,
  type Label,
  type Priority,
  type Status,
} from "@/lib/data";

const priorityDot: Record<Priority, string> = {
  high: "bg-white/70",
  medium: "bg-white/35",
  low: "bg-white/15",
};

export function TaskCard({
  id,
  title,
  priority,
  labels,
  assignee,
}: {
  id: string;
  title: string;
  priority: Priority;
  labels: Label[];
  assignee: Assignee;
  status: Status;
}) {
  const router = useRouter();
  const [optimisticPriority, setOptimisticPriority] = useOptimistic(priority);
  const [optimisticAssignee, setOptimisticAssignee] = useOptimistic(assignee);

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleCardClick() {
    router.push(`/task/${id}`);
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={handleCardClick}
      className="group/card cursor-grab rounded-lg border border-white/[0.04] bg-white/[0.02] p-3 transition-all hover:border-white/[0.1] hover:bg-white/[0.04] active:cursor-grabbing"
    >
      <div className="mb-2 flex items-center gap-2">
        <form
          action={async () => {
            setOptimisticPriority(PRIORITY_CYCLE[optimisticPriority]);
            await cyclePriority(id);
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="submit"
            className={cn(
              "size-2 shrink-0 cursor-pointer rounded-full transition-all hover:scale-150 hover:ring-2 hover:ring-white/10",
              priorityDot[optimisticPriority]
            )}
            title={`${optimisticPriority} priority — click to cycle`}
          />
        </form>
        <h3 className="flex-1 text-[13px] font-medium leading-snug text-white/80 group-hover/card:text-white">
          {title}
        </h3>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {labels.slice(0, 2).map((l) => (
            <span
              key={l}
              className="rounded-full bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] text-white/40"
            >
              {l}
            </span>
          ))}
          {labels.length > 2 && (
            <span className="rounded-full bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-white/25">
              +{labels.length - 2}
            </span>
          )}
        </div>

        <form
          action={async () => {
            const currentIdx = ASSIGNEES.indexOf(optimisticAssignee);
            const nextAssignee =
              ASSIGNEES[(currentIdx + 1) % ASSIGNEES.length];
            setOptimisticAssignee(nextAssignee);
            await reassignTask(id, nextAssignee);
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="submit"
            className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/[0.06] font-mono text-[10px] text-white/40 transition-colors hover:bg-white/[0.12] hover:text-white/60"
            title={`${optimisticAssignee} — click to reassign`}
          >
            {optimisticAssignee[0]}
          </button>
        </form>
      </div>
    </div>
  );
}
