"use client";

import { cn } from "@/lib/utils";

type ChipGroupProps = {
  items: { label: string; value: string }[];
  value: string | null;
  onChange: (value: string | null) => void;
};

export function ChipGroup({ items, value, onChange }: ChipGroupProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange(null)}
        className={cn(
          "rounded-full px-3 py-1 font-mono text-xs transition-colors",
          value === null
            ? "bg-white/15 text-white"
            : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
        )}
      >
        All
      </button>
      {items.map((item) => (
        <button
          key={item.value}
          onClick={() => onChange(item.value === value ? null : item.value)}
          className={cn(
            "rounded-full px-3 py-1 font-mono text-xs transition-colors",
            item.value === value
              ? "bg-white/15 text-white"
              : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
