import { NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/geocode";
import { requireUser } from "@/lib/session";

export async function GET(request: Request) {
  const { error } = await requireUser();
  if (error) return error;
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Ubicación inválida." }, { status: 400 });
  }
  try {
    const address = await reverseGeocode(lng, lat);
    return NextResponse.json({ address });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo leer la dirección.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
