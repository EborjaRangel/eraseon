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

/** Las bardas moradas (con fotos de después) de mayor área, sin el globo excluido. */
export function idsRosas(
  bardas: Array<{ id: string; areaM2: number; consecutivo: number; despues: number }>,
  limit = 65,
  exceptoConsecutivo = 55,
): Set<string> {
  return new Set(
    bardas
      .filter((barda) => barda.despues > 0)
      .sort((a, b) => b.areaM2 - a.areaM2 || b.consecutivo - a.consecutivo)
      .slice(0, limit)
      .filter((barda) => barda.consecutivo !== exceptoConsecutivo)
      .map((barda) => barda.id),
  );
}

export type ColorVisible = "ROSA" | "GRIS" | "DORADO" | "NARANJA";

export const COLOR_GLOBO: Record<ColorVisible, string> = {
  ROSA: "#ec4899",
  GRIS: "#3d4450",
  DORADO: "#b7950b",
  NARANJA: "#ea580c",
};

type BardaColor = {
  id: string;
  areaM2: number;
  consecutivo: number;
  despues: number;
  colorGlobo: "ROSA" | "GRIS" | null;
  terminada: boolean;
};

/** Rosa o gris de origen, y dorado o naranja si la barda ya está terminada. */
export function coloresVisibles(bardas: BardaColor[]): Map<string, ColorVisible> {
  const rosa = idsRosas(bardas.filter((barda) => barda.colorGlobo == null));
  const colores = new Map<string, ColorVisible>();
  for (const barda of bardas) {
    const base: "ROSA" | "GRIS" =
      barda.colorGlobo === "ROSA" || (barda.colorGlobo == null && rosa.has(barda.id)) ? "ROSA" : "GRIS";
    colores.set(barda.id, barda.terminada ? (base === "ROSA" ? "DORADO" : "NARANJA") : base);
  }
  return colores;
}

export function contarColores(bardas: BardaColor[]) {
  const cuentas = { ROSA: 0, GRIS: 0, DORADO: 0, NARANJA: 0 };
  for (const color of coloresVisibles(bardas).values()) cuentas[color] += 1;
  return cuentas;
}

export function parseMeters(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(n) || n <= 0 || n > 500) return null;
  return Math.round(n * 100) / 100;
}
