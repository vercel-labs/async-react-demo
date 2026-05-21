"use client";

import { startTransition, useOptimistic } from "react";
import { reassignTask } from "@/data/actions/task";
import { cn } from "@/lib/utils";
import { ASSIGNEES, type Assignee } from "@/lib/data";

export function AssigneeSelect({
  taskId,
  assignee,
}: {
  taskId: string;
  assignee: Assignee;
}) {
  const [optimisticAssignee, setOptimisticAssignee] = useOptimistic(assignee);

  function handleAssign(newAssignee: Assignee) {
    if (newAssignee === optimisticAssignee) return;
    startTransition(async () => {
      setOptimisticAssignee(newAssignee);
      await reassignTask(taskId, newAssignee);
    });
  }

  return (
    <div className="flex gap-1">
      {ASSIGNEES.map((name) => (
        <button
          key={name}
          onClick={() => handleAssign(name)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[11px] transition-colors",
            optimisticAssignee === name
              ? "bg-white text-black hover:bg-white/90"
              : "text-white/55 hover:bg-white/[0.08] hover:text-white",
          )}
        >
          <span
            className={cn(
              "flex size-4 items-center justify-center rounded-full text-[9px]",
              optimisticAssignee === name
                ? "bg-black/15 text-black"
                : "bg-white/[0.12] text-white/70",
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
