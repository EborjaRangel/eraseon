"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ModificarRegistroButton({ id, compact = false }: { id: string; compact?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onModificar() {
    if (!window.confirm("Se borran las fotos de antes y de después. El folio se conserva. Después puedes cambiar el alto, el ancho, la dirección, la ubicación y subir fotos nuevas.")) {
      return;
    }
    setBusy(true);
    const response = await fetch(`/api/bardas/${id}/photos`, { method: "DELETE" });
    if (!response.ok) {
      setBusy(false);
      const data = await response.json().catch(() => ({}));
      window.alert(data.error ?? "No se pudieron borrar las fotos.");
      return;
    }
    router.push(`/bardas/${id}/editar`);
    router.refresh();
  }

  return (
    <button
      type="button"
      className={compact ? "btn-secondary mt-1 inline-flex px-2 py-1 text-xs" : "btn-secondary"}
      onClick={onModificar}
      disabled={busy}
    >
      {busy ? "Borrando fotos…" : "Modificar"}
    </button>
  );
}
