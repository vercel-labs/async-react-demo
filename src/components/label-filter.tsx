"use client";

import { useRouter, useSearchParams } from "next/navigation";
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
  const current = searchParams.get("label") ?? null;

  function handleChange(value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("label", value);
    } else {
      params.delete("label");
    }
    router.push(`/?${params.toString()}`);
  }

  return <ChipGroup items={labels} value={current} onChange={handleChange} />;
}
