"use client";

import { startTransition, useOptimistic, useState } from "react";
import { updateStatus } from "@/lib/actions";
import { TaskCard } from "./task-card";
import { cn } from "@/lib/utils";
import type { Assignee, Label, Priority, Status } from "@/lib/data";

export type SerializedTask = {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  labels: Label[];
  assignee: Assignee;
  createdAt: string;
};

const columns: { status: Status; title: string }[] = [
  { status: "todo", title: "Todo" },
  { status: "in-progress", title: "In Progress" },
  { status: "done", title: "Done" },
];

export function BoardClient({
  initialTasks,
}: {
  initialTasks: SerializedTask[];
}) {
  const [optimisticTasks, moveTask] = useOptimistic(
    initialTasks,
    (state, { id, newStatus }: { id: string; newStatus: Status }) =>
      state.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
  );
  const [dragOverColumn, setDragOverColumn] = useState<Status | null>(null);

  function handleDrop(targetStatus: Status, taskId: string) {
    startTransition(async () => {
      moveTask({ id: taskId, newStatus: targetStatus });
      await updateStatus(taskId, targetStatus);
    });
    setDragOverColumn(null);
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {columns.map((col) => {
        const columnTasks = optimisticTasks.filter(
          (t) => t.status === col.status
        );

        return (
          <div
            key={col.status}
            className="flex flex-col rounded-xl border border-white/[0.06] bg-white/[0.015]"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <h2 className="text-[13px] font-medium text-white/60">
                {col.title}
              </h2>
              <span className="font-mono text-[11px] text-white/25">
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
                  ? "bg-white/[0.06] ring-1 ring-inset ring-white/[0.12]"
                  : ""
              )}
              style={{
                maxHeight: "calc(100vh - 260px)",
                minHeight: "120px",
              }}
            >
              {columnTasks.length === 0 && (
                <p className="py-8 text-center text-[12px] text-white/15">
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
