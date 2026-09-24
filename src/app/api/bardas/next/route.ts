import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatRegistro } from "@/lib/format";

export async function GET() {
  const agg = await prisma.barda.aggregate({ _max: { consecutivo: true } });
  const consecutivo = (agg._max.consecutivo ?? 0) + 1;
  return NextResponse.json({ consecutivo, registro: formatRegistro(consecutivo) });
}
