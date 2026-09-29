"use client";

import { useEffect, useState } from "react";

type Photo = { id: string; slot: number; url: string };

export function PhotoGallery({
  title,
  photos,
  registro,
  archivo,
}: {
  title: string;
  photos: Photo[];
  registro: string;
  archivo: string;
}) {
  const [picked, setPicked] = useState<Photo | null>(null);

  return (
    <section className="panel">
      <h2 className="section-title">{title}</h2>
      <p className="mt-1 text-xs text-[var(--muted)]">Toca una foto para bajarla a tu dispositivo.</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => {
          const slot = index + 1;
          const photo = photos.find((item) => item.slot === slot);
          return (
            <div key={slot} className="relative aspect-[3/4] overflow-hidden rounded-xl bg-[var(--surface-2)]">
              {photo ? (
                <button
                  type="button"
                  className="block h-full w-full cursor-pointer"
                  onClick={() => setPicked(photo)}
                  aria-label={`Bajar ${title} ${slot}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={`${title} ${slot}`} className="h-full w-full object-cover" />
                </button>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-[var(--muted)]">Foto {slot}</div>
              )}
            </div>
          );
        })}
      </div>
      {picked ? (
        <DownloadPhotoDialog
          url={picked.url}
          filename={`${registro}-${archivo}-${picked.slot}.jpg`}
          label={`${title} ${picked.slot}`}
          onClose={() => setPicked(null)}
        />
      ) : null}
    </section>
  );
}

export function ClickablePhoto({
  url,
  filename,
  label,
  className,
  imgClassName,
}: {
  url: string;
  filename: string;
  label: string;
  className?: string;
  imgClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={`block cursor-pointer ${className ?? ""}`} onClick={() => setOpen(true)} aria-label={`Bajar ${label}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={label} className={imgClassName} />
      </button>
      {open ? <DownloadPhotoDialog url={url} filename={filename} label={label} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function DownloadPhotoDialog({
  url,
  filename,
  label,
  onClose,
}: {
  url: string;
  filename: string;
  label: string;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function bajar() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("fail");
      const blob = await response.blob();
      const file = new File([blob], filename, { type: "image/jpeg" });
      const ios = /iPad|iPhone|iPod/i.test(navigator.userAgent);
      if (ios && typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: label });
        onClose();
        return;
      }
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      onClose();
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      setError("No se pudo bajar la fotografía.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bajar-foto-titulo"
      onClick={onClose}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-lg" onClick={(event) => event.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={label} className="mx-auto max-h-64 w-full rounded-xl object-contain" />
        <h2 id="bajar-foto-titulo" className="mt-3 text-lg font-semibold text-[var(--header)]">
          ¿Bajar esta fotografía?
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Se guarda en tu dispositivo como {filename}.</p>
        {error ? <p className="error mt-2">{error}</p> : null}
        <div className="mt-4 flex gap-2">
          <button type="button" className="btn-primary flex-1" onClick={bajar} disabled={busy}>
            {busy ? "Bajando…" : "Bajar al dispositivo"}
          </button>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
