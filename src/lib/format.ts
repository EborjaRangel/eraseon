export function formatRegistro(consecutivo: number): string {
  return `EO-${String(consecutivo).padStart(4, "0")}`;
}

export function formatFechaHora(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Mexico_City",
  }).format(date);
}

export function formatMetros(value: number): string {
  return `${value.toLocaleString("es-MX", { maximumFractionDigits: 2 })} m`;
}

export function formatArea(value: number): string {
  return `${value.toLocaleString("es-MX", { maximumFractionDigits: 2 })} m²`;
}
