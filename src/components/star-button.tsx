"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { toggleStar } from "@/lib/actions";
import { cn } from "@/lib/utils";

export function StarButton({ taskId }: { taskId: string }) {
  const [hasStarred, setHasStarred] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/stars/${taskId}?t=${Date.now()}`)
      .then((r) => r.json())
      .then((data) => {
        setHasStarred(data.hasStarred);
        setIsLoading(false);
      });
  }, [taskId]);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setHasStarred(!hasStarred);
    await toggleStar(taskId);
  }

  if (isLoading) {
    return (
      <div className="size-4 animate-pulse rounded bg-white/10" />
    );
  }

  return (
    <button
      onClick={handleClick}
      className="group/star transition-colors"
      aria-label={hasStarred ? "Unstar task" : "Star task"}
    >
      <Star
        className={cn(
          "size-4 transition-colors",
          hasStarred
            ? "fill-white text-white"
            : "text-white/20 group-hover/star:text-white/40"
        )}
      />
    </button>
  );
}
