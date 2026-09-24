import { BardaForm } from "@/components/barda-form";

export default function NuevaBardaPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--header)]">Nueva barda</h1>
        <p className="text-sm text-[var(--muted)]">Mide alto y ancho, coloca el globo y sube hasta cinco fotos de antes y cinco de después.</p>
      </div>
      <BardaForm mode="create" />
    </div>
  );
}
