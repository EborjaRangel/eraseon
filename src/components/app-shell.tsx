"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data } = useSession();
  const pathname = usePathname();
  const user = data?.user;

  if (pathname === "/login") {
    return <main className="mx-auto max-w-md px-4 py-10">{children}</main>;
  }

  return (
    <div className="min-h-dvh">
      <header className="border-b border-white/10 bg-[var(--header)] text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="brush-mark" aria-hidden="true" />
            <span>
              <span className="block font-[family-name:var(--font-display)] text-lg leading-none">EraseOn</span>
              <span className="text-xs text-cyan-100">Brocha mágica</span>
            </span>
          </Link>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <Link className="rounded-lg px-3 py-2 hover:bg-white/10" href="/mapa">Mapa</Link>
            <Link className="rounded-lg bg-cyan-400 px-3 py-2 font-medium text-[var(--header)]" href="/bardas/nueva">
              Nueva barda
            </Link>
            {user ? (
              <button type="button" className="rounded-lg px-3 py-2 hover:bg-white/10" onClick={() => signOut({ callbackUrl: "/login" })}>
                {user.role === "ADMIN" ? "Admin" : "Capturista"} · Salir
              </button>
            ) : null}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
