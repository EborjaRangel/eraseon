"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormikProvider, useFormik } from "formik";
import { EraseMapLoader } from "@/components/erase-map-loader";
import { PermisoFoto, PhotoSlots, type SlotPhoto } from "@/components/photo-slots";
import { areaM2 } from "@/lib/area";
import { formatArea, formatRegistro } from "@/lib/format";
import { bardaEdicionSchema, bardaSchema, yupToFormErrors } from "@/lib/validations";

const COYOACAN = { latitude: 19.3467, longitude: -99.1617 };

type Cercana = {
  id: string;
  consecutivo: number;
  address: string;
  usuario: string;
  metros: number;
};

type PhotoKind = "ANTES" | "DESPUES" | "PERMISO";
type Draft = { kind: PhotoKind; slot: number; file: File; preview: string };

type BardaValues = {
  address: string;
  notes: string;
  tipo: "PUBLICA" | "PRIVADA";
  permisoFirmado: boolean;
  alto: string;
  ancho: string;
  colorGlobo: "" | "ROSA" | "GRIS";
};

type Props = {
  mode: "create" | "edit";
  bardaId?: string;
  initial?: {
    address: string;
    notes: string;
    tipo: "PUBLICA" | "PRIVADA";
    permisoFirmado: boolean;
    latitude: number;
    longitude: number;
    altoMetros: number;
    anchoMetros: number;
    consecutivo: number;
    colorGlobo?: "ROSA" | "GRIS" | null;
    photos: Array<SlotPhoto & { kind: PhotoKind }>;
  };
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

export function BardaForm({ mode, bardaId, initial }: Props) {
  const router = useRouter();
  const [point, setPoint] = useState(
    initial ? { latitude: initial.latitude, longitude: initial.longitude } : COYOACAN
  );
  const [registro, setRegistro] = useState(initial ? formatRegistro(initial.consecutivo) : "…");
  const [consecutivo, setConsecutivo] = useState<number | null>(initial?.consecutivo ?? null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [revisarCercanas, setRevisarCercanas] = useState(false);
  const [cercanas, setCercanas] = useState<Cercana[]>([]);
  const submitRef = useRef<(values: BardaValues) => Promise<void>>(async () => undefined);
  const setFieldValueRef = useRef<(field: string, value: string) => void>(() => undefined);
  const formik = useFormik<BardaValues>({
    initialValues: {
      address: initial?.address ?? "",
      notes: initial?.notes ?? "",
      tipo: initial?.tipo ?? "PUBLICA",
      permisoFirmado: initial?.permisoFirmado ?? false,
      alto: initial ? String(initial.altoMetros) : "",
      ancho: initial ? String(initial.anchoMetros) : "",
      colorGlobo: initial?.colorGlobo === "ROSA" || initial?.colorGlobo === "GRIS" ? initial.colorGlobo : "",
    },
    enableReinitialize: true,
    validate: (values) => {
      try {
        const schema = mode === "create" || initial?.colorGlobo ? bardaSchema : bardaEdicionSchema;
        schema.validateSync(
          {
            address: values.address,
            notes: values.notes,
            tipo: values.tipo,
            permisoFirmado: values.tipo === "PRIVADA" || values.permisoFirmado,
            latitude: point.latitude,
            longitude: point.longitude,
            altoMetros: Number(values.alto.replace(",", ".")),
            anchoMetros: Number(values.ancho.replace(",", ".")),
            colorGlobo: values.colorGlobo,
          },
          { abortEarly: false }
        );
        return {};
      } catch (err) {
        const mapped = yupToFormErrors(err) ?? {};
        const errors: Record<string, string> = {};
        for (const [key, message] of Object.entries(mapped)) {
          const name = key === "altoMetros" ? "alto" : key === "anchoMetros" ? "ancho" : key;
          if (name === "latitude" || name === "longitude") {
            errors.address = errors.address ?? "Falta la ubicación.";
          } else if (!errors[name]) {
            errors[name] = message;
          }
        }
        return errors;
      }
    },
    onSubmit: (values) => submitRef.current(values),
  });
  setFieldValueRef.current = (field, value) => {
    void formik.setFieldValue(field, value);
  };

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

  useEffect(() => {
    if (mode !== "create" || initial) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      setPoint({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      setRevisarCercanas(true);
    });
  }, [mode, initial]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetch(`/api/geocode?lat=${point.latitude}&lng=${point.longitude}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { address?: string } | null) => {
          if (data?.address) void setFieldValueRef.current("address", data.address);
        })
        .catch(() => undefined);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [point.latitude, point.longitude]);

  useEffect(() => {
    if (mode !== "create" || !revisarCercanas) {
      setCercanas([]);
      return;
    }
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({
        lat: String(point.latitude),
        lng: String(point.longitude),
      });
      void fetch(`/api/bardas/cerca?${params}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data: Cercana[]) => setCercanas(Array.isArray(data) ? data : []))
        .catch(() => setCercanas([]));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [mode, revisarCercanas, point.latitude, point.longitude]);

  const { values } = formik;
  const altoN = Number(values.alto.replace(",", "."));
  const anchoN = Number(values.ancho.replace(",", "."));
  const area = Number.isFinite(altoN) && Number.isFinite(anchoN) && altoN > 0 && anchoN > 0 ? areaM2(altoN, anchoN) : null;

  const pending = useMemo(() => {
    const map: Record<PhotoKind, Record<number, string>> = { ANTES: {}, DESPUES: {}, PERMISO: {} };
    for (const draft of drafts) map[draft.kind][draft.slot] = draft.preview;
    return map;
  }, [drafts]);

  async function onPick(kind: PhotoKind, slot: number, file: File) {
    if (kind === "DESPUES") {
      const hayAntes = antes.length > 0 || drafts.some((draft) => draft.kind === "ANTES");
      if (!hayAntes) {
        setError("Primero sube al menos una foto de antes.");
        return;
      }
    }
    const preview = URL.createObjectURL(file);
    setDrafts((current) => {
      const previous = current.find((item) => item.kind === kind && item.slot === slot);
      if (previous) URL.revokeObjectURL(previous.preview);
      return [...current.filter((item) => !(item.kind === kind && item.slot === slot)), { kind, slot, file, preview }];
    });
  }

  submitRef.current = async (formValues) => {
    const payload = {
      address: formValues.address,
      notes: formValues.notes,
      tipo: formValues.tipo,
      permisoFirmado: formValues.tipo === "PRIVADA" || formValues.permisoFirmado,
      latitude: point.latitude,
      longitude: point.longitude,
      altoMetros: Number(formValues.alto.replace(",", ".")),
      anchoMetros: Number(formValues.ancho.replace(",", ".")),
      colorGlobo: formValues.colorGlobo,
    };
    setSaving(true);
    setError(null);
    setStatus("Guardando registro…");
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
    const pidePermiso = formValues.tipo === "PRIVADA" || formValues.permisoFirmado;
    const orden = { ANTES: 0, PERMISO: 1, DESPUES: 2 };
    const toUpload = (pidePermiso ? drafts : drafts.filter((draft) => draft.kind !== "PERMISO")).sort(
      (a, b) => orden[a.kind] - orden[b.kind]
    );
    for (const draft of toUpload) {
      const etiqueta =
        draft.kind === "PERMISO" ? "del permiso firmado" : `${draft.slot} de ${draft.kind === "ANTES" ? "antes" : "después"}`;
      setStatus(`Subiendo foto ${etiqueta}…`);
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
        setError(fail.error ?? "El registro se guardó, pero una foto no se subió. Vuelve a elegirla.");
        router.push(`/bardas/${id}/editar`);
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
        setRevisarCercanas(true);
        setError(null);
      },
      () => setError("No se pudo leer el GPS. Coloca el globo en el mapa.")
    );
  }

  const antes = initial?.photos.filter((photo) => photo.kind === "ANTES") ?? [];
  const despues = initial?.photos.filter((photo) => photo.kind === "DESPUES") ?? [];
  const permisoGuardado = initial?.photos.find((photo) => photo.kind === "PERMISO")?.url;
  const permisoPreview = pending.PERMISO[1] ?? permisoGuardado;
  const muestraPermiso = values.tipo === "PRIVADA" || values.permisoFirmado;
  const tieneAntes = antes.length > 0 || Object.keys(pending.ANTES).length > 0;

  return (
    <FormikProvider value={formik}>
    <form onSubmit={formik.handleSubmit} className="space-y-4">
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
          <input id="address" name="address" className="field mt-1" value={values.address} onChange={formik.handleChange} onBlur={formik.handleBlur} required />
          {formik.touched.address && formik.errors.address ? <p className="error mt-1">{formik.errors.address}</p> : null}
          <p className="mt-1 text-xs text-[var(--muted)]">Se actualiza al mover el globo en Mapbox.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="alto">Alto (metros)</label>
            <input id="alto" name="alto" inputMode="decimal" className="field mt-1" value={values.alto} onChange={formik.handleChange} onBlur={formik.handleBlur} required />
            {formik.touched.alto && formik.errors.alto ? <p className="error mt-1">{formik.errors.alto}</p> : null}
          </div>
          <div>
            <label className="label" htmlFor="ancho">Ancho (metros)</label>
            <input id="ancho" name="ancho" inputMode="decimal" className="field mt-1" value={values.ancho} onChange={formik.handleChange} onBlur={formik.handleBlur} required />
            {formik.touched.ancho && formik.errors.ancho ? <p className="error mt-1">{formik.errors.ancho}</p> : null}
          </div>
          <div>
            <p className="label">Área</p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-2xl text-[var(--brush)]">
              {area == null ? "—" : formatArea(area)}
            </p>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="colorGlobo">Color del globo</label>
          <select
            id="colorGlobo"
            name="colorGlobo"
            className="field mt-1"
            value={values.colorGlobo}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          >
            {mode === "create" || !initial?.colorGlobo ? <option value="">Elige el color</option> : null}
            <option value="ROSA">Rosa</option>
            <option value="GRIS">Gris Oxford</option>
          </select>
          {formik.touched.colorGlobo && formik.errors.colorGlobo ? (
            <p className="error mt-1">{formik.errors.colorGlobo}</p>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="tipo">Tipo de barda</label>
            <select id="tipo" name="tipo" className="field mt-1" value={values.tipo} onChange={formik.handleChange} onBlur={formik.handleBlur}>
              <option value="PUBLICA">Barda pública</option>
              <option value="PRIVADA">Barda privada</option>
            </select>
          </div>
          {values.tipo === "PUBLICA" ? (
            <div>
              <label className="label" htmlFor="permiso">Permiso firmado</label>
              <select
                id="permiso"
                name="permisoFirmado"
                className="field mt-1"
                value={values.permisoFirmado ? "SI" : "NO"}
                onChange={(e) => void formik.setFieldValue("permisoFirmado", e.target.value === "SI")}
                onBlur={formik.handleBlur}
              >
                <option value="NO">No</option>
                <option value="SI">Sí</option>
              </select>
            </div>
          ) : null}
        </div>
        {muestraPermiso ? <PermisoFoto preview={permisoPreview} onPick={(file) => onPick("PERMISO", 1, file)} /> : null}
        <div>
          <label className="label" htmlFor="notes">Observación</label>
          <textarea id="notes" name="notes" className="field mt-1 min-h-24" value={values.notes} onChange={formik.handleChange} onBlur={formik.handleBlur} />
          {formik.touched.notes && formik.errors.notes ? <p className="error mt-1">{formik.errors.notes}</p> : null}
        </div>
      </section>

      <section className="panel">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="section-title">Ubicación</h2>
            <p className="text-sm text-[var(--muted)]">Al abrir el registro se usa el GPS del dispositivo. Mueve el globo si hay que corregir el punto.</p>
          </div>
          <button type="button" className="btn-secondary" onClick={useGps}>Usar mi ubicación</button>
        </div>
        <EraseMapLoader
          pick={point}
          onPick={(latitude, longitude) => {
            setPoint({ latitude, longitude });
            setRevisarCercanas(true);
          }}
          heightClass="h-80"
        />
        <p className="mt-2 text-xs text-[var(--muted)]">
          {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
        </p>
        {cercanas.length > 0 ? (
          <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm">
            <p className="font-medium text-amber-950">
              Hay {cercanas.length === 1 ? "un levantamiento" : `${cercanas.length} levantamientos`} a 40 m o menos. Ábrelo para confirmar que no es la misma barda.
            </p>
            <ul className="mt-2 space-y-1">
              {cercanas.map((cercana) => (
                <li key={cercana.id}>
                  <Link className="font-semibold text-[var(--magic)]" href={`/bardas/${cercana.id}`}>
                    {formatRegistro(cercana.consecutivo)}
                  </Link>
                  {` · a ${cercana.metros} m · ${cercana.usuario} · ${cercana.address}`}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
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
        hint={tieneAntes ? "Cinco fotos de la misma barda ya trabajada." : "Primero sube al menos una foto de antes."}
        kind="DESPUES"
        photos={despues}
        pending={pending.DESPUES}
        disabled={!tieneAntes}
        onPick={onPick}
      />

      {error ? <p className="error">{error}</p> : null}
      {status ? <p className="text-sm text-[var(--muted)]">{status}</p> : null}
      <button className="btn-primary" type="submit" disabled={saving || formik.isSubmitting}>
        {saving || formik.isSubmitting ? "Guardando…" : mode === "create" ? "Registrar barda" : "Guardar cambios"}
      </button>
    </form>
    </FormikProvider>
  );
}
