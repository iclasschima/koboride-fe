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

export type Trip = {
  id: string;
  pickup: string;
  dropoff: string;
  notes: string;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  feeNgn: number;
  status: TripStatus;
  riderPhase: RiderPhase | null;
  riderId: string | null;
  riderName: string | null;
  riderPhone: string | null;
  customerName: string | null;
  customerPhone: string | null;
  payoutNgn: number;
  payoutPaid: boolean;
  createdAt: string;
  updatedAt: string;
  autoConfirmAt: string | null;
  autoConfirmInMs: number | null;
};

export type CreateTripInput = {
  pickup: string;
  dropoff: string;
  notes: string;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
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

export const YABA_FLAT_FEE_NGN = 1000;

export function isActiveTrip(trip: Trip): boolean {
  return trip.status === "dispatching" || trip.status === "in_progress";
}

export function tripHeadline(trip: Trip): string {
  if (trip.status === "dispatching") return "Searching for a rider";
  if (trip.status === "in_progress" && trip.riderPhase) {
    if (trip.riderPhase === "accepted" || trip.riderPhase === "en_route_pickup") {
      return "Rider accepted";
    }
    if (trip.riderPhase === "collected" || trip.riderPhase === "en_route_dropoff") {
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
