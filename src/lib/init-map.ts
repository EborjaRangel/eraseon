import type { Map as MapboxMap } from "mapbox-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import { FREE_MAP_STYLE, MAPBOX_STYLE, MAPBOX_TOKEN } from "@/lib/mapbox-config";

export type AnyMap = {
  remove: () => void;
  on: (...args: unknown[]) => unknown;
  off: (...args: unknown[]) => unknown;
  once: (type: string, listener: (...args: unknown[]) => void) => unknown;
  getCanvas: () => HTMLCanvasElement;
  flyTo: (options: unknown) => void;
  isStyleLoaded: () => boolean;
  project: (lngLat: [number, number]) => { x: number; y: number };
  addControl: (control: unknown, position?: string) => void;
  getSource: (id: string) => unknown;
  addSource: (id: string, source: unknown) => void;
  addLayer: (layer: unknown) => void;
  fitBounds: (bounds: [[number, number], [number, number]], options?: unknown) => void;
};

type RawMap = MapboxMap | MapLibreMap;

type InitOptions = {
  container: HTMLElement;
  center: [number, number];
  zoom: number;
  onReady: (map: AnyMap, provider: "mapbox" | "maplibre") => void;
  onError?: (message: string) => void;
};

export async function initBasemap(options: InitOptions): Promise<() => void> {
  let disposed = false;
  let map: RawMap | null = null;
  let usedFallback = false;

  const cleanup = () => {
    disposed = true;
    if (map) {
      map.remove();
      map = null;
    }
  };

  async function startMaplibre() {
    if (disposed || usedFallback) return;
    usedFallback = true;
    if (map) {
      map.remove();
      map = null;
    }

    const maplibregl = await import("maplibre-gl");
    await import("maplibre-gl/dist/maplibre-gl.css");
    if (disposed) return;

    // En el build de producción el worker que trae la librería no arranca.
    maplibregl.setWorkerUrl("/vendor/maplibre/maplibre-gl-worker.js");

    const libreMap = new maplibregl.Map({
      container: options.container,
      style: FREE_MAP_STYLE,
      center: options.center,
      zoom: options.zoom,
      attributionControl: {},
      cooperativeGestures: true,
    });
    libreMap.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map = libreMap;

    const ready = () => {
      if (!disposed) options.onReady(libreMap as unknown as AnyMap, "maplibre");
    };
    if (libreMap.isStyleLoaded()) ready();
    else libreMap.once("load", ready);
    window.setTimeout(() => {
      if (!disposed && !libreMap.isStyleLoaded()) {
        options.onError?.("No se pudo cargar el mapa.");
      }
    }, 8000);
  }

  async function startMapbox() {
    if (!MAPBOX_TOKEN) {
      await startMaplibre();
      return;
    }

    const mapboxgl = (await import("mapbox-gl")).default;
    await import("mapbox-gl/dist/mapbox-gl.css");
    if (disposed) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    mapboxgl.workerUrl = "/vendor/mapbox/mapbox-gl-csp-worker.js";

    const boxMap = new mapboxgl.Map({
      container: options.container,
      style: MAPBOX_STYLE,
      center: options.center,
      zoom: options.zoom,
      attributionControl: true,
      cooperativeGestures: true,
    });
    boxMap.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map = boxMap;

    let settled = false;
    const succeed = () => {
      if (disposed || settled) return;
      settled = true;
      options.onReady(boxMap as unknown as AnyMap, "mapbox");
    };
    const failToLibre = () => {
      if (disposed || settled || usedFallback) return;
      settled = true;
      void startMaplibre();
    };

    boxMap.once("load", succeed);
    boxMap.once("error", () => {
      if (!boxMap.isStyleLoaded()) failToLibre();
    });
    window.setTimeout(() => {
      if (!disposed && !settled && !boxMap.isStyleLoaded()) failToLibre();
    }, 6000);
  }

  try {
    await startMapbox();
  } catch (err) {
    options.onError?.(err instanceof Error ? err.message : "Error al iniciar mapa");
    await startMaplibre();
  }

  return cleanup;
}
