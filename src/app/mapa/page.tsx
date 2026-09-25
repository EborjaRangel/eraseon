import { redirect } from "next/navigation";
import { EraseMapLoader } from "@/components/erase-map-loader";
import { prisma } from "@/lib/prisma";
import { currentUser, ownedBy } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function MapaPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const bardas = await prisma.barda.findMany({
    where: ownedBy(user),
    orderBy: { consecutivo: "asc" },
    include: { photos: { select: { kind: true } } },
  });
  const points = bardas.map((barda) => ({
    id: barda.id,
    consecutivo: barda.consecutivo,
    address: barda.address,
    latitude: barda.latitude,
    longitude: barda.longitude,
    altoMetros: barda.altoMetros,
    anchoMetros: barda.anchoMetros,
    areaM2: barda.areaM2,
    createdAt: barda.createdAt.toISOString(),
    antes: barda.photos.filter((photo) => photo.kind === "ANTES").length,
    despues: barda.photos.filter((photo) => photo.kind === "DESPUES").length,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--header)]">Mapa</h1>
        <p className="text-sm text-[var(--muted)]">
          Cada globo muestra el número consecutivo. Verde si ya hay fotos de antes, violeta si ya hay fotos de después y naranja si todavía no hay fotos.
        </p>
      </div>
      <EraseMapLoader bardas={points} />
    </div>
  );
}
