import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const bardas = await prisma.barda.findMany({
    orderBy: { consecutivo: "asc" },
    include: { photos: { select: { kind: true } } },
  });
  return NextResponse.json(
    bardas.map((barda) => ({
      id: barda.id,
      consecutivo: barda.consecutivo,
      address: barda.address,
      latitude: barda.latitude,
      longitude: barda.longitude,
      altoMetros: barda.altoMetros,
      anchoMetros: barda.anchoMetros,
      areaM2: barda.areaM2,
      createdAt: barda.createdAt,
      antes: barda.photos.filter((photo) => photo.kind === "ANTES").length,
      despues: barda.photos.filter((photo) => photo.kind === "DESPUES").length,
    }))
  );
}
