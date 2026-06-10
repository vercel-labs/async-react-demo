"use client";

import { timeAgo } from "@/lib/utils";

export function RelativeTime({ date }: { date: Date | string }) {
  const d = date instanceof Date ? date : new Date(date);
  return <>{timeAgo(d)}</>;
}
