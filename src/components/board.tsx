import { BoardClient } from "./board-client";
import { getTasks } from "@/data/queries/task";

export async function Board({ label }: { label?: string }) {
  const tasks = await getTasks(label);
  return <BoardClient key={label ?? "all"} tasks={tasks} />;
}
