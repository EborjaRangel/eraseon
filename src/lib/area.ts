export function areaM2(altoMetros: number, anchoMetros: number): number {
  return Math.round(altoMetros * anchoMetros * 100) / 100;
}

export function contadorGeneral(
  bardas: Array<{ anchoMetros: number; areaM2: number }>
): { bardas: number; lineales: number; area: number } {
  const lineales = bardas.reduce((sum, barda) => sum + barda.anchoMetros, 0);
  const area = bardas.reduce((sum, barda) => sum + barda.areaM2, 0);
  return {
    bardas: bardas.length,
    lineales: Math.round(lineales * 100) / 100,
    area: Math.round(area * 100) / 100,
  };
}

/** Las bardas con más metros cuadrados. Empate: el consecutivo más alto. */
export function idsMayorArea(
  bardas: Array<{ id: string; areaM2: number; consecutivo: number }>,
  limit = 65,
): Set<string> {
  return new Set(
    [...bardas]
      .sort((a, b) => b.areaM2 - a.areaM2 || b.consecutivo - a.consecutivo)
      .slice(0, limit)
      .map((barda) => barda.id),
  );
}

export function parseMeters(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(n) || n <= 0 || n > 500) return null;
  return Math.round(n * 100) / 100;
}
