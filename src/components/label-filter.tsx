"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ChipGroup } from "./design/chip-group";

const labels = [
  { label: "Design", value: "design" },
  { label: "Frontend", value: "frontend" },
  { label: "Backend", value: "backend" },
  { label: "DevOps", value: "devops" },
  { label: "Bug", value: "bug" },
  { label: "Feature", value: "feature" },
];

export function LabelFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const current = searchParams.get("label") ?? null;

  function filterAction(value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("label", value);
    } else {
      params.delete("label");
    }
    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  }

  return (
    <div data-pending={isPending ? "" : undefined}>
      <ChipGroup items={labels} value={current} changeAction={filterAction} />
    </div>
  );
}

export function LabelFilterSkeleton() {
  return (
    <div className="h-[30px] w-16 animate-pulse rounded-full bg-white/[0.06]" />
  );
}
