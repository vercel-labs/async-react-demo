import { Suspense } from "react";
import { Board, BoardSkeleton } from "@/components/board";
import { LabelFilter } from "@/components/label-filter";
import { CreateTaskModal } from "@/components/create-task-modal";
import { getTasks } from "@/lib/queries";
import type { Label } from "@/lib/data";

async function TaskCount({ label }: { label?: Label }) {
  const allTasks = await getTasks(label);
  return (
    <span className="font-mono text-xs">{allTasks.length}</span>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ label?: string }>;
}) {
  const { label } = await searchParams;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Board</h1>
          <p className="mt-1 text-sm text-white/40">
            <Suspense
              fallback={<span className="font-mono text-xs">–</span>}
            >
              <TaskCount label={label as Label | undefined} />
            </Suspense>{" "}
            tasks
            {label ? ` · ${label}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LabelFilter />
          <CreateTaskModal />
        </div>
      </div>

      <Suspense fallback={<BoardSkeleton />}>
        <Board label={label as Label | undefined} />
      </Suspense>
    </div>
  );
}
