"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Status } from "@/lib/data";

const statuses: { value: Status; label: string }[] = [
  { value: "todo", label: "Todo" },
  { value: "in-progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

export function StatusSelect({
  taskId,
  initialStatus,
}: {
  taskId: string;
  initialStatus: Status;
}) {
  const [status, setStatus] = useState(initialStatus);

  async function handleStatus(newStatus: Status) {
    if (newStatus === status) return;
    const res = await fetch(`/api/tasks/${taskId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (data.status) setStatus(data.status);
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
