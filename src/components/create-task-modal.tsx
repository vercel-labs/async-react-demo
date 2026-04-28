"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    if (!title.trim()) return;

    setIsSubmitting(true);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: formData.get("description") as string,
        status: (formData.get("status") as Status) || "todo",
        priority: (formData.get("priority") as Priority) || "medium",
        assignee: (formData.get("assignee") as string) || ASSIGNEES[0],
        labels: formData.getAll("label") as Label[],
      }),
    });
    setIsSubmitting(false);
    setIsOpen(false);
    setFormKey((k) => k + 1);
    router.refresh();
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[13px] text-white/50 transition-colors hover:bg-white/[0.08] hover:text-white/70">
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
            <Button type="submit" disabled={isSubmitting} className="sm:w-auto w-full">
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

  const statuses: { value: Status; label: string }[] = [
    { value: "todo", label: "Todo" },
    { value: "in-progress", label: "In Progress" },
    { value: "done", label: "Done" },
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
        <label className="mb-1.5 block text-[12px] text-white/40">Title</label>
        <Input name="title" placeholder="Task title..." required />
      </div>

      <div>
        <label className="mb-1.5 block text-[12px] text-white/40">
          Description
        </label>
        <Input name="description" placeholder="Describe the task..." />
      </div>

      <div>
        <label className="mb-1.5 block text-[12px] text-white/40">Status</label>
        <div className="flex gap-1">
          {statuses.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStatus(s.value)}
              className={cn(
                "rounded-md px-2.5 py-1 font-mono text-[11px] transition-colors",
                status === s.value
                  ? "bg-white/[0.1] text-white/80"
                  : "text-white/30 hover:bg-white/[0.04] hover:text-white/50",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[12px] text-white/40">
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
                  ? "bg-white/[0.1] text-white/80"
                  : "text-white/30 hover:bg-white/[0.04] hover:text-white/50",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[12px] text-white/40">
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
                  ? "bg-white/[0.1] text-white/80"
                  : "text-white/30 hover:bg-white/[0.04] hover:text-white/50",
              )}
            >
              <span
                className={cn(
                  "flex size-4 items-center justify-center rounded-full text-[9px]",
                  assignee === name
                    ? "bg-white/[0.12] text-white/70"
                    : "bg-white/[0.06] text-white/30",
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
        <label className="mb-1.5 block text-[12px] text-white/40">Labels</label>
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
                  ? "bg-white/[0.1] text-white/70"
                  : "bg-white/[0.04] text-white/30 hover:bg-white/[0.06]",
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
