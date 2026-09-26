import { redirect } from "next/navigation";
import { UsuarioForm } from "@/components/usuario-form";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { formatFechaHora } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  const usuarios = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--header)]">Usuarios</h1>
        <p className="text-sm text-[var(--muted)]">
          Solo el admin da de alta cuentas. Un usuario entra con correo y contraseña, registra bardas y no puede borrar registros ni crear usuarios.
        </p>
      </div>
      <UsuarioForm />
      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--surface-2)] text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Correo</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Alta</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((cuenta) => (
              <tr key={cuenta.id} className="border-t border-[var(--line)]">
                <td className="px-4 py-3 font-medium">{cuenta.name}</td>
                <td className="px-4 py-3">{cuenta.email}</td>
                <td className="px-4 py-3">{cuenta.role === "ADMIN" ? "Admin" : "Usuario"}</td>
                <td className="px-4 py-3">{formatFechaHora(cuenta.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
