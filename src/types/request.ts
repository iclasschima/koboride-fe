export type TripStatus =
  | "dispatching"
  | "in_progress"
  | "completed"
  | "cancelled";

export type RiderPhase =
  | "accepted"
  | "en_route_pickup"
  | "collected"
  | "en_route_dropoff"
  | "delivered";

export type CustomerRole = "sender" | "receiver";

/** Who settles the cash fare — sender at pickup, or receiver at drop-off. */
export type FarePayer = CustomerRole;

export type PaymentMethod = "cash" | "paystack";
export type PaymentStatus = "unpaid" | "paid" | "refunded";

export function oppositeRole(role: CustomerRole): CustomerRole {
  return role === "sender" ? "receiver" : "sender";
}

/** A rider handing a job back before pickup, kept for ops. */
export type TripRelease = {
  id: string;
  riderId: string;
  riderName: string | null;
  phase: RiderPhase | null;
  reason: string;
  at: string;
};

export type Trip = {
  id: string;
  pickup: string;
  dropoff: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  notes: string;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  customerRole?: CustomerRole;
  /** Who pays cash — sender at pickup or receiver at drop-off. Defaults to customerRole. */
  farePayer?: FarePayer;
  zoneSlug?: string;
  zoneName?: string;
  feeNgn: number;
  status: TripStatus;
  riderPhase: RiderPhase | null;
  riderId: string | null;
  riderName: string | null;
  riderPhone: string | null;
  riderPhotoUrl?: string | null;
  customerName: string | null;
  customerPhone: string | null;
  payoutNgn: number;
  payoutPaid: boolean;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paidAt?: string | null;
  refundedAt?: string | null;
  distanceKm: number;
  deliveryPin?: string | null;
  deliveryPinRevealed?: boolean;
  deliveryPinRequested?: boolean;
  deliveryPinRequestedAt?: string | null;
  requiresDeliveryPin?: boolean;
  deliveryProof?: string | null;
  deliveryProofNote?: string | null;
  deliveryProofPhotoUrl?: string | null;
  cancelReason?: string | null;
  /** When set in the future, search is paused until that time. */
  scheduledFor?: string | null;
  searchingSince?: string;
  scheduledPending?: boolean;
  stillLookingAfterMs?: number;
  retentionOfferShown?: boolean;
  retentionDiscountNgn?: number;
  autoCancelInMs?: number | null;
  /** Admin order detail only. */
  releases?: TripRelease[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  durationSeconds?: number | null;
  autoConfirmInMs: number | null;
};

export type CreateTripInput = {
  pickup: string;
  dropoff: string;
  notes: string;
  customerRole: CustomerRole;
  farePayer?: FarePayer;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  paymentMethod?: PaymentMethod;
  paystackReference?: string;
};

export const STATUS_LABEL: Record<TripStatus, string> = {
  dispatching: "Searching for a rider",
  in_progress: "On the way",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const TRACK_STEPS = [
  { id: "searching", label: "Searching" },
  { id: "accepted", label: "Accepted" },
  { id: "picked_up", label: "Picked up" },
  { id: "delivered", label: "Delivered" },
] as const;

export const RIDER_PHASES: RiderPhase[] = [
  "accepted",
  "en_route_pickup",
  "collected",
  "en_route_dropoff",
  "delivered",
];

export const BASE_FEE_NGN = 400;
export const PER_KM_FEE_NGN = 250;
export const MIN_FARE_NGN = 650;
/** @deprecated Prefer distance fare; kept for copy fallbacks. */
export const YABA_FLAT_FEE_NGN = 1000;
/** Online (Paystack) discount — funded from platform commission, not rider payout. */
export const ONLINE_PAYMENT_DISCOUNT_NGN = 50;

export type FareRates = {
  baseFeeNgn: number;
  perKmFeeNgn: number;
  minFareNgn: number;
  onlinePaymentDiscountNgn?: number;
};

/** Customer-facing fares always land on a ₦50 step — never show ₦818. */
export function roundToDisplayPrice(rawFee: number): number {
  if (!Number.isFinite(rawFee) || rawFee <= 0) return 0;
  return Math.round(rawFee / 50) * 50;
}

/** Exact distance math, then round to nearest ₦50 for the list price. */
export function feeFromDistanceKm(
  distanceKm: number,
  rates: FareRates = {
    baseFeeNgn: BASE_FEE_NGN,
    perKmFeeNgn: PER_KM_FEE_NGN,
    minFareNgn: MIN_FARE_NGN,
  },
): number {
  const km = Math.max(0, distanceKm);
  const exact = rates.baseFeeNgn + km * rates.perKmFeeNgn;
  return roundToDisplayPrice(Math.max(rates.minFareNgn, exact));
}

export function customerFeeNgn(
  listFeeNgn: number,
  paymentMethod: PaymentMethod = "cash",
  onlineDiscountNgn = ONLINE_PAYMENT_DISCOUNT_NGN,
): number {
  if (paymentMethod !== "paystack") return roundToDisplayPrice(listFeeNgn);
  const discount = Math.max(0, Math.min(onlineDiscountNgn, listFeeNgn));
  return roundToDisplayPrice(listFeeNgn - discount);
}

export const CANCEL_REASONS = [
  "Ordered by mistake",
  "Wrong pickup or drop-off",
  "Rider taking too long",
  "Changed my mind",
  "Receiver not available",
  "Other",
] as const;

export const RELEASE_REASONS = [
  "Bike problem",
  "Too far from me",
  "Cannot reach the sender",
  "Emergency",
  "Other",
] as const;

/** Customer can cancel until the rider has the package. */
export function canCustomerCancel(trip: Trip): boolean {
  if (trip.status === "dispatching") return true;
  if (trip.status !== "in_progress") return false;
  const phase = trip.riderPhase;
  return !phase || phase === "accepted" || phase === "en_route_pickup";
}

/** Rider can hand the job back until they collect the package. */
export function canRiderRelease(trip: Trip): boolean {
  if (trip.status !== "in_progress") return false;
  const phase = trip.riderPhase;
  return !phase || phase === "accepted" || phase === "en_route_pickup";
}

const DROPOFF_PHASES: RiderPhase[] = [
  "collected",
  "en_route_dropoff",
  "delivered",
];

/** Customer can share the PIN once the rider is heading to drop-off. */
export function canShareDeliveryPin(
  trip: Pick<Trip, "status" | "riderPhase">,
): boolean {
  if (trip.status !== "in_progress") return false;
  return Boolean(trip.riderPhase && DROPOFF_PHASES.includes(trip.riderPhase));
}

export function isActiveTrip(trip: Trip): boolean {
  return trip.status === "dispatching" || trip.status === "in_progress";
}

export function tripPaidOnline(trip: Pick<Trip, "paymentMethod" | "paymentStatus">): boolean {
  return trip.paymentMethod === "paystack" && trip.paymentStatus === "paid";
}

export function isComplimentary(trip: Pick<Trip, "feeNgn">): boolean {
  return trip.feeNgn <= 0;
}

export function cashCollectLabel(
  trip: Pick<
    Trip,
    | "feeNgn"
    | "payoutNgn"
    | "farePayer"
    | "customerRole"
    | "senderName"
    | "receiverName"
    | "paymentMethod"
    | "paymentStatus"
  >,
  formatMoney: (n: number) => string,
): string {
  if (isComplimentary(trip)) {
    return trip.payoutNgn > 0
      ? `Don't collect — KoboRide pays you ${formatMoney(trip.payoutNgn)}`
      : "Don't collect cash";
  }
  if (tripPaidOnline(trip)) {
    return `Customer paid ${formatMoney(trip.feeNgn)} online`;
  }
  const payer = trip.farePayer ?? trip.customerRole ?? "sender";
  const name =
    (payer === "sender" ? trip.senderName : trip.receiverName)?.trim() ||
    (payer === "sender" ? "the sender" : "the receiver");
  const where = payer === "sender" ? "at pickup" : "at drop-off";
  return `Collect ${formatMoney(trip.feeNgn)} from ${name} ${where}`;
}

export function tripHeadline(trip: Trip): string {
  if (trip.status === "dispatching" && trip.scheduledPending) {
    return "Scheduled — searching soon";
  }
  if (trip.status === "dispatching") return "Searching for a rider";
  if (trip.status === "cancelled" && trip.cancelReason === "No riders in this area yet") {
    return "No riders here yet";
  }
  if (trip.status === "in_progress" && trip.riderPhase) {
    if (
      trip.riderPhase === "accepted" ||
      trip.riderPhase === "en_route_pickup"
    ) {
      return "Rider accepted";
    }
    if (
      trip.riderPhase === "collected" ||
      trip.riderPhase === "en_route_dropoff"
    ) {
      return "Picked up";
    }
    if (trip.riderPhase === "delivered") return "Delivered";
  }
  return STATUS_LABEL[trip.status];
}

export function trackStepIndex(trip: Trip): number {
  if (trip.status === "completed") return 3;
  if (trip.status === "cancelled") return -1;
  if (trip.status === "dispatching") return 0;
  switch (trip.riderPhase) {
    case "accepted":
    case "en_route_pickup":
      return 1;
    case "collected":
    case "en_route_dropoff":
      return 2;
    case "delivered":
      return 3;
    default:
      return 0;
  }
}
