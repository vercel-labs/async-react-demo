import Link from "next/link";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
    </svg>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-black/80 backdrop-blur-xl supports-[backdrop-filter]:bg-black/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          prefetch={true}
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
          <GitHubIcon className="size-5" />
        </a>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </header>
  );
}
