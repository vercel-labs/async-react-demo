"use client";

import { cn } from "@/lib/utils";

type ChipGroupProps = {
  items: { label: string; value: string }[];
  value: string | null;
  onChange?: (value: string | null) => void;
};

export function ChipGroup({ items, value, onChange }: ChipGroupProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        onClick={() => onChange?.(null)}
        className={cn(
          "rounded-full border px-3 py-1 font-mono text-[11px] transition-all",
          value === null
            ? "border-white/[0.12] bg-white/[0.06] text-white"
            : "border-transparent text-white/35 hover:text-white/55",
        )}
      >
        All
      </button>
      {items.map((item) => (
        <button
          key={item.value}
          onClick={() => onChange?.(item.value === value ? null : item.value)}
          className={cn(
            "rounded-full border px-3 py-1 font-mono text-[11px] transition-all",
            item.value === value
              ? "border-white/[0.12] bg-white/[0.06] text-white"
              : "border-transparent text-white/35 hover:text-white/55",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
