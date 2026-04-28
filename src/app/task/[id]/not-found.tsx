import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TaskNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-white/[0.06]">
        <span className="text-lg text-white/40">?</span>
      </div>
      <h2 className="text-lg font-semibold tracking-tight">Task not found</h2>
      <p className="text-sm text-white/50">
        This task doesn&apos;t exist or may have been removed.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.08] px-4 py-2 text-[13px] font-medium text-white/70 transition-colors hover:bg-white/[0.12]"
      >
        <ArrowLeft className="size-3.5" />
        Back to board
      </Link>
    </div>
  );
}
