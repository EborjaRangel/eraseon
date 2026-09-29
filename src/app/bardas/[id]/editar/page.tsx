import { notFound, redirect } from "next/navigation";
import { BardaForm } from "@/components/barda-form";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditarBardaPage({ params }: Props) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  if (user.role !== "ADMIN") redirect(`/bardas/${id}/despues`);
  const barda = await prisma.barda.findFirst({
    where: { id },
    include: { photos: { select: { id: true, kind: true, slot: true, url: true } } },
  });
  if (!barda) notFound();

  return (
    <div className="space-y-4">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--header)]">Editar barda</h1>
      <BardaForm
        mode="edit"
        bardaId={barda.id}
        initial={{
          address: barda.address,
          notes: barda.notes,
          tipo: barda.tipo,
          permisoFirmado: barda.permisoFirmado,
          latitude: barda.latitude,
          longitude: barda.longitude,
          altoMetros: barda.altoMetros,
          anchoMetros: barda.anchoMetros,
          consecutivo: barda.consecutivo,
          photos: barda.photos.map((photo) => ({
            kind: photo.kind,
            slot: photo.slot,
            url: photo.url,
          })),
        }}
      />
    </div>
  );
}
