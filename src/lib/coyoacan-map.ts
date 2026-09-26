import type { AnyMap } from "@/lib/init-map";

type Geometry = { type: string; coordinates: unknown };
type FeatureCollection = { features?: Array<{ geometry?: Geometry }> };

function visit(coords: unknown, box: { minLng: number; minLat: number; maxLng: number; maxLat: number }) {
  if (!Array.isArray(coords)) return;
  if (typeof coords[0] === "number" && typeof coords[1] === "number") {
    box.minLng = Math.min(box.minLng, coords[0]);
    box.maxLng = Math.max(box.maxLng, coords[0]);
    box.minLat = Math.min(box.minLat, coords[1]);
    box.maxLat = Math.max(box.maxLat, coords[1]);
    return;
  }
  for (const part of coords) visit(part, box);
}

function boundsOf(collection: FeatureCollection): [[number, number], [number, number]] | null {
  const box = { minLng: Infinity, minLat: Infinity, maxLng: -Infinity, maxLat: -Infinity };
  for (const feature of collection.features ?? []) {
    if (feature.geometry) visit(feature.geometry.coordinates, box);
  }
  if (!Number.isFinite(box.minLng)) return null;
  return [
    [box.minLng, box.minLat],
    [box.maxLng, box.maxLat],
  ];
}

export async function showAlcaldiaCoyoacan(map: AnyMap, fit: boolean) {
  try {
  const [alcaldiaRes, coloniasRes] = await Promise.all([
    fetch("/data/coyoacan-alcaldia.geojson"),
    fetch("/data/coyoacan-colonias.geojson"),
  ]);
  if (!alcaldiaRes.ok) return;
  const alcaldia = (await alcaldiaRes.json()) as FeatureCollection;
  if (!map.getSource("alcaldia")) {
    map.addSource("alcaldia", { type: "geojson", data: alcaldia });
    map.addLayer({
      id: "alcaldia-fill",
      type: "fill",
      source: "alcaldia",
      paint: { "fill-color": "#6d28d9", "fill-opacity": 0.06 },
    });
    map.addLayer({
      id: "alcaldia-line",
      type: "line",
      source: "alcaldia",
      paint: { "line-color": "#5b21b6", "line-width": 2.5 },
    });
  }
  if (coloniasRes.ok && !map.getSource("colonias")) {
    const colonias = await coloniasRes.json();
    map.addSource("colonias", { type: "geojson", data: colonias });
    map.addLayer({
      id: "colonias-line",
      type: "line",
      source: "colonias",
      paint: { "line-color": "#0891b2", "line-width": 1, "line-opacity": 0.55 },
    });
  }
  if (!fit) return;
  const bounds = boundsOf(alcaldia);
  if (bounds) map.fitBounds(bounds, { padding: 28, duration: 0, maxZoom: 13 });
  } catch {
    return;
  }
}
