import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CERCA_METROS, distanciaMetros } from "@/lib/distancia";
import { requireUser } from "@/lib/session";

export async function GET(request: Request) {
  const { user, error } = await requireUser();
  if (error || !user) return error;

  const url = new URL(request.url);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Falta la ubicación." }, { status: 400 });
  }

  const bardas = await prisma.barda.findMany({
    select: {
      id: true,
      consecutivo: true,
      address: true,
      latitude: true,
      longitude: true,
      createdBy: { select: { name: true } },
    },
  });

  const cercanas = bardas
    .map((barda) => ({
      id: barda.id,
      consecutivo: barda.consecutivo,
      address: barda.address,
      usuario: barda.createdBy.name,
      metros: Math.round(distanciaMetros(lat, lng, barda.latitude, barda.longitude)),
    }))
    .filter((barda) => barda.metros <= CERCA_METROS)
    .sort((a, b) => a.metros - b.metros);

  return NextResponse.json(cercanas);
}
