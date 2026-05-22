"use client";

import Link from "next/link";
import { cyclePriority } from "@/data/actions/task";
import { cn } from "@/lib/utils";
import type { Assignee, Label, Priority, Status } from "@/lib/data";

const priorityIcon: Record<Priority, { bars: number; color: string }> = {
  low: { bars: 1, color: "text-white/40" },
  medium: { bars: 2, color: "text-white/70" },
  high: { bars: 3, color: "text-white" },
};

function PriorityBars({
  level,
  className,
}: {
  level: Priority;
  className?: string;
}) {
  const { bars, color } = priorityIcon[level];
  return (
    <span
      className={cn("inline-flex items-end gap-px", color, className)}
      aria-label={`${level} priority`}
    >
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn(
            "w-[3px] rounded-[1px]",
            i === 1 ? "h-[6px]" : i === 2 ? "h-[9px]" : "h-[12px]",
            i <= bars ? "bg-current" : "bg-current opacity-20",
          )}
        />
      ))}
    </span>
  );
}

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
  async function handlePriority(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await cyclePriority(id);
  }

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  }

  return (
    <Link
      href={`/task/${id}`}
      draggable
      onDragStart={handleDragStart}
      className="group/card block cursor-default rounded-lg border border-white/[0.08] bg-white/[0.03] p-3 transition-all hover:border-white/20 hover:bg-white/[0.06]"
    >
      <div className="mb-2 flex items-center gap-2">
        <button
          onClick={handlePriority}
          className="shrink-0 cursor-pointer rounded-md p-1 transition-all hover:bg-white/10"
          title={`${priority} priority — click to cycle`}
        >
          <PriorityBars level={priority} />
        </button>
        <h3 className="flex-1 text-[13px] font-medium leading-snug text-white group-hover/card:text-white">
          {title}
        </h3>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {labels.slice(0, 2).map((l) => (
            <span
              key={l}
              className="rounded-full bg-white/[0.1] px-2 py-0.5 font-mono text-[10px] text-white/75"
            >
              {l}
            </span>
          ))}
          {labels.length > 2 && (
            <span className="rounded-full bg-white/[0.08] px-1.5 py-0.5 font-mono text-[10px] text-white/55">
              +{labels.length - 2}
            </span>
          )}
        </div>

        <span
          className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/[0.12] font-mono text-[10px] text-white/80"
          title={assignee}
        >
          {assignee[0]}
        </span>
      </div>
    </Link>
  );
}
