"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ValidationError } from "yup";
import { usuarioSchema } from "@/lib/validations";

export function UsuarioForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"USUARIO" | "ADMIN">("USUARIO");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const payload = { name, email, password, role };
    try {
      await usuarioSchema.validate(payload);
    } catch (err) {
      setError(err instanceof ValidationError ? err.message : "Revisa los datos.");
      return;
    }
    setSaving(true);
    setError(null);
    const response = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError(data.error ?? "No se pudo dar de alta al usuario.");
      return;
    }
    setName("");
    setEmail("");
    setPassword("");
    setRole("USUARIO");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="panel grid gap-4 sm:grid-cols-2">
      <div>
        <label className="label" htmlFor="nombre">Nombre</label>
        <input id="nombre" className="field mt-1" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label className="label" htmlFor="correo">Correo</label>
        <input id="correo" type="email" className="field mt-1" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <label className="label" htmlFor="clave">Contraseña</label>
        <input id="clave" type="password" className="field mt-1" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <div>
        <label className="label" htmlFor="rol">Tipo</label>
        <select id="rol" className="field mt-1" value={role} onChange={(e) => setRole(e.target.value as "USUARIO" | "ADMIN")}>
          <option value="USUARIO">Usuario</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      {error ? <p className="error sm:col-span-2">{error}</p> : null}
      <div className="sm:col-span-2">
        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? "Guardando…" : "Dar de alta"}
        </button>
      </div>
    </form>
  );
}
