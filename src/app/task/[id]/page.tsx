import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTask, getVoteCount, hasUserVoted, getCurrentUser } from "@/lib/queries";
import { VoteButton } from "@/components/vote-button";
import { StarButton } from "@/components/star-button";
import { CommentList } from "@/components/comment-list";
import { cn } from "@/lib/utils";

const labelStyle = "bg-white/[0.06] text-white/50";
const statusStyle = "bg-white/[0.08] text-white/60";

export default async function TaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [task, voteCount, voted, user] = await Promise.all([
    getTask(id),
    getVoteCount(id),
    hasUserVoted(id),
    getCurrentUser(),
  ]);

  if (!task) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/40 transition-colors hover:text-white/60"
      >
        <ArrowLeft className="size-4" />
        Back to tasks
      </Link>

      <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 font-mono text-[10px] capitalize",
                  statusStyle
                )}
              >
                {task.status}
              </span>
              <div className="flex gap-1.5">
                {task.labels.map((l) => (
                  <span
                    key={l}
                    className={cn(
                      "rounded-full px-2 py-0.5 font-mono text-[10px]",
                      labelStyle
                    )}
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
            <h1 className="text-xl font-semibold tracking-tight">
              {task.title}
            </h1>
          </div>
          <StarButton taskId={task.id} />
        </div>

        <p className="mb-6 text-sm leading-relaxed text-white/60">
          {task.description}
        </p>

        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-full bg-white/10 font-mono text-[10px] text-white/60">
              {task.assignee[0]}
            </div>
            <span className="text-sm text-white/50">{task.assignee}</span>
          </div>
          <VoteButton
            taskId={task.id}
            initialCount={voteCount}
            initialHasVoted={voted}
          />
        </div>
      </div>

      <CommentList taskId={task.id} userName={user ?? ""} />
    </div>
  );
}
