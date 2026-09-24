export function areaM2(altoMetros: number, anchoMetros: number): number {
  return Math.round(altoMetros * anchoMetros * 100) / 100;
}

export function parseMeters(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(n) || n <= 0 || n > 500) return null;
  return Math.round(n * 100) / 100;
}
