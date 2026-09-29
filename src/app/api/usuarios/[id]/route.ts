import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const { user, error } = await requireAdmin();
  if (error || !user) return error;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const active = body?.active;
  if (typeof active !== "boolean") {
    return NextResponse.json({ error: "Indica si la cuenta queda activa." }, { status: 400 });
  }
  if (id === user.id && !active) {
    return NextResponse.json({ error: "No puedes darte de baja." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, active: true } });
  if (!target) return NextResponse.json({ error: "No existe ese usuario." }, { status: 404 });

  if (target.role === "ADMIN" && target.active && !active) {
    const otrosAdmins = await prisma.user.count({
      where: { role: "ADMIN", active: true, id: { not: id } },
    });
    if (otrosAdmins === 0) {
      return NextResponse.json({ error: "Tiene que quedar al menos un admin activo." }, { status: 400 });
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { active },
    select: { id: true, name: true, email: true, role: true, active: true },
  });
  return NextResponse.json(updated);
}
