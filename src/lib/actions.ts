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
): Promise<Status | null> {
  await delay(500);
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return null;
  task.status = newStatus;
  refresh();
  return task.status;
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

export async function createTask(data: {
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  assignee: string;
  labels: Label[];
}) {
  await delay(600);
  const task = {
    id: getNextTaskId(),
    title: data.title,
    description: data.description || "",
    status: data.status,
    priority: data.priority,
    labels: data.labels,
    assignee: (ASSIGNEES.includes(data.assignee as Assignee)
      ? data.assignee
      : ASSIGNEES[0]) as Assignee,
    createdAt: new Date(),
  };
  tasks.unshift(task);
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
