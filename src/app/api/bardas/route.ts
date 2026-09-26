import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { areaM2, parseMeters } from "@/lib/area";
import { isUniqueConsecutivoError, nextConsecutivo } from "@/lib/consecutivo";
import { ownedBy, requireUser } from "@/lib/session";

export async function GET() {
  const { user, error } = await requireUser();
  if (error || !user) return error;
  const bardas = await prisma.barda.findMany({
    where: ownedBy(user),
    orderBy: { consecutivo: "desc" },
    include: {
      photos: { select: { id: true, kind: true, slot: true, url: true } },
      createdBy: { select: { name: true } },
    },
  });
  return NextResponse.json(bardas);
}

export async function POST(request: Request) {
  const { user, error } = await requireUser();
  if (error || !user) return error;
  const body = await request.json().catch(() => null);
  const address = String(body?.address ?? "").trim();
  const notes = String(body?.notes ?? "").trim();
  const tipo = body?.tipo === "PRIVADA" ? "PRIVADA" : "PUBLICA";
  const latitude = Number(body?.latitude);
  const longitude = Number(body?.longitude);
  const altoMetros = parseMeters(body?.altoMetros);
  const anchoMetros = parseMeters(body?.anchoMetros);

  if (address.length < 3) {
    return NextResponse.json({ error: "Escribe la dirección de la barda." }, { status: 400 });
  }
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return NextResponse.json({ error: "Marca la ubicación en el mapa." }, { status: 400 });
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return NextResponse.json({ error: "Marca la ubicación en el mapa." }, { status: 400 });
  }
  if (altoMetros == null || anchoMetros == null) {
    return NextResponse.json(
      { error: "Alto y ancho deben ser metros mayores a 0 y hasta 500." },
      { status: 400 }
    );
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const barda = await prisma.$transaction(async (tx) => {
        const consecutivo = await nextConsecutivo(tx);
        return tx.barda.create({
          data: {
            consecutivo,
            address,
            notes,
            tipo,
            latitude,
            longitude,
            altoMetros,
            anchoMetros,
            areaM2: areaM2(altoMetros, anchoMetros),
            createdById: user.id,
          },
        });
      });
      return NextResponse.json(barda, { status: 201 });
    } catch (error) {
      if (!isUniqueConsecutivoError(error) || attempt === 4) {
        return NextResponse.json({ error: "No se pudo guardar el registro." }, { status: 500 });
      }
    }
  }
  return NextResponse.json({ error: "No se pudo guardar el registro." }, { status: 500 });
}
