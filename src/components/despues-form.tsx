"use client";

import { useMemo, useState } from "react";
import { Formik } from "formik";
import { useRouter } from "next/navigation";
import { PhotoSlots, type SlotPhoto } from "@/components/photo-slots";
import { formatRegistro } from "@/lib/format";
import { observacionSchema } from "@/lib/validations";

type Props = {
  bardaId: string;
  consecutivo: number;
  address: string;
  notes: string;
  tieneAntes: boolean;
  terminada: boolean;
  esPintura: boolean;
  despues: SlotPhoto[];
};

async function compress(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.7));
    bitmap.close();
    if (!blob) return file;
    return new File([blob], "foto.jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function DespuesForm({
  bardaId,
  consecutivo,
  address,
  notes: initialNotes,
  tieneAntes,
  terminada: terminadaInicial,
  esPintura,
  despues,
}: Props) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Array<{ slot: number; file: File; preview: string }>>([]);
  const [guardadas, setGuardadas] = useState(despues);
  const [terminada, setTerminada] = useState(terminadaInicial);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pending = useMemo(() => {
    const map: Record<number, string> = {};
    for (const draft of drafts) map[draft.slot] = draft.preview;
    return map;
  }, [drafts]);

  function onPick(slot: number, file: File) {
    if (!tieneAntes) {
      setError("Primero tiene que haber al menos una foto de antes.");
      return;
    }
    const preview = URL.createObjectURL(file);
    setDrafts((current) => {
      const previous = current.find((item) => item.slot === slot);
      if (previous) URL.revokeObjectURL(previous.preview);
      return [...current.filter((item) => item.slot !== slot), { slot, file, preview }];
    });
    setError(null);
  }

  async function subirDrafts() {
    const subidas: SlotPhoto[] = [];
    for (const draft of drafts) {
      setStatus(`Subiendo foto ${draft.slot} de después…`);
      const image = await compress(draft.file);
      const form = new FormData();
      form.set("file", image);
      form.set("kind", "DESPUES");
      form.set("slot", String(draft.slot));
      const upload = await fetch(`/api/bardas/${bardaId}/photos`, { method: "POST", body: form });
      if (!upload.ok) {
        const fail = await upload.json().catch(() => ({}));
        throw new Error(fail.error ?? "Una foto de después no se subió.");
      }
      const saved = (await upload.json()) as { url?: string };
      subidas.push({ slot: draft.slot, url: saved.url ?? draft.preview });
      URL.revokeObjectURL(draft.preview);
    }
    if (subidas.length > 0) {
      setGuardadas((current) => {
        const slots = new Set(subidas.map((photo) => photo.slot));
        return [...current.filter((photo) => !slots.has(photo.slot)), ...subidas];
      });
      setDrafts([]);
    }
  }

  async function onSubmit(values: { notes: string }) {
    const parsed = await observacionSchema.validate(values);
    setSaving(true);
    setError(null);
    setStatus("Guardando observación…");
    const response = await fetch(`/api/bardas/${bardaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: parsed.notes }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setSaving(false);
      setStatus(null);
      setError(data.error ?? "No se pudo guardar la observación.");
      return;
    }
    try {
      await subirDrafts();
    } catch (err) {
      setSaving(false);
      setStatus(null);
      setError(err instanceof Error ? err.message : "La observación se guardó, pero una foto de después no se subió.");
      return;
    }
    router.push(`/bardas/${bardaId}`);
    router.refresh();
  }

  async function marcarTerminada(checked: boolean, notes: string) {
    if (checked && guardadas.length === 0 && drafts.length === 0) {
      setError("Primero elige las fotos de después.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (checked) await subirDrafts();
      setStatus(checked ? "Marcando la barda como terminada…" : "Actualizando la barda…");
      const response = await fetch(`/api/bardas/${bardaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, terminada: checked }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus(null);
        setError(data.error ?? "No se pudo actualizar la barda.");
        return;
      }
      setTerminada(checked);
      setStatus(
        checked
          ? "Barda terminada. Si el globo era rosa quedó dorado; si era gris Oxford quedó naranja."
          : "La barda volvió a su color de trabajo.",
      );
      router.refresh();
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Formik initialValues={{ notes: initialNotes }} validationSchema={observacionSchema} onSubmit={onSubmit}>
    {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <section className="panel">
        <p className="text-sm text-[var(--muted)]">{formatRegistro(consecutivo)}</p>
        <p className="mt-1">{address}</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Aquí solo se cambian las fotos de después y la observación.
        </p>
      </section>

      <section className="panel">
        <label className="label" htmlFor="observacion">Observación</label>
        <textarea
          id="observacion"
          name="notes"
          className="field mt-1 min-h-28"
          maxLength={2000}
          value={values.notes}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Escribe lo que viste en la barda."
        />
        {touched.notes && errors.notes ? <p className="error mt-1">{errors.notes}</p> : null}
      </section>

      <PhotoSlots
        title="Después"
        hint={tieneAntes ? "Puedes tomar o elegir las fotos de la barda ya trabajada." : "Primero tiene que haber al menos una foto de antes."}
        kind="DESPUES"
        photos={guardadas}
        pending={pending}
        disabled={!tieneAntes}
        onPick={(_kind, slot, file) => onPick(slot, file)}
      />

      {esPintura && (guardadas.length > 0 || drafts.length > 0) ? (
        <label className="panel flex items-start gap-3">
          <input
            className="mt-1 h-5 w-5"
            type="checkbox"
            checked={terminada}
            disabled={saving || isSubmitting}
            onChange={(event) => void marcarTerminada(event.target.checked, values.notes)}
          />
          <span>
            <span className="font-semibold">Barda terminada</span>
            <span className="mt-1 block text-sm text-[var(--muted)]">
              Al marcarlo, un globo rosa pasa a dorado y un globo gris Oxford pasa a naranja.
            </span>
          </span>
        </label>
      ) : null}

      {error ? <p className="error">{error}</p> : null}
      {status ? <p className="text-sm text-[var(--muted)]">{status}</p> : null}
      <button className="btn-primary" type="submit" disabled={saving || isSubmitting}>
        {saving || isSubmitting ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
    )}
    </Formik>
  );
}
