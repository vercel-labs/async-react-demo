"use client";

import { cn } from "@/lib/utils";

type Tab = {
  label: string;
  value: string;
};

type BottomNavProps = {
  tabs: Tab[];
  activeIndex: number;
  onChange: (value: string) => void;
};

export function BottomNav({ tabs, activeIndex, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-around px-4">
        {tabs.map((tab, i) => (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={cn(
              "flex-1 py-2 text-center font-mono text-xs transition-colors",
              i === activeIndex
                ? "text-white"
                : "text-white/40 hover:text-white/60"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
