import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { removeUpload, saveUpload } from "@/lib/uploads";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const barda = await prisma.barda.findUnique({ where: { id } });
  if (!barda) return NextResponse.json({ error: "No existe esa barda." }, { status: 404 });

  const form = await request.formData();
  const file = form.get("file");
  const kind = String(form.get("kind") ?? "");
  const slot = Number(form.get("slot"));

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Selecciona una imagen." }, { status: 400 });
  }
  if (kind !== "ANTES" && kind !== "DESPUES") {
    return NextResponse.json({ error: "El tipo de foto no es válido." }, { status: 400 });
  }
  if (!Number.isInteger(slot) || slot < 1 || slot > 5) {
    return NextResponse.json({ error: "La foto debe ir en un espacio del 1 al 5." }, { status: 400 });
  }

  const previous = await prisma.photo.findUnique({
    where: { bardaId_kind_slot: { bardaId: id, kind, slot } },
  });
  const url = await saveUpload(id, file);
  const photo = await prisma.photo.upsert({
    where: { bardaId_kind_slot: { bardaId: id, kind, slot } },
    create: { bardaId: id, kind, slot, url },
    update: { url },
  });
  if (previous && previous.url !== url) await removeUpload(previous.url);
  return NextResponse.json(photo);
}
