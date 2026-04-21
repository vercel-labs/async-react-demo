import { NextResponse } from "next/server";
import { tasks, ASSIGNEES, type Assignee } from "@/lib/data";
import { delay } from "@/lib/utils";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await delay(500);

  const task = tasks.find((t) => t.id === id);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const { assignee } = (await request.json()) as { assignee: string };
  if (!ASSIGNEES.includes(assignee as Assignee)) {
    return NextResponse.json({ error: "Invalid assignee" }, { status: 400 });
  }

  task.assignee = assignee as Assignee;
  return NextResponse.json({ assignee: task.assignee });
}
