import { cn } from "@/lib/utils";
import { RelativeTime } from "@/components/relative-time";
import { DeleteButton } from "./delete-button";

type CommentCardProps = {
  comment: {
    id: string;
    userName: string;
    content: string;
    createdAt: Date | string;
  };
  pending?: boolean;
  deleteAction?: () => Promise<void>;
};

export function CommentCard({
  comment,
  pending,
  deleteAction,
}: CommentCardProps) {
  return (
    <div
      className={cn(
        "group/comment rounded-lg px-3 transition-all has-data-pending:opacity-30",
        pending
          ? "animate-pulse opacity-60 py-3"
          : "py-2.5 hover:bg-white/[0.03]",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/[0.1] font-mono text-[9px] text-white/70">
            {comment.userName[0]}
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-[13px] font-medium text-white/90">
                {comment.userName}
              </span>
              <span className="font-mono text-[10px] text-white/55">
                <RelativeTime date={comment.createdAt} />
              </span>
              {pending && (
                <span className="text-[10px] text-white/55">Sending...</span>
              )}
            </div>
            <p className="mt-0.5 text-[13px] leading-relaxed text-white/70">
              {comment.content}
            </p>
          </div>
        </div>
        {deleteAction && (
          <div className="opacity-0 transition-opacity group-hover/comment:opacity-100">
            <DeleteButton deleteAction={deleteAction} />
          </div>
        )}
      </div>
    </div>
  );
}
