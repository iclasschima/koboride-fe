import type { Trip, TripStatus } from "@/types/request";

export function tripSig(trip: Pick<Trip, "status" | "riderPhase">): string {
  return `${trip.status}:${trip.riderPhase ?? ""}`;
}

export function customerOrderAlert(
  prevSig: string,
  trip: Trip,
): { title: string; body: string } | null {
  const [prevStatus, prevPhase = ""] = prevSig.split(":") as [TripStatus, string];
  const phase = trip.riderPhase ?? "";

  if (prevStatus !== "cancelled" && trip.status === "cancelled") {
    return { title: "Order cancelled", body: `${trip.pickup} → ${trip.dropoff}` };
  }
  if (prevStatus !== "completed" && trip.status === "completed") {
    return { title: "Delivery confirmed", body: `Your package reached ${trip.dropoff}` };
  }
  if (
    trip.status === "in_progress" &&
    phase === "delivered" &&
    prevPhase !== "delivered"
  ) {
    return { title: "Package delivered", body: "Confirm you received it" };
  }
  if (
    trip.status === "in_progress" &&
    (phase === "collected" || phase === "en_route_dropoff") &&
    prevPhase !== "collected" &&
    prevPhase !== "en_route_dropoff" &&
    prevPhase !== "delivered"
  ) {
    return { title: "Package picked up", body: `On the way to ${trip.dropoff}` };
  }
  if (prevStatus === "dispatching" && trip.status === "in_progress") {
    const name = trip.riderName?.trim() || "A rider";
    return { title: "Rider accepted", body: `${name} is heading to ${trip.pickup}` };
  }
  return null;
}
