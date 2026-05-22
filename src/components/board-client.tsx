"use client";

import { startTransition, useOptimistic, useState } from "react";
import { toast } from "sonner";
import { updateStatus } from "@/data/actions/task";
import { TaskCard } from "./task-card";
import { cn } from "@/lib/utils";
import type { Assignee, Label, Priority, Status } from "@/lib/data";

type SerializedTask = {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  labels: Label[];
  assignee: Assignee;
  createdAt: string;
};

const columns: { status: Status; title: string; dot: string }[] = [
  { status: "todo", title: "Todo", dot: "bg-blue-400" },
  { status: "in-progress", title: "In Progress", dot: "bg-amber-400" },
  { status: "done", title: "Done", dot: "bg-emerald-400" },
];

export function BoardClient({ tasks }: { tasks: SerializedTask[] }) {
  const [optimisticTasks, moveTask] = useOptimistic(
    tasks,
    (currentTasks, action: { taskId: string; status: Status }) =>
      currentTasks.map((t) =>
        t.id === action.taskId ? { ...t, status: action.status } : t,
      ),
  );
  const [dragOverColumn, setDragOverColumn] = useState<Status | null>(null);

  function handleDrop(targetStatus: Status, taskId: string) {
    startTransition(async () => {
      moveTask({ taskId, status: targetStatus });
      setDragOverColumn(null);
      try {
        await updateStatus(taskId, targetStatus);
      } catch {
        toast.error("Failed to move task");
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {columns.map((col) => {
        const columnTasks = optimisticTasks.filter(
          (t) => t.status === col.status,
        );

        return (
          <div
            key={col.status}
            className="flex flex-col rounded-xl border border-white/10 bg-white/[0.025]"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className={cn("size-2 rounded-full", col.dot)} />
                <h2 className="text-[13px] font-medium text-white">
                  {col.title}
                </h2>
              </div>
              <span className="font-mono text-[11px] text-white/50">
                {columnTasks.length}
              </span>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setDragOverColumn(col.status);
              }}
              onDragLeave={(e) => {
                if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                setDragOverColumn(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const taskId = e.dataTransfer.getData("text/plain");
                if (taskId) handleDrop(col.status, taskId);
              }}
              className={cn(
                "flex flex-1 flex-col gap-1.5 overflow-y-auto rounded-b-xl p-2 transition-colors",
                dragOverColumn === col.status
                  ? "bg-white/[0.08] ring-1 ring-inset ring-white/25"
                  : "",
              )}
              style={{
                maxHeight: "calc(100vh - 260px)",
                minHeight: "120px",
              }}
            >
              {columnTasks.length === 0 && (
                <p className="py-8 text-center text-[12px] text-white/30">
                  No tasks
                </p>
              )}
              {columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  id={task.id}
                  title={task.title}
                  priority={task.priority}
                  labels={task.labels}
                  assignee={task.assignee}
                  status={task.status}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
