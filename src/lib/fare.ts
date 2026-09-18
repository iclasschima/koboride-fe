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
import { distanceKmBetween, isInActiveServiceArea } from "@/lib/zones";

export {
  isInActiveServiceArea,
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

/** Client-side preview; prefer estimate-fare for the authoritative quote. */
export function quoteFee(input: {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  paymentMethod?: PaymentMethod;
  distanceKm?: number;
  rates?: FareRates;
}): number {
  if (
    !isInActiveServiceArea(input.pickupLat, input.pickupLng) ||
    !isInActiveServiceArea(input.dropoffLat, input.dropoffLng)
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
