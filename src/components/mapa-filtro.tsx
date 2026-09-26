"use client";

import { useState } from "react";
import { EraseMapLoader } from "@/components/erase-map-loader";
import type { MapBarda } from "@/components/erase-map";

type Filtro = "TODAS" | "PUBLICA" | "PRIVADA";

const opciones: Array<{ id: Filtro; label: string }> = [
  { id: "TODAS", label: "Todas" },
  { id: "PUBLICA", label: "Bardas públicas" },
  { id: "PRIVADA", label: "Bardas privadas" },
];

export function MapaFiltro({ bardas }: { bardas: MapBarda[] }) {
  const [filtro, setFiltro] = useState<Filtro>("TODAS");
  const visibles = filtro === "TODAS" ? bardas : bardas.filter((barda) => barda.tipo === filtro);
  const conteo = {
    TODAS: bardas.length,
    PUBLICA: bardas.filter((barda) => barda.tipo === "PUBLICA").length,
    PRIVADA: bardas.filter((barda) => barda.tipo === "PRIVADA").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {opciones.map((opcion) => (
          <button
            key={opcion.id}
            type="button"
            onClick={() => setFiltro(opcion.id)}
            className={`min-h-11 rounded-lg px-3 py-2 text-sm font-medium ${
              filtro === opcion.id
                ? "bg-[var(--magic)] text-white"
                : "border border-[var(--line)] bg-white text-[var(--ink)]"
            }`}
          >
            {opcion.label} ({conteo[opcion.id]})
          </button>
        ))}
      </div>
      <EraseMapLoader bardas={visibles} />
    </div>
  );
}
