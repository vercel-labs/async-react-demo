import { Suspense } from "react";
import { Board, BoardSkeleton } from "@/components/board";
import { LabelFilter } from "@/components/label-filter";
import { CreateTaskModal } from "@/components/create-task-modal";
import { getTasks } from "@/data/queries/task";
import type { Label } from "@/lib/data";

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
          <p className="mt-1 text-sm text-white/40">
            <Suspense fallback={<span className="font-mono text-xs">–</span>}>
              <TaskCount searchParams={searchParams} />
            </Suspense>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Suspense>
            <LabelFilter />
          </Suspense>
          <CreateTaskModal />
        </div>
      </div>

      <div className="group-has-data-pending:opacity-50 transition-opacity">
        <Suspense fallback={<BoardSkeleton />}>
          <BoardWithParams searchParams={searchParams} />
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
  const allTasks = await getTasks(label as Label | undefined);
  return (
    <>
      <span className="font-mono text-xs">{allTasks.length}</span> tasks
      {label ? ` · ${label}` : ""}
    </>
  );
}

async function BoardWithParams({
  searchParams,
}: {
  searchParams: Promise<{ label?: string }>;
}) {
  const { label } = await searchParams;
  return <Board label={label as Label | undefined} />;
}
