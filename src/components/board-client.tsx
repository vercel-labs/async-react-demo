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

export function BoardClient({
  status,
  tasks,
}: {
  status: Status;
  tasks: SerializedTask[];
}) {
  const [optimisticTasks, moveTask] = useOptimistic(
    tasks,
    (currentTasks, action: { taskId: string; status: Status }) =>
      currentTasks.map((t) =>
        t.id === action.taskId ? { ...t, status: action.status } : t,
      ),
  );
  const [dragOver, setDragOver] = useState(false);

  function handleDrop(taskId: string) {
    startTransition(async () => {
      moveTask({ taskId, status });
      setDragOver(false);
      try {
        await updateStatus(taskId, status);
      } catch {
        toast.error("Failed to move task");
      }
    });
  }

  const columnTasks = optimisticTasks.filter((t) => t.status === status);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOver(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("text/plain");
        if (taskId) handleDrop(taskId);
      }}
      className={cn(
        "flex flex-1 flex-col gap-1.5 overflow-y-auto rounded-b-xl p-2 transition-colors",
        dragOver ? "bg-white/[0.08] ring-1 ring-inset ring-white/25" : "",
      )}
      style={{
        maxHeight: "calc(100vh - 260px)",
        minHeight: "120px",
      }}
    >
      <div className="flex items-center justify-between px-2 pb-1">
        <span className="font-mono text-[11px] text-white/50">
          {columnTasks.length}
        </span>
      </div>
      {columnTasks.length === 0 && (
        <p className="py-8 text-center text-[12px] text-white/30">No tasks</p>
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
  );
}
