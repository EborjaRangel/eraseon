"use client";

import { useRef } from "react";

export type SlotPhoto = { slot: number; url: string };

type Props = {
  title: string;
  hint: string;
  kind: "ANTES" | "DESPUES";
  photos: SlotPhoto[];
  pending?: Record<number, string>;
  onPick: (kind: "ANTES" | "DESPUES", slot: number, file: File) => void;
};

export function PhotoSlots({ title, hint, kind, photos, pending = {}, onPick }: Props) {
  return (
    <section className="panel">
      <h2 className="section-title">{title}</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">{hint}</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => {
          const slot = index + 1;
          const saved = photos.find((photo) => photo.slot === slot)?.url;
          const preview = pending[slot] ?? saved;
          return (
            <Slot
              key={slot}
              slot={slot}
              preview={preview}
              onFile={(file) => onPick(kind, slot, file)}
            />
          );
        })}
      </div>
    </section>
  );
}

export function PermisoFoto({ preview, onPick }: { preview?: string; onPick: (file: File) => void }) {
  return (
    <div>
      <p className="label">Permiso firmado</p>
      <p className="mt-1 text-xs text-[var(--muted)]">
        Foto del permiso firmado por el dueño o el representante legal de la barda.
      </p>
      <div className="mt-2 max-w-[11rem]">
        <Slot slot={1} preview={preview} emptyLabel="Permiso" onFile={onPick} />
      </div>
    </div>
  );
}

function Slot({
  slot,
  preview,
  onFile,
  emptyLabel,
}: {
  slot: number;
  preview?: string;
  onFile: (file: File) => void;
  emptyLabel?: string;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  return (
    <div className="overflow-hidden rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-2)]">
      <div className="relative flex aspect-[3/4] items-center justify-center text-xs text-[var(--muted)]">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={`Foto ${slot}`} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span>{emptyLabel ?? `Foto ${slot}`}</span>
        )}
        <span className="absolute bottom-1 left-1 rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--ink)]">
          {slot}
        </span>
      </div>
      <div className="grid grid-cols-2 border-t border-[var(--line)] text-[11px] font-medium">
        <button type="button" className="px-1 py-2 hover:bg-white" onClick={() => cameraRef.current?.click()}>
          Cámara
        </button>
        <button type="button" className="border-l border-[var(--line)] px-1 py-2 hover:bg-white" onClick={() => galleryRef.current?.click()}>
          Galería
        </button>
      </div>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = "";
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = "";
        }}
      />
    </div>
  );
}
