import { ApiError, api } from "@/lib/api/client";
import type { CreateTripInput, Trip } from "@/types/request";

const rider = { rider: true as const };

export async function listTrips(): Promise<Trip[]> {
  const data = await api.get<{ trips: Trip[] }>("/api/orders");
  return data.trips;
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

export async function cancelOrder(tripId: string): Promise<Trip> {
  const data = await api.post<{ trip: Trip }>(`/api/orders/${tripId}/cancel`);
  return data.trip;
}

export async function autoAssignTrip(tripId: string): Promise<Trip> {
  const data = await api.post<{ trip: Trip }>(`/api/orders/${tripId}/auto-assign`);
  return data.trip;
}

export async function confirmCompletion(tripId: string): Promise<Trip> {
  const data = await api.post<{ trip: Trip }>(`/api/orders/${tripId}/confirm`);
  return data.trip;
}

export async function advanceRiderStatus(tripId: string): Promise<Trip> {
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
