import type { Trip } from "@/types/request";
import { distanceKmBetween } from "@/lib/zones";

export type Place = {
  name: string;
  area: string;
  lat: number;
  lng: number;
  current?: boolean;
};

export const SAME_PLACE_MESSAGE =
  "Pickup and drop-off need to be different places.";

const SAME_PLACE_KM = 0.05;

function normalizePlaceText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** True when both pins are the same stop (same coords or same name + area). */
export function samePlace(a: Place, b: Place): boolean {
  if (distanceKmBetween(a.lat, a.lng, b.lat, b.lng) < SAME_PLACE_KM) return true;
  const name = normalizePlaceText(a.name);
  const other = normalizePlaceText(b.name);
  if (!name || !other || name !== other) return false;
  return normalizePlaceText(a.area) === normalizePlaceText(b.area);
}

function placeKey(lat: number, lng: number) {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

/** Unique pickup and drop-off pins from completed trips, newest first. */
export function recentDeliveredPlaces(trips: Trip[], limit = 6): Place[] {
  const completed = [...trips]
    .filter((trip) => trip.status === "completed")
    .sort(
      (a, b) =>
        new Date(b.completedAt ?? b.updatedAt).getTime() -
        new Date(a.completedAt ?? a.updatedAt).getTime(),
    );

  const seen = new Set<string>();
  const places: Place[] = [];

  for (const trip of completed) {
    const stops: Place[] = [
      {
        name: trip.dropoff,
        area: "Delivered here",
        lat: trip.dropoffLat ?? Number.NaN,
        lng: trip.dropoffLng ?? Number.NaN,
      },
      {
        name: trip.pickup,
        area: "Picked up here",
        lat: trip.pickupLat ?? Number.NaN,
        lng: trip.pickupLng ?? Number.NaN,
      },
    ];
    for (const stop of stops) {
      if (!stop.name.trim() || !Number.isFinite(stop.lat) || !Number.isFinite(stop.lng)) {
        continue;
      }
      const key = placeKey(stop.lat, stop.lng);
      if (seen.has(key)) continue;
      seen.add(key);
      places.push(stop);
      if (places.length >= limit) return places;
    }
  }

  return places;
}
