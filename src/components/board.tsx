import { BoardClient } from "./board-client";
import { getTasks } from "@/lib/queries";
import type { Label } from "@/lib/data";

export async function Board({ label }: { label?: Label }) {
  const allTasks = await getTasks(label);

  const serialized = allTasks.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
  }));

  return <BoardClient key={label ?? "all"} initialTasks={serialized} />;
}
