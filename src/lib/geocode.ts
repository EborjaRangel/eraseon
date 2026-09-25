import { MAPBOX_TOKEN } from "@/lib/mapbox-config";

export async function reverseGeocode(lng: number, lat: number): Promise<string> {
  if (!MAPBOX_TOKEN) return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`);
  url.searchParams.set("language", "es");
  url.searchParams.set("limit", "1");
  url.searchParams.set("types", "address,poi,neighborhood,locality");
  url.searchParams.set("access_token", MAPBOX_TOKEN);
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error("Mapbox no devolvió la dirección.");
  const data = (await response.json()) as { features?: Array<{ place_name_es?: string; place_name?: string }> };
  const name = data.features?.[0]?.place_name_es || data.features?.[0]?.place_name;
  if (!name) throw new Error("No hay dirección para ese globo.");
  return name;
}
