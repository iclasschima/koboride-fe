export const SERVICE_AREA = "Yaba";

export const DEFAULT_PICKUP = "Current location · Yaba";

export type Place = {
  name: string;
  area: string;
  lat: number;
  lng: number;
  current?: boolean;
};

/** Empty-state shortcuts only. Typing searches Google through the API. */
export const SEARCH_PLACES: Place[] = [
  { name: "Current location · Yaba", area: "Near you", lat: 6.5095, lng: 3.3711, current: true },
  { name: "Tejuosho Market", area: "Yaba", lat: 6.5078, lng: 3.3774 },
  { name: "Unilag Main Gate", area: "Akoka", lat: 6.5175, lng: 3.3894 },
  { name: "Sabo bus stop", area: "Yaba", lat: 6.5052, lng: 3.3789 },
  { name: "Yabatech", area: "Yaba", lat: 6.5186, lng: 3.3762 },
  { name: "Adekunle", area: "Yaba", lat: 6.4968, lng: 3.3795 },
  { name: "Jibowu", area: "Yaba", lat: 6.5124, lng: 3.3688 },
  { name: "Herbert Macaulay Way", area: "Yaba", lat: 6.5089, lng: 3.3812 },
  { name: "Akoka", area: "Lagos", lat: 6.5201, lng: 3.3931 },
  { name: "Onike", area: "Yaba", lat: 6.5112, lng: 3.3854 },
];
