import { api } from "@/lib/api/client";

export type GooglePlaceSuggestion = {
  id: string;
  name: string;
  area: string;
  source: "google";
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
): Promise<GooglePlaceSuggestion[]> {
  const params = new URLSearchParams({ q, session });
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
