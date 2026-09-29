import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: "ADMIN" | "USUARIO";
};

export async function currentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, active: true },
  });
  if (!dbUser?.active) return null;
  return { id: dbUser.id, name: dbUser.name, email: dbUser.email, role: dbUser.role };
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) {
    return { user: null, error: NextResponse.json({ error: "Inicia sesión." }, { status: 401 }) };
  }
  return { user, error: null };
}

export async function requireAdmin() {
  const result = await requireUser();
  if (result.error || !result.user) return result;
  if (result.user.role !== "ADMIN") {
    return {
      user: null,
      error: NextResponse.json({ error: "Solo el admin puede hacer esto." }, { status: 403 }),
    };
  }
  return result;
}

export function ownedBy(user: SessionUser) {
  return user.role === "ADMIN" ? {} : { createdById: user.id };
}
