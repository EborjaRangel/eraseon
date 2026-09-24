"use client";

import dynamic from "next/dynamic";
import type { MapBarda } from "@/components/erase-map";

const EraseMap = dynamic(() => import("@/components/erase-map").then((mod) => mod.EraseMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[min(70vh,640px)] items-center justify-center rounded-2xl border border-[var(--line)] bg-white text-sm text-[var(--muted)]">
      Cargando mapa…
    </div>
  ),
});

type Props = {
  bardas?: MapBarda[];
  pick?: { latitude: number; longitude: number } | null;
  onPick?: (latitude: number, longitude: number) => void;
  heightClass?: string;
};

export function EraseMapLoader(props: Props) {
  return <EraseMap {...props} />;
}
