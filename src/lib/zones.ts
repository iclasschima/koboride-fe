export type PricingZone = {
  slug: string;
  name: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  active: boolean;
};

/** Keep in sync with koboride-be `src/lib/zones.ts`. */
export const PRICING_ZONES: PricingZone[] = [
  {
    slug: "yaba",
    name: "Yaba",
    centerLat: 6.5055,
    centerLng: 3.3795,
    radiusKm: 4,
    active: true,
  },
  {
    slug: "surulere",
    name: "Surulere",
    centerLat: 6.4965,
    centerLng: 3.354,
    radiusKm: 2.5,
    active: false,
  },
  {
    slug: "gbagada",
    name: "Gbagada",
    centerLat: 6.551,
    centerLng: 3.389,
    radiusKm: 2.5,
    active: false,
  },
];

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

export function isInZone(zone: PricingZone, lat: number, lng: number): boolean {
  return distanceKmBetween(zone.centerLat, zone.centerLng, lat, lng) <= zone.radiusKm;
}

export function isInActiveServiceArea(lat: number, lng: number): boolean {
  return PRICING_ZONES.some((zone) => zone.active && isInZone(zone, lat, lng));
}
