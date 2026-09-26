import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { ValidationError } from "yup";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { usuarioSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const { user, error } = await requireAdmin();
  if (error || !user) return error;

  const body = await request.json().catch(() => null);
  try {
    const data = await usuarioSchema.validate({
      name: body?.name,
      email: String(body?.email ?? "").toLowerCase(),
      password: body?.password,
      role: body?.role === "ADMIN" ? "ADMIN" : "USUARIO",
    });
    const password = await bcrypt.hash(data.password, 10);
    const created = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password,
        role: data.role,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (typeof err === "object" && err && "code" in err && err.code === "P2002") {
      return NextResponse.json({ error: "Ese correo ya está registrado." }, { status: 409 });
    }
    return NextResponse.json({ error: "No se pudo dar de alta al usuario." }, { status: 500 });
  }
}
