import { ApiError, api } from "@/lib/api/client";
import type { ClientAppStatus } from "@/types/user";
import type { CreateTripInput, Trip } from "@/types/request";

export async function getClientAppStatus(): Promise<ClientAppStatus> {
  return api.get<ClientAppStatus>("/api/app", { token: null });
}

const rider = { rider: true as const };

export type TripsPage = {
  trips: Trip[];
  maxActiveOrders: number;
  activeOrders?: number;
  canPlaceOrder?: boolean;
};

export async function listTripsPage(): Promise<TripsPage> {
  const data = await api.get<TripsPage>("/api/orders");
  return {
    trips: data.trips,
    maxActiveOrders: data.maxActiveOrders ?? 3,
    activeOrders: data.activeOrders,
    canPlaceOrder: data.canPlaceOrder,
  };
}

export async function listTrips(): Promise<Trip[]> {
  return (await listTripsPage()).trips;
}

export async function getTrip(id: string): Promise<Trip> {
  const data = await api.get<{ trip: Trip }>(`/api/orders/${id}`);
  return data.trip;
}

export async function getRiderTrip(id: string): Promise<Trip> {
  const data = await api.get<{ trip: Trip }>(`/api/orders/${id}`, rider);
  return data.trip;
}

export async function createTrip(input: CreateTripInput): Promise<Trip> {
  const data = await api.post<{ trip: Trip }>("/api/orders", input);
  return data.trip;
}

export type FareEstimate = {
  feeNgn: number;
  payoutNgn: number;
  distanceKm: number;
  maxDistanceKm: number;
};

export async function estimateFare(input: {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
}): Promise<FareEstimate> {
  return api.post<FareEstimate>("/api/orders/estimate-fare", input, { token: null });
}

export async function cancelOrder(
  tripId: string,
  input: { reason: string; note?: string },
): Promise<Trip> {
  const data = await api.post<{ trip: Trip }>(`/api/orders/${tripId}/cancel`, input);
  return data.trip;
}

export type AdvanceRiderInput = {
  pin?: string;
  skipReason?: string;
  photo?: File;
};

export async function advanceRiderStatus(
  tripId: string,
  input?: AdvanceRiderInput,
): Promise<Trip> {
  if (input?.photo || input?.skipReason || input?.pin) {
    const body = new FormData();
    if (input.pin) body.append("pin", input.pin);
    if (input.skipReason) body.append("skipReason", input.skipReason);
    if (input.photo) body.append("photo", input.photo);
    const data = await api.postForm<{ trip: Trip }>(`/api/orders/${tripId}/status`, body, rider);
    return data.trip;
  }
  const data = await api.post<{ trip: Trip }>(`/api/orders/${tripId}/status`, undefined, rider);
  return data.trip;
}

export async function acceptRiderJob(tripId: string): Promise<Trip> {
  const data = await api.post<{ trip: Trip }>(`/api/orders/${tripId}/accept`, undefined, rider);
  return data.trip;
}

export type RiderMe = {
  id: string;
  approved: boolean;
  online: boolean;
} | null;

export async function getRiderMe(): Promise<RiderMe> {
  try {
    const data = await api.get<{ rider: RiderMe }>("/api/auth/me", rider);
    return data.rider;
  } catch {
    return null;
  }
}

export async function listRiderJobs(): Promise<Trip[]> {
  try {
    const data = await api.get<{ trips: Trip[] }>("/api/riders/jobs", rider);
    return data.trips;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 403 || err.status === 401)) return [];
    throw err;
  }
}

export async function listRiderAvailableJobs(): Promise<Trip[]> {
  try {
    const data = await api.get<{ trips: Trip[] }>("/api/riders/available-jobs", rider);
    return data.trips;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 403 || err.status === 401)) return [];
    throw err;
  }
}

export async function listRiderEarnings(): Promise<Trip[]> {
  try {
    const data = await api.get<{ trips: Trip[] }>("/api/riders/earnings", rider);
    return data.trips;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 403 || err.status === 401)) return [];
    throw err;
  }
}

export async function setRiderOnline(online: boolean): Promise<boolean> {
  const data = await api.post<{ rider: { online: boolean } }>(
    "/api/riders/availability",
    { online },
    rider,
  );
  return data.rider.online;
}
