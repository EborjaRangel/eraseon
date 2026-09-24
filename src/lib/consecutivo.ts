import type { Prisma } from "@prisma/client";

export function isUniqueConsecutivoError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string };
  return e.code === "P2002";
}

export async function nextConsecutivo(tx: Prisma.TransactionClient): Promise<number> {
  const agg = await tx.barda.aggregate({ _max: { consecutivo: true } });
  return (agg._max.consecutivo ?? 0) + 1;
}
