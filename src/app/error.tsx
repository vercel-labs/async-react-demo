"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-red-500/10">
        <span className="text-lg text-red-400">!</span>
      </div>
      <h2 className="text-lg font-semibold tracking-tight">
        Something went wrong
      </h2>
      <p className="text-sm text-white/50">{error.message}</p>
      <button
        onClick={reset}
        className="rounded-lg bg-white/[0.08] px-4 py-2 text-[13px] font-medium text-white/70 transition-colors hover:bg-white/[0.12]"
      >
        Try again
      </button>
    </div>
  );
}
