import { ApiError, api } from "@/lib/api/client";
import type { CreateTripInput, Trip } from "@/types/request";

export async function listTrips(): Promise<Trip[]> {
  const data = await api.get<{ trips: Trip[] }>("/api/orders");
  return data.trips;
}

export async function getTrip(id: string): Promise<Trip> {
  const data = await api.get<{ trip: Trip }>(`/api/orders/${id}`);
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

export async function confirmCompletion(tripId: string): Promise<Trip> {
  const data = await api.post<{ trip: Trip }>(`/api/orders/${tripId}/confirm`);
  return data.trip;
}

export async function advanceRiderStatus(tripId: string): Promise<Trip> {
  const data = await api.post<{ trip: Trip }>(`/api/orders/${tripId}/status`);
  return data.trip;
}

export async function listRiderJobs(): Promise<Trip[]> {
  try {
    const data = await api.get<{ trips: Trip[] }>("/api/riders/jobs");
    return data.trips;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 403 || err.status === 401)) return [];
    throw err;
  }
}

export async function listRiderEarnings(): Promise<Trip[]> {
  try {
    const data = await api.get<{ trips: Trip[] }>("/api/riders/earnings");
    return data.trips;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 403 || err.status === 401)) return [];
    throw err;
  }
}

export async function setRiderOnline(online: boolean): Promise<boolean> {
  const data = await api.post<{ rider: { online: boolean } }>("/api/riders/availability", {
    online,
  });
  return data.rider.online;
}

export async function getRiderOnline(): Promise<boolean> {
  try {
    const data = await api.get<{ rider: { online: boolean } | null }>("/api/auth/me");
    return Boolean(data.rider?.online);
  } catch {
    return false;
  }
}
