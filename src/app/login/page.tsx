"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ValidationError } from "yup";
import { loginSchema } from "@/lib/validations";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await loginSchema.validate({ email, password });
    } catch (err) {
      setError(err instanceof ValidationError ? err.message : "Revisa los datos.");
      return;
    }
    setBusy(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setBusy(false);
    if (!result || result.error) {
      setError("Correo o contraseña incorrectos.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4">
      <div className="flex items-center gap-3">
        <span className="brush-mark" aria-hidden="true" />
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--header)]">EraseOn</h1>
          <p className="text-sm text-[var(--muted)]">Entra con tu usuario para registrar bardas.</p>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="email">Correo</label>
        <input id="email" type="email" autoComplete="username" className="field mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="password">Contraseña</label>
        <input id="password" type="password" autoComplete="current-password" className="field mt-1" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {error ? <p className="error">{error}</p> : null}
      <button className="btn-primary w-full" type="submit" disabled={busy}>
        {busy ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
