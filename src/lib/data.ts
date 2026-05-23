export type Status = "todo" | "in-progress" | "done";
export type Priority = "low" | "medium" | "high";
export type Label =
  | "design"
  | "frontend"
  | "backend"
  | "devops"
  | "bug"
  | "feature";

export const ASSIGNEES = ["Sarah", "Marcus", "Elena", "Jordan"] as const;
export type Assignee = (typeof ASSIGNEES)[number];

export const PRIORITY_CYCLE: Record<Priority, Priority> = {
  low: "medium",
  medium: "high",
  high: "low",
};

export type Task = {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  labels: Label[];
  assignee: Assignee;
  createdAt: Date;
};

export type Comment = {
  id: string;
  taskId: string;
  userName: string;
  content: string;
  createdAt: Date;
};

export const LABELS: Label[] = [
  "design",
  "frontend",
  "backend",
  "devops",
  "bug",
  "feature",
];
