"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EraseMapLoader } from "@/components/erase-map-loader";
import { PhotoSlots, type SlotPhoto } from "@/components/photo-slots";
import { areaM2 } from "@/lib/area";
import { formatArea, formatRegistro } from "@/lib/format";

const COYOACAN = { latitude: 19.3467, longitude: -99.1617 };

type Draft = { kind: "ANTES" | "DESPUES"; slot: number; file: File; preview: string };

type Props = {
  mode: "create" | "edit";
  bardaId?: string;
  initial?: {
    address: string;
    notes: string;
    latitude: number;
    longitude: number;
    altoMetros: number;
    anchoMetros: number;
    consecutivo: number;
    photos: Array<SlotPhoto & { kind: "ANTES" | "DESPUES" }>;
  };
};

async function compress(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.72));
  bitmap.close();
  if (!blob) return file;
  return new File([blob], "foto.jpg", { type: "image/jpeg" });
}

export function BardaForm({ mode, bardaId, initial }: Props) {
  const router = useRouter();
  const [address, setAddress] = useState(initial?.address ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [alto, setAlto] = useState(initial ? String(initial.altoMetros) : "");
  const [ancho, setAncho] = useState(initial ? String(initial.anchoMetros) : "");
  const [point, setPoint] = useState(
    initial ? { latitude: initial.latitude, longitude: initial.longitude } : COYOACAN
  );
  const [registro, setRegistro] = useState(initial ? formatRegistro(initial.consecutivo) : "…");
  const [consecutivo, setConsecutivo] = useState<number | null>(initial?.consecutivo ?? null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode !== "create") return;
    let cancelled = false;
    void fetch("/api/bardas/next")
      .then((res) => res.json())
      .then((data: { registro?: string; consecutivo?: number }) => {
        if (cancelled) return;
        if (data.registro) setRegistro(data.registro);
        if (data.consecutivo) setConsecutivo(data.consecutivo);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const altoN = Number(alto.replace(",", "."));
  const anchoN = Number(ancho.replace(",", "."));
  const area = Number.isFinite(altoN) && Number.isFinite(anchoN) && altoN > 0 && anchoN > 0 ? areaM2(altoN, anchoN) : null;

  const pending = useMemo(() => {
    const map: Record<"ANTES" | "DESPUES", Record<number, string>> = { ANTES: {}, DESPUES: {} };
    for (const draft of drafts) map[draft.kind][draft.slot] = draft.preview;
    return map;
  }, [drafts]);

  async function onPick(kind: "ANTES" | "DESPUES", slot: number, file: File) {
    const preview = URL.createObjectURL(file);
    setDrafts((current) => {
      const previous = current.find((item) => item.kind === kind && item.slot === slot);
      if (previous) URL.revokeObjectURL(previous.preview);
      return [...current.filter((item) => !(item.kind === kind && item.slot === slot)), { kind, slot, file, preview }];
    });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setStatus("Guardando registro…");
    const payload = {
      address,
      notes,
      latitude: point.latitude,
      longitude: point.longitude,
      altoMetros: altoN,
      anchoMetros: anchoN,
    };
    const response = await fetch(mode === "create" ? "/api/bardas" : `/api/bardas/${bardaId}`, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setSaving(false);
      setStatus(null);
      setError(data.error ?? "No se pudo guardar.");
      return;
    }
    const id = data.id as string;
    for (const draft of drafts) {
      setStatus(`Subiendo foto ${draft.slot} de ${draft.kind === "ANTES" ? "antes" : "después"}…`);
      const image = await compress(draft.file);
      const form = new FormData();
      form.set("file", image);
      form.set("kind", draft.kind);
      form.set("slot", String(draft.slot));
      const upload = await fetch(`/api/bardas/${id}/photos`, { method: "POST", body: form });
      if (!upload.ok) {
        const fail = await upload.json().catch(() => ({}));
        setSaving(false);
        setStatus(null);
        setError(fail.error ?? "El registro se guardó, pero una foto no se subió.");
        router.push(`/bardas/${id}`);
        return;
      }
    }
    router.push(`/bardas/${id}`);
    router.refresh();
  }

  async function useGps() {
    if (!navigator.geolocation) {
      setError("Este navegador no comparte la ubicación.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPoint({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setError(null);
      },
      () => setError("No se pudo leer el GPS. Coloca el globo en el mapa.")
    );
  }

  const antes = initial?.photos.filter((photo) => photo.kind === "ANTES") ?? [];
  const despues = initial?.photos.filter((photo) => photo.kind === "DESPUES") ?? [];

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <section className="panel">
        <p className="text-sm text-[var(--muted)]">Registro único</p>
        <p className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--magic)]">{registro}</p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          El globo del mapa llevará el consecutivo {consecutivo ?? "—"}. La fecha y hora se guardan al registrar.
        </p>
      </section>

      <section className="panel space-y-4">
        <div>
          <label className="label" htmlFor="address">Dirección de la barda</label>
          <input id="address" className="field mt-1" value={address} onChange={(e) => setAddress(e.target.value)} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="alto">Alto (metros)</label>
            <input id="alto" inputMode="decimal" className="field mt-1" value={alto} onChange={(e) => setAlto(e.target.value)} required />
          </div>
          <div>
            <label className="label" htmlFor="ancho">Ancho (metros)</label>
            <input id="ancho" inputMode="decimal" className="field mt-1" value={ancho} onChange={(e) => setAncho(e.target.value)} required />
          </div>
          <div>
            <p className="label">Área</p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-2xl text-[var(--brush)]">
              {area == null ? "—" : formatArea(area)}
            </p>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="notes">Notas</label>
          <textarea id="notes" className="field mt-1 min-h-24" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </section>

      <section className="panel">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="section-title">Ubicación</h2>
            <p className="text-sm text-[var(--muted)]">Toca el mapa o arrastra el globo. También puedes usar el GPS.</p>
          </div>
          <button type="button" className="btn-secondary" onClick={useGps}>Usar mi ubicación</button>
        </div>
        <EraseMapLoader pick={point} onPick={(latitude, longitude) => setPoint({ latitude, longitude })} heightClass="h-80" />
        <p className="mt-2 text-xs text-[var(--muted)]">
          {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
        </p>
      </section>

      <PhotoSlots
        title="Antes"
        hint="Cinco fotos de la barda antes de la brocha mágica."
        kind="ANTES"
        photos={antes}
        pending={pending.ANTES}
        onPick={onPick}
      />
      <PhotoSlots
        title="Después"
        hint="Cinco fotos de la misma barda ya trabajada."
        kind="DESPUES"
        photos={despues}
        pending={pending.DESPUES}
        onPick={onPick}
      />

      {error ? <p className="error">{error}</p> : null}
      {status ? <p className="text-sm text-[var(--muted)]">{status}</p> : null}
      <button className="btn-primary" type="submit" disabled={saving}>
        {saving ? "Guardando…" : mode === "create" ? "Registrar barda" : "Guardar cambios"}
      </button>
    </form>
  );
}
