import { notFound, redirect } from "next/navigation";
import { DespuesForm } from "@/components/despues-form";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function DespuesPage({ params }: Props) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const barda = await prisma.barda.findFirst({
    where: { id },
    include: { photos: { select: { kind: true, slot: true, url: true } } },
  });
  if (!barda) notFound();

  const despues = barda.photos.filter((photo) => photo.kind === "DESPUES");
  const tieneAntes = barda.photos.some((photo) => photo.kind === "ANTES");

  return (
    <div className="space-y-4">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--header)]">Después y observación</h1>
      <DespuesForm
        bardaId={barda.id}
        consecutivo={barda.consecutivo}
        address={barda.address}
        notes={barda.notes}
        tieneAntes={tieneAntes}
        despues={despues.map((photo) => ({ slot: photo.slot, url: photo.url }))}
      />
    </div>
  );
}
