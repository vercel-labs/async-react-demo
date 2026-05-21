"use client";

import { useOptimistic } from "react";
import { toast } from "sonner";
import { cyclePriority } from "@/data/actions/task";
import { PRIORITY_CYCLE } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { Priority } from "@/lib/data";

const priorityConfig: Record<
  Priority,
  { label: string; bars: number; class: string }
> = {
  low: {
    label: "Low",
    bars: 1,
    class:
      "text-white/70 border-white/15 bg-white/[0.04] hover:bg-white/[0.08]",
  },
  medium: {
    label: "Med",
    bars: 2,
    class: "text-white border-white/25 bg-white/[0.08] hover:bg-white/[0.14]",
  },
  high: {
    label: "High",
    bars: 3,
    class: "text-black border-white bg-white hover:bg-white/90",
  },
};

export function PriorityButton({
  taskId,
  priority,
}: {
  taskId: string;
  priority: Priority;
}) {
  const [optimisticPriority, setOptimisticPriority] = useOptimistic(priority);

  const config = priorityConfig[optimisticPriority];

  return (
    <form
      action={async () => {
        setOptimisticPriority((current) => PRIORITY_CYCLE[current]);
        try {
          await cyclePriority(taskId);
        } catch {
          toast.error("Failed to update priority");
        }
      }}
    >
      <button
        type="submit"
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] transition-colors",
          config.class,
        )}
      >
        <span className="inline-flex items-end gap-px">
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn(
                "w-[3px] rounded-[1px]",
                i === 1 ? "h-[5px]" : i === 2 ? "h-[7px]" : "h-[9px]",
                i <= config.bars ? "bg-current" : "bg-current opacity-20",
              )}
            />
          ))}
        </span>
        {config.label}
      </button>
    </form>
  );
}
