"use client";

import { useOptimistic } from "react";
import { ChevronUp } from "lucide-react";
import { cyclePriority } from "@/lib/actions";
import { PRIORITY_CYCLE } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { Priority } from "@/lib/data";

const priorityConfig: Record<Priority, { label: string; class: string }> = {
  low: { label: "Low", class: "text-blue-400/60 border-blue-400/15" },
  medium: { label: "Med", class: "text-amber-400/70 border-amber-400/20" },
  high: { label: "High", class: "text-red-400/80 border-red-400/25" },
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
        await cyclePriority(taskId);
      }}
    >
      <button
        type="submit"
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] transition-colors hover:bg-white/5",
          config.class
        )}
      >
        <ChevronUp className="size-3" />
        {config.label}
      </button>
    </form>
  );
}
