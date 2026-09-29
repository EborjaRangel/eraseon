const RADIO_METROS = 6_371_000;

function aRadianes(grados: number) {
  return (grados * Math.PI) / 180;
}

export function distanciaMetros(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dLat = aRadianes(lat2 - lat1);
  const dLng = aRadianes(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRadianes(lat1)) * Math.cos(aRadianes(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_METROS * Math.asin(Math.min(1, Math.sqrt(a)));
}

export const CERCA_METROS = 40;
