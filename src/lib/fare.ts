import { YABA_FLAT_FEE_NGN } from "@/types/request";
import { isInActiveServiceArea } from "@/lib/zones";

export { isInActiveServiceArea };

export function quoteFee(input: {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
}): number {
  if (
    !isInActiveServiceArea(input.pickupLat, input.pickupLng) ||
    !isInActiveServiceArea(input.dropoffLat, input.dropoffLng)
  ) {
    return 0;
  }
  return YABA_FLAT_FEE_NGN;
}
