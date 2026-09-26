import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser, ownedBy } from "@/lib/session";
import { contadorGeneral } from "@/lib/area";
import { formatArea, formatFechaHora, formatMetros, formatRegistro } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const bardas = await prisma.barda.findMany({
    where: ownedBy(user),
    orderBy: { consecutivo: "desc" },
    include: {
      photos: { select: { kind: true } },
      createdBy: { select: { name: true } },
    },
  });
  const todas = await prisma.barda.findMany({
    select: { anchoMetros: true, areaM2: true },
  });
  const general = contadorGeneral(todas);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--header)]">Bardas</h1>
          <p className="text-sm text-[var(--muted)]">
            {user.role === "ADMIN" ? "Ves todas las bardas." : "Solo ves las bardas que tú registraste."}
          </p>
        </div>
        <Link className="btn-primary" href="/bardas/nueva">Registrar barda</Link>
      </div>

      <section className="panel border-[var(--magic)] bg-violet-50">
        <p className="text-sm font-medium text-[var(--magic)]">Contador general de metros pintados</p>
        <p className="mt-1 font-[family-name:var(--font-display)] text-4xl text-[var(--header)]">
          {formatMetros(general.lineales)}
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {formatArea(general.area)} de área · {general.bardas} {general.bardas === 1 ? "barda" : "bardas"}
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <article className="panel">
          <p className="text-sm text-[var(--muted)]">Registros</p>
          <p className="text-3xl font-semibold">{bardas.length}</p>
        </article>
        <article className="panel">
          <p className="text-sm text-[var(--muted)]">Área que ves</p>
          <p className="text-3xl font-semibold">{formatArea(contadorGeneral(bardas).area)}</p>
        </article>
        <article className="panel">
          <p className="text-sm text-[var(--muted)]">Último registro</p>
          <p className="text-lg font-semibold">{bardas[0] ? formatFechaHora(bardas[0].createdAt) : "Aún no hay"}</p>
        </article>
      </div>

      {bardas.length === 0 ? (
        <section className="panel text-sm text-[var(--muted)]">
          Todavía no hay bardas. El primer globo del mapa será el consecutivo 1.
        </section>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--surface-2)] text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Registro</th>
                <th className="px-4 py-3 font-medium">Dirección</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Medidas</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Fotos</th>
              </tr>
            </thead>
            <tbody>
              {bardas.map((barda) => {
                const antes = barda.photos.filter((photo) => photo.kind === "ANTES").length;
                const despues = barda.photos.filter((photo) => photo.kind === "DESPUES").length;
                return (
                  <tr key={barda.id} className="border-t border-[var(--line)]">
                    <td className="px-4 py-3">
                      <Link className="font-semibold text-[var(--magic)]" href={`/bardas/${barda.id}`}>
                        {formatRegistro(barda.consecutivo)}
                      </Link>
                      <p className="text-xs text-[var(--muted)]">Globo {barda.consecutivo}</p>
                    </td>
                    <td className="px-4 py-3">{barda.address}</td>
                    <td className="px-4 py-3">
                      {barda.tipo === "PRIVADA" ? "Privada" : "Pública"}
                      <p className="text-xs text-[var(--muted)]">Permiso {barda.permisoFirmado ? "sí" : "no"}</p>
                    </td>
                    <td className="px-4 py-3">
                      {formatMetros(barda.altoMetros)} × {formatMetros(barda.anchoMetros)}
                      <p className="font-medium">{formatArea(barda.areaM2)}</p>
                    </td>
                    <td className="px-4 py-3">{formatFechaHora(barda.createdAt)}</td>
                    <td className="px-4 py-3">{antes}/5 antes · {despues}/5 después</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
