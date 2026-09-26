export function permisoFirmadoDe(tipo: "PUBLICA" | "PRIVADA", requested: unknown) {
  return tipo === "PRIVADA" || requested === true;
}
