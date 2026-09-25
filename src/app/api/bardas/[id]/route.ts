import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { areaM2, parseMeters } from "@/lib/area";
import { removeUpload } from "@/lib/uploads";
import { ownedBy, requireUser } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { user, error } = await requireUser();
  if (error || !user) return error;
  const { id } = await ctx.params;
  const barda = await prisma.barda.findFirst({
    where: { id, ...ownedBy(user) },
    include: { photos: { orderBy: [{ kind: "asc" }, { slot: "asc" }] } },
  });
  if (!barda) return NextResponse.json({ error: "No existe esa barda." }, { status: 404 });
  return NextResponse.json(barda);
}

export async function PATCH(request: Request, ctx: Ctx) {
  const { user, error } = await requireUser();
  if (error || !user) return error;
  const { id } = await ctx.params;
  const current = await prisma.barda.findFirst({ where: { id, ...ownedBy(user) } });
  if (!current) return NextResponse.json({ error: "No existe esa barda." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const address = String(body?.address ?? current.address).trim();
  const notes = String(body?.notes ?? current.notes).trim();
  const latitude = Number(body?.latitude ?? current.latitude);
  const longitude = Number(body?.longitude ?? current.longitude);
  const altoMetros = parseMeters(body?.altoMetros ?? current.altoMetros);
  const anchoMetros = parseMeters(body?.anchoMetros ?? current.anchoMetros);

  if (address.length < 3) {
    return NextResponse.json({ error: "Escribe la dirección de la barda." }, { status: 400 });
  }
  if (altoMetros == null || anchoMetros == null) {
    return NextResponse.json(
      { error: "Alto y ancho deben ser metros mayores a 0 y hasta 500." },
      { status: 400 }
    );
  }

  const barda = await prisma.barda.update({
    where: { id },
    data: {
      address,
      notes,
      latitude,
      longitude,
      altoMetros,
      anchoMetros,
      areaM2: areaM2(altoMetros, anchoMetros),
    },
  });
  return NextResponse.json(barda);
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { user, error } = await requireUser();
  if (error || !user) return error;
  const { id } = await ctx.params;
  const barda = await prisma.barda.findFirst({ where: { id, ...ownedBy(user) }, include: { photos: true } });
  if (!barda) return NextResponse.json({ error: "No existe esa barda." }, { status: 404 });
  await Promise.all(barda.photos.map((photo) => removeUpload(photo.url)));
  await prisma.barda.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
