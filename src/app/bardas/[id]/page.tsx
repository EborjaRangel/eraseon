import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteBardaButton } from "@/components/delete-barda-button";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser, ownedBy } from "@/lib/session";
import { contadorGeneral } from "@/lib/area";
import { formatArea, formatFechaHora, formatMetros, formatRegistro } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function BardaPage({ params }: Props) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const barda = await prisma.barda.findFirst({
    where: { id, ...ownedBy(user) },
    include: {
      photos: {
        orderBy: { slot: "asc" },
        select: { id: true, slot: true, url: true, kind: true },
      },
    },
  });
  if (!barda) notFound();

  const general = contadorGeneral(
    await prisma.barda.findMany({ select: { anchoMetros: true, areaM2: true } })
  );
  const antes = barda.photos.filter((photo) => photo.kind === "ANTES");
  const despues = barda.photos.filter((photo) => photo.kind === "DESPUES");
  const permiso = barda.photos.find((photo) => photo.kind === "PERMISO");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--muted)]">Globo {barda.consecutivo}</p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--header)]">
            {formatRegistro(barda.consecutivo)}
          </h1>
          <p className="mt-1">{barda.address}</p>
          <p className="text-sm font-medium">
            {barda.tipo === "PRIVADA" ? "Barda privada" : "Barda pública"}
            {` · Permiso firmado: ${barda.permisoFirmado ? "sí" : "no"}`}
          </p>
          <p className="text-sm text-[var(--muted)]">Registrada el {formatFechaHora(barda.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          <Link className="btn-secondary" href={`/bardas/${barda.id}/editar`}>Editar</Link>
          {user.role === "ADMIN" ? <DeleteBardaButton id={barda.id} /> : null}
        </div>
      </div>

      <section className="panel border-[var(--magic)] bg-violet-50 text-sm">
        <p className="font-medium text-[var(--magic)]">Contador general</p>
        <p className="mt-1 text-2xl font-semibold text-[var(--header)]">{formatMetros(general.lineales)} pintados</p>
        <p className="text-[var(--muted)]">
          Esta barda aporta {formatMetros(barda.anchoMetros)} y {formatArea(barda.areaM2)}. El total del proyecto es {formatArea(general.area)}.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <article className="panel">
          <p className="text-sm text-[var(--muted)]">Alto</p>
          <p className="text-2xl font-semibold">{formatMetros(barda.altoMetros)}</p>
        </article>
        <article className="panel">
          <p className="text-sm text-[var(--muted)]">Ancho</p>
          <p className="text-2xl font-semibold">{formatMetros(barda.anchoMetros)}</p>
        </article>
        <article className="panel">
          <p className="text-sm text-[var(--muted)]">Área</p>
          <p className="text-2xl font-semibold text-[var(--brush)]">{formatArea(barda.areaM2)}</p>
        </article>
      </section>

      {barda.permisoFirmado ? (
        <section className="panel">
          <h2 className="section-title">Permiso firmado</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Dueño o representante legal de la barda.</p>
          {permiso ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={permiso.url} alt="Permiso firmado" className="mt-3 max-h-96 rounded-xl object-contain" />
          ) : (
            <p className="mt-3 text-sm">Aún no hay foto del permiso firmado.</p>
          )}
        </section>
      ) : null}

      {barda.notes ? <section className="panel text-sm">{barda.notes}</section> : null}

      {antes.length + despues.length === 0 ? (
        <section className="panel text-sm">
          Este registro no tiene fotos guardadas. Entra a editar y vuelve a elegirlas desde la cámara o la galería.
        </section>
      ) : null}
      <Gallery title="Antes" photos={antes} />
      <Gallery title="Después" photos={despues} />
    </div>
  );
}

function Gallery({ title, photos }: { title: string; photos: Array<{ id: string; slot: number; url: string }> }) {
  return (
    <section className="panel">
      <h2 className="section-title">{title}</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => {
          const slot = index + 1;
          const photo = photos.find((item) => item.slot === slot);
          return (
            <div key={slot} className="relative aspect-[3/4] overflow-hidden rounded-xl bg-[var(--surface-2)]">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo.url} alt={`${title} ${slot}`} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-[var(--muted)]">Foto {slot}</div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
