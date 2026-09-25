import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const users = [
  { name: "Admin", email: "admin@eraseon.local", password: "admin123", role: "ADMIN" as const },
  { name: "Capturista", email: "capturista@eraseon.local", password: "campo123", role: "CAPTURISTA" as const },
];

async function main() {
  for (const user of users) {
    const password = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, password, role: user.role, active: true },
      create: { name: user.name, email: user.email, password, role: user.role },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
