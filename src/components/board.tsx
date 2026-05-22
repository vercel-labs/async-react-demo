import { Suspense } from "react";
import { BoardClient } from "./board-client";
import { getTasks } from "@/data/queries/task";
import { cn } from "@/lib/utils";
import type { Status } from "@/lib/data";

const columns: { status: Status; title: string; dot: string }[] = [
  { status: "todo", title: "Todo", dot: "bg-blue-400" },
  { status: "in-progress", title: "In Progress", dot: "bg-amber-400" },
  { status: "done", title: "Done", dot: "bg-emerald-400" },
];

export function Board({ label }: { label?: string }) {
  const tasksPromise = getTasks(label);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {columns.map((col) => (
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
          </div>
          <Suspense fallback={<CardSkeletons />}>
            {tasksPromise.then((tasks) => (
              <BoardClient status={col.status} tasks={tasks} />
            ))}
          </Suspense>
        </div>
      ))}
    </div>
  );
}

function CardSkeletons() {
  return (
    <div
      className="flex flex-1 flex-col gap-1.5 p-2"
      style={{ minHeight: "120px" }}
    >
      {[1, 2].map((i) => (
        <div
          key={i}
          className="h-[72px] animate-pulse rounded-lg bg-white/[0.05]"
        />
      ))}
    </div>
  );
}
