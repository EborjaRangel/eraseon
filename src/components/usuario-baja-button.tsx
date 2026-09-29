"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UsuarioBajaButton({ id, name, active }: { id: string; name: string; active: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onToggle() {
    const mensaje = active
      ? `¿Dar de baja a ${name}? Ya no podrá entrar.`
      : `¿Activar de nuevo a ${name}?`;
    if (!window.confirm(mensaje)) return;
    setBusy(true);
    const response = await fetch(`/api/usuarios/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    setBusy(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      window.alert(data.error ?? "No se pudo actualizar al usuario.");
      return;
    }
    router.refresh();
  }

  return (
    <button type="button" className="btn-secondary" onClick={onToggle} disabled={busy}>
      {busy ? "Guardando…" : active ? "Dar de baja" : "Activar"}
    </button>
  );
}
