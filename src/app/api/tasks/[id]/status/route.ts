import { NextResponse } from "next/server";
import { tasks, type Status } from "@/lib/data";
import { delay } from "@/lib/utils";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await delay(500);

  if (Math.random() < 0.3) {
    return NextResponse.json(
      { error: "Failed to update status — server error" },
      { status: 500 }
    );
  }

  const task = tasks.find((t) => t.id === id);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const { status } = (await request.json()) as { status: Status };
  task.status = status;
  return NextResponse.json({ status: task.status });
}
