import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

async function findByLogin(login: string): Promise<User | null> {
  const key = login.toLowerCase().trim();
  if (!key) return null;
  const byEmail = await prisma.user.findUnique({ where: { email: key } });
  if (byEmail) return byEmail;
  return prisma.user.findFirst({
    where: {
      OR: [
        { name: { equals: key, mode: "insensitive" } },
        { email: { startsWith: `${key}@`, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "asc" },
  });
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 12 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const login = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password;
        if (!login || !password) return null;
        let user;
        try {
          user = await findByLogin(login);
        } catch (error) {
          console.error("[auth] reintento de consulta", error);
          try {
            user = await findByLogin(login);
          } catch (retryError) {
            console.error("[auth] no se pudo consultar la cuenta", retryError);
            throw new Error("Servidor");
          }
        }
        if (!user) return null;
        if (!user.active) throw new Error("Inactiva");
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};
