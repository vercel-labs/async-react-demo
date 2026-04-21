import { NextResponse } from "next/server";
import { tasks, type Priority } from "@/lib/data";
import { delay } from "@/lib/utils";

const priorityCycle: Record<Priority, Priority> = {
  low: "medium",
  medium: "high",
  high: "low",
};

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await delay(500);

  const task = tasks.find((t) => t.id === id);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  task.priority = priorityCycle[task.priority];
  return NextResponse.json({ priority: task.priority });
}
