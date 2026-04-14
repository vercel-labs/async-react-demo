"use client";

import { useState } from "react";
import { ArrowUpCircle } from "lucide-react";
import { upvoteTask } from "@/lib/actions";
import { cn } from "@/lib/utils";

export function VoteButton({
  taskId,
  initialCount,
  initialHasVoted,
}: {
  taskId: string;
  initialCount: number;
  initialHasVoted: boolean;
}) {
  const [count, setCount] = useState(initialCount);
  const [hasVoted, setHasVoted] = useState(initialHasVoted);

  async function handleClick() {
    if (hasVoted) return;
    await upvoteTask(taskId);
    setCount((c) => c + 1);
    setHasVoted(true);
  }

  return (
    <button
      onClick={handleClick}
      disabled={hasVoted}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-4 py-2 font-mono text-sm transition-colors",
        hasVoted
          ? "border-white/10 bg-white/5 text-white/40"
          : "border-white/10 bg-white/5 text-white hover:bg-white/10"
      )}
    >
      <ArrowUpCircle className="size-4" />
      <span>{count}</span>
      {!hasVoted && <span className="text-white/50">Upvote</span>}
    </button>
  );
}
