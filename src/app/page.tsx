import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { contadorGeneral } from "@/lib/area";
import { formatArea, formatFechaHora, formatMetros, formatRegistro } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const bardas = await prisma.barda.findMany({
    orderBy: { consecutivo: "desc" },
    include: {
      photos: { select: { id: true, kind: true, slot: true, url: true } },
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
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--header)]">Registros</h1>
          <p className="text-sm text-[var(--muted)]">
            {user.role === "ADMIN"
              ? "Ves todos los levantamientos."
              : "Elige un registro para las fotos de después y la observación."}
          </p>
        </div>
        {user.role === "ADMIN" ? (
          <Link className="btn-primary" href="/bardas/nueva">Registrar barda</Link>
        ) : null}
      </div>

      <section className="panel border-[var(--magic)] bg-violet-50">
        <p className="text-sm font-medium text-[var(--magic)]">Metros cuadrados totales</p>
        <p className="mt-1 font-[family-name:var(--font-display)] text-4xl text-[var(--header)]">
          {formatArea(general.area)}
        </p>
      </section>

      <div>
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
        <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-white">
          <table className="w-full min-w-[72rem] table-fixed text-left text-sm">
            <colgroup>
              <col className="w-[10%]" />
              <col className="w-[15%]" />
              <col className="w-[11%]" />
              <col className="w-[24%]" />
              <col className="w-[9%]" />
              <col className="w-[17%]" />
              <col className="w-[14%]" />
            </colgroup>
            <thead className="bg-[var(--surface-2)] text-[var(--muted)]">
              <tr>
                <th className="px-3 py-2 font-medium">Registro</th>
                <th className="px-3 py-2 font-medium">Alto y ancho</th>
                <th className="px-3 py-2 font-medium">Usuario</th>
                <th className="px-3 py-2 font-medium">Dirección</th>
                <th className="px-3 py-2 font-medium">Tipo</th>
                <th className="px-3 py-2 font-medium">Fecha</th>
                <th className="px-3 py-2 font-medium">Fotos</th>
              </tr>
            </thead>
            <tbody>
              {bardas.map((barda) => {
                const antes = barda.photos.filter((photo) => photo.kind === "ANTES").length;
                const despuesFotos = barda.photos
                  .filter((photo) => photo.kind === "DESPUES")
                  .sort((a, b) => a.slot - b.slot);
                return (
                  <tr key={barda.id} className="border-t border-[var(--line)] align-top">
                    <td className="whitespace-nowrap px-3 py-1.5">
                      <Link className="font-semibold leading-tight text-[var(--magic)]" href={`/bardas/${barda.id}`}>
                        {formatRegistro(barda.consecutivo)}
                      </Link>
                      <p className="text-xs leading-tight text-[var(--muted)]">
                        Globo {barda.consecutivo} · {formatArea(barda.areaM2)}
                      </p>
                      {despuesFotos.length > 0 ? (
                        <div className="mt-1 flex max-w-40 flex-wrap gap-0.5 whitespace-normal">
                          {despuesFotos.map((photo) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={photo.id} src={photo.url} alt={`Después ${photo.slot}`} className="h-8 w-6 rounded object-cover" />
                          ))}
                        </div>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-3 py-1.5 leading-tight">
                      <p className="font-semibold text-[var(--magic)]">{formatMetros(barda.altoMetros)} de alto</p>
                      <p className="font-semibold text-[var(--magic)]">{formatMetros(barda.anchoMetros)} de ancho</p>
                    </td>
                    <td className="px-3 py-1.5">{barda.createdBy.name}</td>
                    <td className="px-3 py-1.5 leading-tight break-words">{barda.address}</td>
                    <td className="px-3 py-1.5 leading-tight">
                      {barda.tipo === "PRIVADA" ? "Privada" : "Pública"}
                      <p className="text-xs text-[var(--muted)]">Permiso {barda.permisoFirmado ? "sí" : "no"}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-1.5">{formatFechaHora(barda.createdAt)}</td>
                    <td className="px-3 py-1.5">{antes}/5 antes · {despuesFotos.length}/5 después</td>
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
