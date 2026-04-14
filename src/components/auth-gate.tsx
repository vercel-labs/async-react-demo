"use client";

import { useState } from "react";
import { setUserName } from "@/lib/actions";

export function AuthGate({
  user,
  children,
}: {
  user: string | null;
  children: React.ReactNode;
}) {
  const [name, setName] = useState("");
  const [isSet, setIsSet] = useState(!!user);

  if (isSet) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-white/5 p-8">
        <h2 className="mb-2 text-xl font-semibold tracking-tight">
          Welcome to Taskboard
        </h2>
        <p className="mb-6 text-sm text-white/50">
          Enter your name to get started.
        </p>
        <form
          action={async (formData) => {
            await setUserName(formData);
            setIsSet(true);
          }}
        >
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="mb-4 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
            autoFocus
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white/90 disabled:opacity-40"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
