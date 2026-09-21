import {
  BASE_FEE_NGN,
  MIN_FARE_NGN,
  ONLINE_PAYMENT_DISCOUNT_NGN,
  PER_KM_FEE_NGN,
  customerFeeNgn,
  feeFromDistanceKm,
  type FareRates,
  type PaymentMethod,
} from "@/types/request";
import { formatKm } from "@/lib/format";
import {
  distanceKmBetween,
  isRoutable,
  routeStops,
} from "@/lib/zones";
import type { PricingZone } from "@/types/user";

export {
  isRoutable,
  customerFeeNgn,
  feeFromDistanceKm,
  ONLINE_PAYMENT_DISCOUNT_NGN,
  BASE_FEE_NGN,
  PER_KM_FEE_NGN,
  MIN_FARE_NGN,
};

const DEFAULT_RATES: FareRates = {
  baseFeeNgn: BASE_FEE_NGN,
  perKmFeeNgn: PER_KM_FEE_NGN,
  minFareNgn: MIN_FARE_NGN,
  onlinePaymentDiscountNgn: ONLINE_PAYMENT_DISCOUNT_NGN,
};

export const DEFAULT_MAX_DELIVERY_KM = 10;

/** Instant check from pins we already have — no extra round trip. */
export function deliveryRangeError(
  pickupLat: number,
  pickupLng: number,
  dropoffLat: number,
  dropoffLng: number,
  zones?: readonly PricingZone[] | null,
  maxKm = DEFAULT_MAX_DELIVERY_KM,
): string | null {
  const routed = routeStops(pickupLat, pickupLng, dropoffLat, dropoffLng, zones);
  if (!routed.ok) return routed.message;
  const km = distanceKmBetween(pickupLat, pickupLng, dropoffLat, dropoffLng);
  if (km > maxKm) {
    return `This delivery is ${formatKm(km)}, which is beyond KoboRide's current bicycle delivery range (${formatKm(maxKm)}).`;
  }
  return null;
}

/** Client-side preview; prefer estimate-fare for the authoritative quote. */
export function quoteFee(input: {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  paymentMethod?: PaymentMethod;
  distanceKm?: number;
  rates?: FareRates;
  zones?: readonly PricingZone[] | null;
}): number {
  if (
    !isRoutable(
      input.pickupLat,
      input.pickupLng,
      input.dropoffLat,
      input.dropoffLng,
      input.zones,
    )
  ) {
    return 0;
  }
  const rates = input.rates ?? DEFAULT_RATES;
  const km =
    input.distanceKm ??
    distanceKmBetween(
      input.pickupLat,
      input.pickupLng,
      input.dropoffLat,
      input.dropoffLng,
    );
  const listFee = feeFromDistanceKm(km, rates);
  return customerFeeNgn(
    listFee,
    input.paymentMethod ?? "cash",
    rates.onlinePaymentDiscountNgn ?? ONLINE_PAYMENT_DISCOUNT_NGN,
  );
}
