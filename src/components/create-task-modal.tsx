"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type OptionsData = {
  assignees: string[];
  labels: string[];
};

export function CreateTaskModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [assignee, setAssignee] = useState("");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [options, setOptions] = useState<OptionsData | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoadingOptions(true); // eslint-disable-line react-hooks/set-state-in-effect -- intentional legacy pattern for demo
    fetch(`/api/options?t=${Date.now()}`)
      .then((res) => res.json())
      .then((data: OptionsData) => {
        setOptions(data);
        if (data.assignees.length > 0 && !assignee) {
          setAssignee(data.assignees[0]);
        }
        setIsLoadingOptions(false);
      });
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleLabel(label: string) {
    setSelectedLabels((prev) =>
      prev.includes(label)
        ? prev.filter((l) => l !== label)
        : [...prev, label]
    );
  }

  async function handleSubmit() {
    if (!title.trim() || isSubmitting) return;
    setIsSubmitting(true);

    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        status,
        priority,
        assignee,
        labels: selectedLabels,
      }),
    });

    setTitle("");
    setDescription("");
    setStatus("todo");
    setPriority("medium");
    setAssignee("");
    setSelectedLabels([]);
    setIsSubmitting(false);
    setIsOpen(false);

    router.refresh();
  }

  const statuses = [
    { value: "todo", label: "Todo" },
    { value: "in-progress", label: "In Progress" },
    { value: "done", label: "Done" },
  ];

  const priorities = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Med" },
    { value: "high", label: "High" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[13px] text-white/50 transition-colors hover:bg-white/[0.08] hover:text-white/70">
        <Plus className="size-3.5" />
        New Task
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>

        {isLoadingOptions ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-8 animate-pulse rounded-lg bg-white/[0.04]"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4 py-1">
            <div>
              <label className="mb-1.5 block text-[12px] text-white/40">
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title..."
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-white placeholder:text-white/20 focus:border-white/[0.15] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] text-white/40">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the task..."
                rows={2}
                className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-white placeholder:text-white/20 focus:border-white/[0.15] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] text-white/40">
                Status
              </label>
              <div className="flex gap-1">
                {statuses.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setStatus(s.value)}
                    className={cn(
                      "rounded-md px-2.5 py-1 font-mono text-[11px] transition-colors",
                      status === s.value
                        ? "bg-white/[0.1] text-white/80"
                        : "text-white/30 hover:bg-white/[0.04] hover:text-white/50"
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
                    onClick={() => setPriority(p.value)}
                    className={cn(
                      "rounded-md px-2.5 py-1 font-mono text-[11px] transition-colors",
                      priority === p.value
                        ? "bg-white/[0.1] text-white/80"
                        : "text-white/30 hover:bg-white/[0.04] hover:text-white/50"
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
                {(options?.assignees ?? []).map((name) => (
                  <button
                    key={name}
                    onClick={() => setAssignee(name)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[11px] transition-colors",
                      assignee === name
                        ? "bg-white/[0.1] text-white/80"
                        : "text-white/30 hover:bg-white/[0.04] hover:text-white/50"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-4 items-center justify-center rounded-full text-[9px]",
                        assignee === name
                          ? "bg-white/[0.12] text-white/70"
                          : "bg-white/[0.06] text-white/30"
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
              <label className="mb-1.5 block text-[12px] text-white/40">
                Labels
              </label>
              <div className="flex flex-wrap gap-1">
                {(options?.labels ?? []).map((label) => (
                  <button
                    key={label}
                    onClick={() => toggleLabel(label)}
                    className={cn(
                      "rounded-full px-2.5 py-0.5 font-mono text-[10px] capitalize transition-colors",
                      selectedLabels.includes(label)
                        ? "bg-white/[0.1] text-white/70"
                        : "bg-white/[0.04] text-white/30 hover:bg-white/[0.06]"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || isSubmitting || isLoadingOptions}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-[13px] font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-40 sm:w-auto"
          >
            {isSubmitting ? "Creating..." : "Create Task"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
