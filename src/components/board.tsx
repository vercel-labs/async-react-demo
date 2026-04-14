import { BoardClient } from "./board-client";
import { getTasks } from "@/lib/queries";
import type { Label } from "@/lib/data";

export async function Board({ label }: { label?: Label }) {
  const allTasks = await getTasks(label);

  const serialized = allTasks.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
  }));

  return <BoardClient initialTasks={serialized} />;
}

export function BoardSkeleton() {
  const columns = ["Todo", "In Progress", "Done"];
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {columns.map((title) => (
        <div
          key={title}
          className="flex flex-col rounded-xl border border-white/[0.06] bg-white/[0.015]"
        >
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <h2 className="text-[13px] font-medium text-white/60">{title}</h2>
            <span className="font-mono text-[11px] text-white/25">–</span>
          </div>
          <div className="flex flex-1 flex-col gap-1.5 p-2" style={{ minHeight: "120px" }}>
            {Array.from({ length: 3 }).map((_, i) => (
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
