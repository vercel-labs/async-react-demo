import { TaskGrid } from "@/components/task-grid";
import { StatusTabs } from "@/components/status-tabs";
import { LabelFilter } from "@/components/label-filter";
import type { Label, Status } from "@/lib/data";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; label?: string }>;
}) {
  const { status, label } = await searchParams;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-20 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="mt-1 text-sm text-white/50">
            Track and manage your team&apos;s work
          </p>
        </div>
        <StatusTabs />
      </div>

      <div className="mb-6">
        <LabelFilter />
      </div>

      <TaskGrid
        status={status as Status | undefined}
        label={label as Label | undefined}
      />
    </div>
  );
}
