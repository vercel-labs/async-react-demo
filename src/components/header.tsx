import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-black/80 backdrop-blur-xl supports-[backdrop-filter]:bg-black/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-sans text-[15px] font-semibold tracking-tight text-white"
        >
          <div className="flex size-6 items-center justify-center rounded-md bg-white">
            <span className="text-[11px] font-bold text-black">T</span>
          </div>
          Taskboard
        </Link>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </header>
  );
}
