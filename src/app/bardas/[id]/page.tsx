import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteBardaButton } from "@/components/delete-barda-button";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser, ownedBy } from "@/lib/session";
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

  const antes = barda.photos.filter((photo) => photo.kind === "ANTES");
  const despues = barda.photos.filter((photo) => photo.kind === "DESPUES");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--muted)]">Globo {barda.consecutivo}</p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--header)]">
            {formatRegistro(barda.consecutivo)}
          </h1>
          <p className="mt-1">{barda.address}</p>
          <p className="text-sm text-[var(--muted)]">Registrada el {formatFechaHora(barda.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          <Link className="btn-secondary" href={`/bardas/${barda.id}/editar`}>Editar</Link>
          <DeleteBardaButton id={barda.id} />
        </div>
      </div>

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

      {barda.notes ? <section className="panel text-sm">{barda.notes}</section> : null}

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
