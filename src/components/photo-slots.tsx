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

function Slot({ slot, preview, onFile }: { slot: number; preview?: string; onFile: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="relative flex aspect-[3/4] flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-2)] text-xs text-[var(--muted)]"
    >
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt={`Foto ${slot}`} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span>Foto {slot}</span>
      )}
      <span className="absolute bottom-1 left-1 rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--ink)]">
        {slot}
      </span>
      <input
        ref={inputRef}
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
    </button>
  );
}
