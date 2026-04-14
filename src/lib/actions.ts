"use server";

import { refresh } from "next/cache";
import {
  comments,
  getNextCommentId,
  getNextTaskId,
  tasks,
  ASSIGNEES,
  PRIORITY_CYCLE,
  type Assignee,
  type Comment,
  type Label,
  type Priority,
  type Status,
  type Task,
} from "./data";
import { delay } from "./utils";

const DEFAULT_USER = "You";

export async function cyclePriority(
  taskId: string
): Promise<Priority | null> {
  await delay(500);
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return null;
  task.priority = PRIORITY_CYCLE[task.priority];
  refresh();
  return task.priority;
}

export async function updateStatus(
  taskId: string,
  newStatus: Status
): Promise<{ error: string } | { status: Status }> {
  await delay(500);
  if (Math.random() < 0.3) {
    return { error: "Failed to update status — server error" };
  }
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return { error: "Task not found" };
  task.status = newStatus;
  refresh();
  return { status: task.status };
}

export async function reassignTask(
  taskId: string,
  newAssignee: string
): Promise<Assignee | null> {
  await delay(500);
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return null;
  if (!ASSIGNEES.includes(newAssignee as Assignee)) return null;
  task.assignee = newAssignee as Assignee;
  refresh();
  return task.assignee;
}

export async function createTask(newTask: {
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  assignee: string;
  labels: Label[];
}): Promise<Task> {
  await delay(800);
  if (!newTask.title?.trim()) {
    throw new Error("Title is required");
  }

  const task: Task = {
    id: getNextTaskId(),
    title: newTask.title.trim(),
    description: newTask.description?.trim() ?? "",
    status: newTask.status ?? "todo",
    priority: newTask.priority ?? "medium",
    labels: newTask.labels ?? [],
    assignee: (ASSIGNEES.includes(newTask.assignee as Assignee)
      ? newTask.assignee
      : "Sarah") as Assignee,
    createdAt: new Date(),
  };

  tasks.push(task);
  refresh();
  return task;
}

export async function addComment(
  taskId: string,
  content: string
): Promise<Comment | null> {
  await delay(800);
  const userName = DEFAULT_USER;
  if (!content.trim()) return null;

  const comment: Comment = {
    id: getNextCommentId(),
    taskId,
    userName,
    content: content.trim(),
    createdAt: new Date(),
  };
  comments.push(comment);
  refresh();
  return comment;
}

export async function deleteComment(commentId: string) {
  await delay(500);
  const userName = DEFAULT_USER;

  const idx = comments.findIndex(
    (c) => c.id === commentId && c.userName === userName
  );
  if (idx >= 0) {
    comments.splice(idx, 1);
  }
  refresh();
}
