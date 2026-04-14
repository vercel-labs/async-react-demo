"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp } from "lucide-react";
import { cyclePriority } from "@/lib/actions";
import { cn } from "@/lib/utils";
import type { Priority } from "@/lib/data";

const priorityConfig: Record<Priority, { label: string; class: string }> = {
  low: { label: "Low", class: "text-white/40 border-white/10" },
  medium: { label: "Med", class: "text-white/60 border-white/15" },
  high: { label: "High", class: "text-white/80 border-white/20" },
};

export function PriorityButton({
  taskId,
  initialPriority,
}: {
  taskId: string;
  initialPriority: Priority;
}) {
  const router = useRouter();
  const [priority, setPriority] = useState(initialPriority);

  async function handleClick() {
    const next = await cyclePriority(taskId);
    if (next) setPriority(next);
    router.refresh();
  }

  const config = priorityConfig[priority];

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] transition-colors hover:bg-white/5",
        config.class
      )}
    >
      <ChevronUp className="size-3" />
      {config.label}
    </button>
  );
}
