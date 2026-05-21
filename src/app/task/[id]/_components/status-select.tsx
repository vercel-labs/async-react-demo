"use client";

import { updateStatus } from "@/data/actions/task";
import { cn } from "@/lib/utils";
import type { Status } from "@/lib/data";

const statuses: { value: Status; label: string; active: string }[] = [
  {
    value: "todo",
    label: "Todo",
    active: "bg-blue-500/15 text-blue-300 ring-1 ring-inset ring-blue-400/25",
  },
  {
    value: "in-progress",
    label: "In Progress",
    active:
      "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-400/25",
  },
  {
    value: "done",
    label: "Done",
    active:
      "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/25",
  },
];

export function StatusSelect({
  taskId,
  status,
}: {
  taskId: string;
  status: Status;
}) {
  async function handleStatus(newStatus: Status) {
    if (newStatus === status) return;
    await updateStatus(taskId, newStatus);
  }

  return (
    <div className="flex gap-1">
      {statuses.map((s) => (
        <button
          key={s.value}
          onClick={() => handleStatus(s.value)}
          className={cn(
            "rounded-md px-2.5 py-1 font-mono text-[11px] transition-colors",
            status === s.value
              ? s.active
              : "text-white/55 hover:bg-white/[0.08] hover:text-white",
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
