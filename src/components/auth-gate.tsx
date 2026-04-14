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
      <div className="w-full max-w-xs">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-xl bg-white">
            <span className="text-sm font-bold text-black">T</span>
          </div>
          <h2 className="text-lg font-semibold tracking-tight">
            Taskboard
          </h2>
          <p className="mt-1 text-sm text-white/40">
            Enter your name to continue
          </p>
        </div>
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
            className="mb-3 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-white/15 focus:outline-none focus:ring-1 focus:ring-white/15"
            autoFocus
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-30"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
