import { Board } from "@/components/board";
import { LabelFilter } from "@/components/label-filter";
import { CreateTaskModal } from "@/components/create-task-modal";
import { getTasks } from "@/data/queries/task";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ label?: string }>;
}) {
  const { label } = await searchParams;
  const allTasks = await getTasks(label);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Board</h1>
          <p className="mt-1 text-sm text-white/60">
            <span className="font-mono text-xs">{allTasks.length}</span> tasks
            {label ? ` · ${label}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LabelFilter />
          <CreateTaskModal />
        </div>
      </div>

      <Board label={label} />
    </div>
  );
}
