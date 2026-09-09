import { YABA_FLAT_FEE_NGN } from "@/types/request";

/** Yaba / Akoka / Onike / Adekunle / Jibowu. Keep in sync with koboride-be `src/lib/fare.ts`. */
export const YABA_ZONE = {
  minLat: 6.49,
  maxLat: 6.528,
  minLng: 3.362,
  maxLng: 3.4,
};

export function isInYabaZone(lat: number, lng: number): boolean {
  return (
    lat >= YABA_ZONE.minLat &&
    lat <= YABA_ZONE.maxLat &&
    lng >= YABA_ZONE.minLng &&
    lng <= YABA_ZONE.maxLng
  );
}

export function quoteFee(input: {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
}): number {
  if (
    !isInYabaZone(input.pickupLat, input.pickupLng) ||
    !isInYabaZone(input.dropoffLat, input.dropoffLng)
  ) {
    return 0;
  }
  return YABA_FLAT_FEE_NGN;
}
