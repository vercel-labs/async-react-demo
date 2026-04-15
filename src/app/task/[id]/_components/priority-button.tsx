"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp } from "lucide-react";
import { cyclePriority } from "@/lib/actions";
import { cn } from "@/lib/utils";
import type { Priority } from "@/lib/data";

const priorityConfig: Record<Priority, { label: string; class: string }> = {
  low: { label: "Low", class: "text-blue-400/60 border-blue-400/15" },
  medium: { label: "Med", class: "text-amber-400/70 border-amber-400/20" },
  high: { label: "High", class: "text-red-400/80 border-red-400/25" },
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
