"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const statuses = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Archived", value: "archived" },
];

export function StatusTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("status") ?? "all";

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="flex gap-1 rounded-lg bg-white/5 p-1">
      {statuses.map((s) => (
        <button
          key={s.value}
          onClick={() => handleChange(s.value)}
          className={cn(
            "rounded-md px-3 py-1.5 font-mono text-xs transition-colors",
            current === s.value
              ? "bg-white/10 text-white"
              : "text-white/40 hover:text-white/60"
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
