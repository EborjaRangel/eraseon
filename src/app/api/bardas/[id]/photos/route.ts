import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ownedBy, requireUser } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const { user, error } = await requireUser();
  if (error || !user) return error;
  const { id } = await ctx.params;
  const barda = await prisma.barda.findFirst({ where: { id, ...ownedBy(user) } });
  if (!barda) return NextResponse.json({ error: "No existe esa barda." }, { status: 404 });

  const form = await request.formData();
  const file = form.get("file");
  const kind = String(form.get("kind") ?? "");
  const slot = Number(form.get("slot"));

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Selecciona una imagen." }, { status: 400 });
  }
  if (kind !== "ANTES" && kind !== "DESPUES" && kind !== "PERMISO") {
    return NextResponse.json({ error: "El tipo de foto no es válido." }, { status: 400 });
  }
  if (kind === "PERMISO") {
    if (barda.tipo !== "PRIVADA") {
      return NextResponse.json({ error: "El permiso firmado solo aplica a bardas privadas." }, { status: 400 });
    }
    if (slot !== 1) {
      return NextResponse.json({ error: "El permiso firmado ocupa un solo espacio." }, { status: 400 });
    }
  } else if (!Number.isInteger(slot) || slot < 1 || slot > 5) {
    return NextResponse.json({ error: "La foto debe ir en un espacio del 1 al 5." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.byteLength > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "La imagen supera 8 MB." }, { status: 400 });
  }
  const photoKind = kind as "ANTES" | "DESPUES" | "PERMISO";
  const photo = await prisma.photo.upsert({
    where: { bardaId_kind_slot: { bardaId: id, kind: photoKind, slot } },
    create: { bardaId: id, kind: photoKind, slot, url: "pending", data: bytes },
    update: { data: bytes },
  });
  const saved = await prisma.photo.update({
    where: { id: photo.id },
    data: { url: `/api/photos/${photo.id}` },
    select: { id: true, url: true, kind: true, slot: true, bardaId: true, createdAt: true },
  });
  return NextResponse.json(saved);
}
