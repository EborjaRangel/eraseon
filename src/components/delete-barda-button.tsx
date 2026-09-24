"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteBardaButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!window.confirm("¿Borrar este registro y sus fotos?")) return;
    setBusy(true);
    const response = await fetch(`/api/bardas/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setBusy(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <button type="button" className="btn-secondary" onClick={onDelete} disabled={busy}>
      {busy ? "Borrando…" : "Eliminar registro"}
    </button>
  );
}
