import { redirect } from "next/navigation";
import { MapaFiltro } from "@/components/mapa-filtro";
import { idsRosas } from "@/lib/area";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function MapaPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const bardas = await prisma.barda.findMany({
    orderBy: { consecutivo: "asc" },
    include: { photos: { select: { kind: true } } },
  });
  const conFotos = bardas.map((barda) => ({
    id: barda.id,
    areaM2: barda.areaM2,
    consecutivo: barda.consecutivo,
    despues: barda.photos.filter((photo) => photo.kind === "DESPUES").length,
    colorGlobo: barda.colorGlobo,
  }));
  const rosa = idsRosas(conFotos.filter((barda) => barda.colorGlobo == null));
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
    tipo: barda.tipo,
    permisoFirmado: barda.permisoFirmado,
    antes: barda.photos.filter((photo) => photo.kind === "ANTES").length,
    despues: barda.photos.filter((photo) => photo.kind === "DESPUES").length,
    rosa: barda.colorGlobo === "ROSA" || (barda.colorGlobo == null && rosa.has(barda.id)),
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--header)]">Mapa de Coyoacán</h1>
        <p className="text-sm text-[var(--muted)]">
          El mapa muestra la alcaldía Coyoacán. Cada globo lleva el número consecutivo. Rosa: el color elegido al registrar, o las 64 bardas moradas de mayor metraje que aún no tienen color elegido. El globo 55 y el resto quedan en gris Oxford.
        </p>
      </div>
      <MapaFiltro bardas={points} />
    </div>
  );
}
