export type Place = {
  name: string;
  area: string;
  lat: number;
  lng: number;
  current?: boolean;
};

/** Empty-state shortcuts only. Typing searches Google through the API. */
export const SEARCH_PLACES: Place[] = [
  { name: "Tejuosho Market", area: "Yaba", lat: 6.5078, lng: 3.3774 },
  { name: "Unilag Main Gate", area: "Akoka", lat: 6.5175, lng: 3.3894 },
  { name: "Sabo bus stop", area: "Yaba", lat: 6.5052, lng: 3.3789 },
];
