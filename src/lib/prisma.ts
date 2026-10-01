import { PrismaClient } from "@prisma/client";

function databaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw || /[?&]connection_limit=/.test(raw)) return raw;
  const join = raw.includes("?") ? "&" : "?";
  return `${raw}${join}connection_limit=5&pool_timeout=20`;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: databaseUrl(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

globalForPrisma.prisma = prisma;
