import Link from "next/link";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-white/10 bg-[var(--header)] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="brush-mark" aria-hidden="true" />
            <span>
              <span className="block font-[family-name:var(--font-display)] text-lg leading-none">EraseOn</span>
              <span className="text-xs text-cyan-100">Brocha mágica</span>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link className="rounded-lg px-3 py-2 hover:bg-white/10" href="/mapa">Mapa</Link>
            <Link className="rounded-lg bg-cyan-400 px-3 py-2 font-medium text-[var(--header)]" href="/bardas/nueva">
              Nueva barda
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
