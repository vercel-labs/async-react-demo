import { NextResponse } from "next/server";
import {
  tasks,
  getNextTaskId,
  ASSIGNEES,
  type Assignee,
  type Label,
  type Priority,
  type Status,
} from "@/lib/data";
import { delay } from "@/lib/utils";

export async function POST(request: Request) {
  await delay(800);

  const body = await request.json();
  const { title, description, status, priority, assignee, labels } = body as {
    title: string;
    description: string;
    status: Status;
    priority: Priority;
    assignee: string;
    labels: Label[];
  };

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const task = {
    id: getNextTaskId(),
    title: title.trim(),
    description: description?.trim() ?? "",
    status: status ?? "todo",
    priority: priority ?? "medium",
    labels: labels ?? [],
    assignee: (ASSIGNEES.includes(assignee as Assignee)
      ? assignee
      : "Sarah") as Assignee,
    createdAt: new Date(),
  };

  tasks.push(task);
  return NextResponse.json(task, { status: 201 });
}
