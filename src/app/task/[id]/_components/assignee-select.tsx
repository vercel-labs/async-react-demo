"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ASSIGNEES, type Assignee } from "@/lib/data";

export function AssigneeSelect({
  taskId,
  initialAssignee,
}: {
  taskId: string;
  initialAssignee: Assignee;
}) {
  const [assignee, setAssignee] = useState(initialAssignee);

  async function handleAssign(newAssignee: Assignee) {
    if (newAssignee === assignee) return;
    const res = await fetch(`/api/tasks/${taskId}/assignee`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignee: newAssignee }),
    });
    const data = await res.json();
    if (data.assignee) setAssignee(data.assignee);
  }

  return (
    <div className="flex gap-1">
      {ASSIGNEES.map((name) => (
        <button
          key={name}
          onClick={() => handleAssign(name)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[11px] transition-colors",
            assignee === name
              ? "bg-white/[0.1] text-white/80"
              : "text-white/30 hover:bg-white/[0.04] hover:text-white/50"
          )}
        >
          <span
            className={cn(
              "flex size-4 items-center justify-center rounded-full text-[9px]",
              assignee === name
                ? "bg-white/[0.12] text-white/70"
                : "bg-white/[0.06] text-white/30"
            )}
          >
            {name[0]}
          </span>
          {name}
        </button>
      ))}
    </div>
  );
}
