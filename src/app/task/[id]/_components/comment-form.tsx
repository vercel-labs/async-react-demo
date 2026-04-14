"use client";

import { useOptimistic, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";

export function CommentForm({
  addAction,
}: {
  addAction: (content: string) => Promise<void>;
}) {
  const [content, setContent] = useState("");
  const [isPending, setIsPending] = useOptimistic(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async () => {
        if (!content.trim()) return;
        setIsPending(true);
        const text = content;
        setContent("");
        await addAction(text);
      }}
      className="relative"
    >
      <input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            formRef.current?.requestSubmit();
          }
        }}
        placeholder="Write a comment..."
        className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] py-2.5 pl-4 pr-10 text-[13px] text-white placeholder:text-white/20 focus:border-white/[0.12] focus:outline-none"
        disabled={isPending}
      />
      <button
        type="submit"
        disabled={!content.trim() || isPending}
        className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md bg-white/[0.08] text-white/50 transition-colors hover:bg-white/[0.12] hover:text-white/70 disabled:opacity-0"
      >
        <ArrowUp className="size-3.5" />
      </button>
    </form>
  );
}
