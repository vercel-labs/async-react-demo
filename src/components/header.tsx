import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-md supports-[backdrop-filter]:bg-black/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center px-4 sm:px-6">
        <Link
          href="/"
          className="font-sans text-lg font-semibold tracking-tight text-white"
        >
          Taskboard
        </Link>
        <nav className="ml-auto flex items-center gap-4">
          <span className="font-mono text-xs text-white/40">
            async-react-demo
          </span>
        </nav>
      </div>
    </header>
  );
}
