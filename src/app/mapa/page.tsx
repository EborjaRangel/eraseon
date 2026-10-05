import { redirect } from "next/navigation";
import { MapaFiltro } from "@/components/mapa-filtro";
import { coloresVisibles } from "@/lib/area";
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
    terminada: barda.terminada,
  }));
  const colores = coloresVisibles(conFotos);
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
    color: colores.get(barda.id) ?? "GRIS",
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--header)]">Mapa de Coyoacán</h1>
        <p className="text-sm text-[var(--muted)]">
          El mapa muestra la alcaldía Coyoacán. Cada globo lleva el número consecutivo. Rosa y gris Oxford son los colores de trabajo. Al guardar las fotos 3, 4 y 5 de después, el rosa pasa a dorado y el gris Oxford a naranja.
        </p>
      </div>
      <MapaFiltro bardas={points} />
    </div>
  );
}
