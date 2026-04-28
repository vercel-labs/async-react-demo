"use client";

import { startTransition, useOptimistic } from "react";
import { updateStatus } from "@/data/actions/task";
import { cn } from "@/lib/utils";
import type { Status } from "@/lib/data";

const statuses: { value: Status; label: string }[] = [
  { value: "todo", label: "Todo" },
  { value: "in-progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

export function StatusSelect({
  taskId,
  status,
}: {
  taskId: string;
  status: Status;
}) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(status);

  function handleStatus(newStatus: Status) {
    if (newStatus === optimisticStatus) return;
    startTransition(async () => {
      setOptimisticStatus(newStatus);
      await updateStatus(taskId, newStatus);
    });
  }

  return (
    <div className="flex gap-1">
      {statuses.map((s) => (
        <button
          key={s.value}
          onClick={() => handleStatus(s.value)}
          className={cn(
            "rounded-md px-2.5 py-1 font-mono text-[11px] transition-colors",
            optimisticStatus === s.value
              ? "bg-white/[0.1] text-white/80"
              : "text-white/30 hover:bg-white/[0.04] hover:text-white/50"
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
