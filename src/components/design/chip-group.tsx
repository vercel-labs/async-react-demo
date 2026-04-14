"use client";

import { startTransition, useOptimistic } from "react";
import { cn } from "@/lib/utils";

type ChipGroupProps = {
  items: { label: string; value: string }[];
  value: string | null;
  changeAction?: (value: string | null) => void | Promise<void>;
  onChange?: (value: string | null) => void;
};

export function ChipGroup({
  items,
  value,
  changeAction,
  onChange,
}: ChipGroupProps) {
  const [optimisticValue, setOptimisticValue] = useOptimistic(value);
  const isPending = optimisticValue !== value;

  function handleClick(newValue: string | null) {
    if (changeAction) {
      startTransition(async () => {
        setOptimisticValue(newValue);
        await changeAction(newValue);
      });
    } else {
      onChange?.(newValue);
    }
  }

  return (
    <div
      className="flex flex-wrap gap-1.5"
      data-pending={isPending ? "" : undefined}
    >
      <button
        onClick={() => handleClick(null)}
        className={cn(
          "rounded-full border px-3 py-1 font-mono text-[11px] transition-all",
          optimisticValue === null
            ? "border-white/[0.12] bg-white/[0.06] text-white"
            : "border-transparent text-white/35 hover:text-white/55"
        )}
      >
        All
      </button>
      {items.map((item) => (
        <button
          key={item.value}
          onClick={() =>
            handleClick(item.value === optimisticValue ? null : item.value)
          }
          className={cn(
            "rounded-full border px-3 py-1 font-mono text-[11px] transition-all",
            item.value === optimisticValue
              ? "border-white/[0.12] bg-white/[0.06] text-white"
              : "border-transparent text-white/35 hover:text-white/55"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
