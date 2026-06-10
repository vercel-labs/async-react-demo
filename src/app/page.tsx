import { Suspense } from "react";
import { Board, BoardSkeleton } from "@/features/task/components/board";
import {
  LabelFilter,
  LabelFilterSkeleton,
} from "@/features/task/components/label-filter";
import { CreateTaskModal } from "@/features/task/components/create-task-modal";
import { getTasks } from "@/features/task/task-queries";

export const prefetch = "allow-runtime";

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ label?: string }>;
}) {
  return (
    <div className="group mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Board</h1>
          <p className="mt-1 text-sm text-white/60">
            <Suspense fallback={<span className="font-mono text-xs">–</span>}>
              <TaskCount searchParams={searchParams} />
            </Suspense>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Suspense fallback={<LabelFilterSkeleton />}>
            <LabelFilter />
          </Suspense>
          <CreateTaskModal />
        </div>
      </div>

      <div className="group-has-data-pending:opacity-50 transition-opacity">
        <Suspense fallback={<BoardSkeleton />}>
          {searchParams.then(({ label }) => (
            <Board tasksPromise={getTasks(label)} />
          ))}
        </Suspense>
      </div>
    </div>
  );
}

async function TaskCount({
  searchParams,
}: {
  searchParams: Promise<{ label?: string }>;
}) {
  const { label } = await searchParams;
  const allTasks = await getTasks(label);
  return (
    <>
      <span className="font-mono text-xs">{allTasks.length}</span> tasks
      {label ? ` · ${label}` : ""}
    </>
  );
}
