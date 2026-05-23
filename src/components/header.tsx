import Link from "next/link";
import { Github } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-black/80 backdrop-blur-xl supports-[backdrop-filter]:bg-black/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-sans text-[15px] font-semibold tracking-tight text-white"
        >
          <div className="flex size-6 items-center justify-center rounded-md bg-white">
            <span className="text-[11px] font-bold text-black">T</span>
          </div>
          Taskboard
        </Link>
        <a
          href="https://github.com/vercel-labs/async-react-demo"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/50 transition-colors hover:text-white"
          aria-label="View source on GitHub"
        >
          <Github className="size-5" />
        </a>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </header>
  );
}
