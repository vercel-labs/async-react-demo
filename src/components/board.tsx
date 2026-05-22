import { Suspense } from "react";
import { BoardClient } from "./board-client";
import { getTasks } from "@/data/queries/task";

export function Board({ label }: { label?: string }) {
  const tasksPromise = getTasks(label);

  return (
    <Suspense fallback={<BoardSkeleton />}>
      {tasksPromise.then((tasks) => (
        <BoardClient tasks={tasks} />
      ))}
    </Suspense>
  );
}

export function BoardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {["Todo", "In Progress", "Done"].map((title) => (
        <div
          key={title}
          className="flex flex-col rounded-xl border border-white/10 bg-white/[0.025]"
        >
          <div className="border-b border-white/10 px-4 py-3">
            <h2 className="text-[13px] font-medium text-white">{title}</h2>
          </div>
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
        </div>
      ))}
    </div>
  );
}
