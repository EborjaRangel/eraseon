"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { initBasemap, type AnyMap } from "@/lib/init-map";
import { CENTRO_COYOACAN } from "@/lib/mapbox-config";
import { formatArea, formatFechaHora, formatMetros, formatRegistro } from "@/lib/format";

export type MapBarda = {
  id: string;
  consecutivo: number;
  address: string;
  latitude: number;
  longitude: number;
  altoMetros: number;
  anchoMetros: number;
  areaM2: number;
  createdAt: string;
  antes: number;
  despues: number;
};

type Pin = { id: string; latitude: number; longitude: number; consecutivo?: number; antes?: number; despues?: number };

type Props = {
  bardas?: MapBarda[];
  pick?: { latitude: number; longitude: number } | null;
  onPick?: (latitude: number, longitude: number) => void;
  heightClass?: string;
};

export function EraseMap({ bardas = [], pick = null, onPick, heightClass = "h-[min(70vh,640px)]" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<AnyMap | null>(null);
  const balloonElsRef = useRef(new Map<string, HTMLButtonElement>());
  const onPickRef = useRef(onPick);
  const [mapVersion, setMapVersion] = useState(0);
  const [provider, setProvider] = useState<"mapbox" | "maplibre" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dropReady, setDropReady] = useState(false);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  const pins: Pin[] = onPick
    ? pick
      ? [{ id: "pick", latitude: pick.latitude, longitude: pick.longitude }]
      : []
    : bardas.map((barda) => ({
        id: barda.id,
        latitude: barda.latitude,
        longitude: barda.longitude,
        consecutivo: barda.consecutivo,
        antes: barda.antes,
        despues: barda.despues,
      }));

  const start = pick
    ? { lat: pick.latitude, lng: pick.longitude }
    : bardas[0]
      ? { lat: bardas[0].latitude, lng: bardas[0].longitude }
      : CENTRO_COYOACAN;

  useEffect(() => {
    let cancelled = false;
    let dispose: (() => void) | undefined;
    const container = containerRef.current;
    if (!container) return;

    void initBasemap({
      container,
      center: [start.lng, start.lat],
      zoom: onPick ? 15 : 13,
      onError: (message) => {
        if (!cancelled) setError(`Mapbox: ${message}. Usando mapa alterno.`);
      },
      onReady: (map, usedProvider) => {
        if (cancelled) return;
        mapRef.current = map;
        setProvider(usedProvider);
        if (usedProvider === "mapbox") setError(null);
        setMapVersion((value) => value + 1);
        if (onPickRef.current) {
          map.on("click", (event: unknown) => {
            const lngLat = (event as { lngLat?: { lng: number; lat: number } }).lngLat;
            if (lngLat) onPickRef.current?.(lngLat.lat, lngLat.lng);
          });
        }
      },
    }).then((cleanup) => {
      if (cancelled) cleanup();
      else dispose = cleanup;
    });

    return () => {
      cancelled = true;
      dispose?.();
      mapRef.current = null;
    };
    // El mapa se crea una vez; el globo se mueve en el efecto de posición.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !pick) return;
    const center = map.project([pick.longitude, pick.latitude]);
    const box = containerRef.current?.getBoundingClientRect();
    if (!box) return;
    const outside = center.x < 40 || center.y < 40 || center.x > box.width - 40 || center.y > box.height - 40;
    if (outside) map.flyTo({ center: [pick.longitude, pick.latitude], zoom: 16 });
  }, [pick]);

  useLayoutEffect(() => {
    const map = mapRef.current;
    if (!map?.project || mapVersion === 0) return;

    let raf = 0;
    const sync = () => {
      const width = overlayRef.current?.clientWidth ?? 0;
      const height = overlayRef.current?.clientHeight ?? 0;
      for (const pin of pins) {
        const el = balloonElsRef.current.get(pin.id);
        if (!el) continue;
        const point = map.project([pin.longitude, pin.latitude]);
        const x = Math.round(point.x);
        const y = Math.round(point.y);
        const off = x < -48 || y < -48 || x > width + 48 || y > height + 48;
        el.style.visibility = off ? "hidden" : "visible";
        el.style.pointerEvents = off ? "none" : "auto";
        el.style.setProperty("--x", `${x}px`);
        el.style.setProperty("--y", `${y}px`);
        if (onPick || el.dataset.landed === "1") {
          el.style.animation = "none";
          el.style.opacity = "1";
          el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
        }
      }
      if (!onPick) setDropReady(true);
    };
    const onMove = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        sync();
      });
    };
    sync();
    map.on("move", onMove);
    map.on("resize", onMove);
    return () => {
      window.cancelAnimationFrame(raf);
      map.off("move", onMove);
      map.off("resize", onMove);
    };
  }, [pins, mapVersion]);

  const dropOrder = new Map(
    [...pins]
      .filter((pin) => pin.id !== "pick")
      .sort((a, b) => (a.consecutivo ?? 0) - (b.consecutivo ?? 0))
      .map((pin, index) => [pin.id, index])
  );
  const selected = bardas.find((barda) => barda.id === selectedId) ?? null;

  return (
    <div className="space-y-2">
      <div className={`relative overflow-hidden rounded-2xl border border-[var(--line)] bg-white ${heightClass}`}>
        <div ref={containerRef} className="h-full w-full" />
        <div ref={overlayRef} className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
          {mapVersion > 0 &&
            pins.map((pin) => {
              const color =
                pin.id === "pick"
                  ? "#0891b2"
                  : (pin.despues ?? 0) > 0
                    ? "#6d28d9"
                    : (pin.antes ?? 0) > 0
                      ? "#0f766e"
                      : "#ea580c";
              const label = pin.consecutivo ?? "+";
              return (
                <button
                  key={pin.id}
                  ref={(node) => {
                    if (node) balloonElsRef.current.set(pin.id, node);
                    else balloonElsRef.current.delete(pin.id);
                  }}
                  type="button"
                  className={`pointer-events-auto absolute left-0 top-0 flex flex-col items-center ${
                    onPick ? "" : dropReady ? "erase-pin" : "erase-pin-wait"
                  }`}
                  style={{
                    zIndex: selectedId === pin.id ? 40 : 10 + (pin.consecutivo ?? 0),
                    animationDelay: onPick ? undefined : `${(dropOrder.get(pin.id) ?? 0) * 180}ms`,
                  }}
                  onAnimationEnd={(event) => {
                    if (event.target !== event.currentTarget) return;
                    event.currentTarget.dataset.landed = "1";
                    event.currentTarget.style.animation = "none";
                    event.currentTarget.style.opacity = "1";
                    event.currentTarget.style.transform = "translate(var(--x), var(--y)) translate(-50%, -100%)";
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (pin.id !== "pick") setSelectedId(pin.id);
                  }}
                  aria-label={pin.consecutivo ? `Consecutivo ${pin.consecutivo}` : "Globo de la barda"}
                >
                  <span
                    className="inline-flex min-h-7 min-w-7 items-center justify-center rounded-full border-2 border-white px-1.5 text-[11px] font-extrabold leading-none text-white shadow-md"
                    style={{ backgroundColor: color }}
                  >
                    {label}
                  </span>
                  <span
                    className="h-0 w-0 border-x-[6px] border-t-[8px] border-x-transparent"
                    style={{ borderTopColor: color }}
                  />
                </button>
              );
            })}
        </div>
        {mapVersion === 0 ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 text-sm text-[var(--muted)]">
            Cargando mapa…
          </div>
        ) : null}
      </div>
      <p className="text-xs text-[var(--muted)]">
        {provider === "mapbox" ? "Mapbox" : provider === "maplibre" ? "Mapa alterno" : "Mapa"}
        {error ? ` · ${error}` : ""}
      </p>
      {selected ? (
        <div className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm">
          <p className="font-semibold">
            {formatRegistro(selected.consecutivo)} · globo {selected.consecutivo}
          </p>
          <p>{selected.address}</p>
          <p>
            {formatMetros(selected.altoMetros)} × {formatMetros(selected.anchoMetros)} = {formatArea(selected.areaM2)}
          </p>
          <p className="text-xs text-[var(--muted)]">{formatFechaHora(selected.createdAt)}</p>
          <Link className="font-medium text-[var(--magic)]" href={`/bardas/${selected.id}`}>
            Ver registro
          </Link>
        </div>
      ) : null}
    </div>
  );
}
