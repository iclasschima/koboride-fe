import { api } from "@/lib/api/client";

export type GooglePlaceSuggestion = {
  id: string;
  name: string;
  area: string;
  source: "google";
  distanceKm?: number;
};

export type GooglePlaceDetails = {
  id: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
};

export async function autocompletePlaces(
  q: string,
  session: string,
  origin?: { lat: number; lng: number },
): Promise<GooglePlaceSuggestion[]> {
  const params = new URLSearchParams({ q, session });
  if (origin && Number.isFinite(origin.lat) && Number.isFinite(origin.lng)) {
    params.set("fromLat", String(origin.lat));
    params.set("fromLng", String(origin.lng));
  }
  const data = await api.get<{ places: GooglePlaceSuggestion[] }>(
    `/api/places/autocomplete?${params}`,
    { token: null },
  );
  return data.places;
}

export async function placeDetails(
  id: string,
  session: string,
): Promise<GooglePlaceDetails> {
  const params = new URLSearchParams({ id, session });
  const data = await api.get<{ place: GooglePlaceDetails }>(
    `/api/places/details?${params}`,
    { token: null },
  );
  return data.place;
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<GooglePlaceDetails> {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
  const data = await api.get<{ place: GooglePlaceDetails }>(
    `/api/places/reverse?${params}`,
    { token: null },
  );
  return data.place;
}
