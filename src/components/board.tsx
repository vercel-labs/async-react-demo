import { BoardClient } from "./board-client";
import { getTasks } from "@/data/queries/task";
import type { Label } from "@/lib/data";

export async function Board({ label }: { label?: Label }) {
  const allTasks = await getTasks(label);

  const serialized = allTasks.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
  }));

  return <BoardClient tasks={serialized} />;
}

export function BoardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {["Todo", "In Progress", "Done"].map((title) => (
        <div
          key={title}
          className="flex flex-col rounded-xl border border-white/[0.06] bg-white/[0.015]"
        >
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <h2 className="text-[13px] font-medium text-white/60">{title}</h2>
          </div>
          <div className="flex flex-1 flex-col gap-1.5 p-2" style={{ minHeight: "120px" }}>
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-[72px] animate-pulse rounded-lg bg-white/[0.03]"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
