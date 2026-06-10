"use client";

import { useOptimistic } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export function DeleteButton({
  deleteAction,
}: {
  deleteAction: () => void | Promise<void>;
}) {
  const [isPending, setIsPending] = useOptimistic(false);

  return (
    <form
      action={async () => {
        setIsPending(true);
        await deleteAction();
        toast.success("Comment deleted");
      }}
    >
      <button
        type="submit"
        disabled={isPending}
        data-pending={isPending ? "" : undefined}
        className="mt-0.5 rounded p-1 text-white/40 transition-colors hover:bg-white/[0.08] hover:text-red-300 disabled:opacity-50"
        aria-label="Delete comment"
      >
        <Trash2 className="size-3" />
      </button>
    </form>
  );
}
