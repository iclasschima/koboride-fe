import type { PricingZone } from "@/types/user";

export type { PricingZone };

const ZONE_RADIUS_KM = 4;

/** Fallback catalog if /api/app has not loaded yet. Live list comes from the API. */
export const PRICING_ZONES: PricingZone[] = [
  {
    slug: "YAB",
    name: "Yaba",
    centerLat: 6.5055,
    centerLng: 3.3795,
    radiusKm: ZONE_RADIUS_KM,
    active: true,
    adjacentSlugs: ["SRL", "GBG"],
  },
  {
    slug: "SRL",
    name: "Surulere",
    centerLat: 6.4965,
    centerLng: 3.354,
    radiusKm: ZONE_RADIUS_KM,
    active: false,
    adjacentSlugs: ["YAB"],
  },
  {
    slug: "GBG",
    name: "Gbagada",
    centerLat: 6.551,
    centerLng: 3.389,
    radiusKm: ZONE_RADIUS_KM,
    active: false,
    adjacentSlugs: ["YAB", "OJK"],
  },
  {
    slug: "IKJ",
    name: "Ikeja",
    centerLat: 6.6018,
    centerLng: 3.3515,
    radiusKm: ZONE_RADIUS_KM,
    active: false,
    adjacentSlugs: ["OJK"],
  },
  {
    slug: "AJH",
    name: "Ajah",
    centerLat: 6.4698,
    centerLng: 3.5683,
    radiusKm: ZONE_RADIUS_KM,
    active: false,
    adjacentSlugs: [],
  },
  {
    slug: "LK1",
    name: "Lekki Phase 1",
    centerLat: 6.4474,
    centerLng: 3.4721,
    radiusKm: ZONE_RADIUS_KM,
    active: false,
    adjacentSlugs: [],
  },
  {
    slug: "OJK",
    name: "Ojota/Ketu",
    centerLat: 6.5865,
    centerLng: 3.3868,
    radiusKm: ZONE_RADIUS_KM,
    active: false,
    adjacentSlugs: ["GBG", "IKJ"],
  },
];

export const DEFAULT_ZONE_SLUG = "YAB";

const EARTH_RADIUS_KM = 6371;

export function distanceKmBetween(
  pickupLat: number,
  pickupLng: number,
  dropoffLat: number,
  dropoffLng: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(dropoffLat - pickupLat);
  const dLng = toRad(dropoffLng - pickupLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(pickupLat)) * Math.cos(toRad(dropoffLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function catalogZones(zones?: readonly PricingZone[] | null): PricingZone[] {
  return zones && zones.length > 0 ? [...zones] : PRICING_ZONES;
}

export function zoneBySlug(
  slug: string | null | undefined,
  zones?: readonly PricingZone[] | null,
): PricingZone | undefined {
  if (!slug) return undefined;
  const key = slug.trim().toUpperCase();
  return catalogZones(zones).find((zone) => zone.slug === key);
}

export function zoneName(
  slug: string | null | undefined,
  zones?: readonly PricingZone[] | null,
): string {
  return zoneBySlug(slug, zones)?.name ?? slug ?? "Unknown";
}

export function activeZones(zones?: readonly PricingZone[] | null): PricingZone[] {
  const catalog = catalogZones(zones);
  const live = catalog.filter((zone) => zone.active);
  if (live.length > 0) return live;
  const fallback = zoneBySlug(DEFAULT_ZONE_SLUG, catalog);
  return fallback ? [fallback] : catalog.slice(0, 1);
}

export function isInZone(zone: PricingZone, lat: number, lng: number): boolean {
  return distanceKmBetween(zone.centerLat, zone.centerLng, lat, lng) <= zone.radiusKm;
}

export function zonesContaining(
  lat: number,
  lng: number,
  zones?: readonly PricingZone[] | null,
): PricingZone[] {
  return activeZones(zones).filter((zone) => isInZone(zone, lat, lng));
}

export function nearestZone(lat: number, lng: number, zones: PricingZone[]): PricingZone {
  return zones.reduce((best, zone) => {
    const bestKm = distanceKmBetween(best.centerLat, best.centerLng, lat, lng);
    const nextKm = distanceKmBetween(zone.centerLat, zone.centerLng, lat, lng);
    return nextKm < bestKm ? zone : best;
  });
}

/** Lagos State, padded so Ikorodu / Badagry / Epe still sit inside. */
export const LAGOS_BOUNDS = {
  south: 6.32,
  west: 2.7,
  north: 6.73,
  east: 4.36,
};

export function isInLagos(lat: number, lng: number): boolean {
  return (
    lat >= LAGOS_BOUNDS.south &&
    lat <= LAGOS_BOUNDS.north &&
    lng >= LAGOS_BOUNDS.west &&
    lng <= LAGOS_BOUNDS.east
  );
}

export function zonesAreAdjacent(a: PricingZone, b: PricingZone): boolean {
  if (a.slug === b.slug) return true;
  return a.adjacentSlugs.includes(b.slug) || b.adjacentSlugs.includes(a.slug);
}

export type RouteStopsOk = { ok: true; zone: PricingZone };
export type RouteStopsErr = {
  ok: false;
  code: "OUTSIDE_SERVICE_AREA" | "CROSS_ZONE";
  message: string;
};

export function routeStops(
  pickupLat: number,
  pickupLng: number,
  dropoffLat: number,
  dropoffLng: number,
  zones?: readonly PricingZone[] | null,
): RouteStopsOk | RouteStopsErr {
  const pickupZones = zonesContaining(pickupLat, pickupLng, zones);
  const dropoffZones = zonesContaining(dropoffLat, dropoffLng, zones);
  if (pickupZones.length === 0 || dropoffZones.length === 0) {
    return {
      ok: false,
      code: "OUTSIDE_SERVICE_AREA",
      message: "This location is outside the KoboRide service area.",
    };
  }

  const shared = pickupZones.filter((pickup) =>
    dropoffZones.some((dropoff) => dropoff.slug === pickup.slug),
  );
  if (shared.length > 0) {
    return { ok: true, zone: nearestZone(pickupLat, pickupLng, shared) };
  }

  const adjacentPickup = pickupZones.find((pickup) =>
    dropoffZones.some((dropoff) => zonesAreAdjacent(pickup, dropoff)),
  );
  if (adjacentPickup) {
    return { ok: true, zone: nearestZone(pickupLat, pickupLng, pickupZones) };
  }

  const from = nearestZone(pickupLat, pickupLng, pickupZones).name;
  const to = nearestZone(dropoffLat, dropoffLng, dropoffZones).name;
  return {
    ok: false,
    code: "CROSS_ZONE",
    message: `KoboRide doesn't deliver between ${from} and ${to}.`,
  };
}

export function resolveDispatchZone(
  pickupLat: number,
  pickupLng: number,
  dropoffLat: number,
  dropoffLng: number,
  zones?: readonly PricingZone[] | null,
): PricingZone | null {
  const routed = routeStops(pickupLat, pickupLng, dropoffLat, dropoffLng, zones);
  return routed.ok ? routed.zone : null;
}

export function isRoutable(
  pickupLat: number,
  pickupLng: number,
  dropoffLat: number,
  dropoffLng: number,
  zones?: readonly PricingZone[] | null,
): boolean {
  return routeStops(pickupLat, pickupLng, dropoffLat, dropoffLng, zones).ok;
}
