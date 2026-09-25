import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ownedBy, requireUser } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { user, error } = await requireUser();
  if (error || !user) return error;
  const { id } = await ctx.params;
  const photo = await prisma.photo.findFirst({
    where: { id, barda: ownedBy(user) },
    select: { data: true },
  });
  if (!photo) return NextResponse.json({ error: "No existe esa foto." }, { status: 404 });
  return new NextResponse(new Uint8Array(photo.data), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
