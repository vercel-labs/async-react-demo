"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createTask } from "@/features/task/task-actions";
import {
  ASSIGNEES,
  LABELS,
  type Assignee,
  type Label,
  type Priority,
  type Status,
} from "@/lib/data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function CreateTaskModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    if (!title.trim()) return;

    setIsSubmitting(true);
    await createTask({
      title,
      description: formData.get("description") as string,
      status: (formData.get("status") as Status) || "todo",
      priority: (formData.get("priority") as Priority) || "medium",
      assignee: (formData.get("assignee") as string) || ASSIGNEES[0],
      labels: formData.getAll("label") as Label[],
    });
    setIsSubmitting(false);
    setIsOpen(false);
    setFormKey((k) => k + 1);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/15 bg-white/[0.08] px-3 py-1.5 text-[13px] text-white transition-colors hover:bg-white/[0.14] hover:border-white/25">
        <Plus className="size-3.5" />
        New Task
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <CreateTaskFormFields key={formKey} />

          <DialogFooter className="mt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="sm:w-auto w-full"
            >
              {isSubmitting ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateTaskFormFields() {
  const [status, setStatus] = useState<Status>("todo");
  const [priority, setPriority] = useState<Priority>("medium");
  const [assignee, setAssignee] = useState<Assignee>(ASSIGNEES[0]);
  const [selectedLabels, setSelectedLabels] = useState<Label[]>([]);

  const statuses: { value: Status; label: string; active: string }[] = [
    {
      value: "todo",
      label: "Todo",
      active: "bg-blue-500/15 text-blue-300 ring-1 ring-inset ring-blue-400/25",
    },
    {
      value: "in-progress",
      label: "In Progress",
      active:
        "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-400/25",
    },
    {
      value: "done",
      label: "Done",
      active:
        "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/25",
    },
  ];

  const priorities: { value: Priority; label: string }[] = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Med" },
    { value: "high", label: "High" },
  ];

  return (
    <div className="space-y-4 py-1">
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="priority" value={priority} />
      <input type="hidden" name="assignee" value={assignee} />
      {selectedLabels.map((l) => (
        <input key={l} type="hidden" name="label" value={l} />
      ))}

      <div>
        <label className="mb-1.5 block text-[12px] text-white/65">Title</label>
        <Input name="title" placeholder="Task title..." required />
      </div>

      <div>
        <label className="mb-1.5 block text-[12px] text-white/65">
          Description
        </label>
        <Input name="description" placeholder="Describe the task..." />
      </div>

      <div>
        <label className="mb-1.5 block text-[12px] text-white/65">Status</label>
        <div className="flex gap-1">
          {statuses.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStatus(s.value)}
              className={cn(
                "rounded-md px-2.5 py-1 font-mono text-[11px] transition-colors",
                status === s.value
                  ? s.active
                  : "text-white/55 hover:bg-white/[0.08] hover:text-white",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[12px] text-white/65">
          Priority
        </label>
        <div className="flex gap-1">
          {priorities.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPriority(p.value)}
              className={cn(
                "rounded-md px-2.5 py-1 font-mono text-[11px] transition-colors",
                priority === p.value
                  ? "bg-white text-black hover:bg-white/90"
                  : "text-white/55 hover:bg-white/[0.08] hover:text-white",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[12px] text-white/65">
          Assignee
        </label>
        <div className="flex flex-wrap gap-1">
          {ASSIGNEES.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setAssignee(name)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[11px] transition-colors",
                assignee === name
                  ? "bg-white text-black hover:bg-white/90"
                  : "text-white/55 hover:bg-white/[0.08] hover:text-white",
              )}
            >
              <span
                className={cn(
                  "flex size-4 items-center justify-center rounded-full text-[9px]",
                  assignee === name
                    ? "bg-black/15 text-black"
                    : "bg-white/[0.12] text-white/70",
                )}
              >
                {name[0]}
              </span>
              {name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[12px] text-white/65">Labels</label>
        <div className="flex flex-wrap gap-1">
          {LABELS.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() =>
                setSelectedLabels((prev) =>
                  prev.includes(label)
                    ? prev.filter((l) => l !== label)
                    : [...prev, label],
                )
              }
              className={cn(
                "rounded-full px-2.5 py-0.5 font-mono text-[10px] capitalize transition-colors",
                selectedLabels.includes(label)
                  ? "bg-white text-black hover:bg-white/90"
                  : "bg-white/[0.08] text-white/65 hover:bg-white/[0.14] hover:text-white",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
