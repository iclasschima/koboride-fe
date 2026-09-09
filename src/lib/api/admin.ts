import { api } from "@/lib/api/client";
import type { RiderPhase, Trip, TripStatus } from "@/types/request";
import type { OpsUser } from "@/types/user";

const admin = { admin: true as const };

export async function listAdminTrips(): Promise<Trip[]> {
  const data = await api.get<{ trips: Trip[] }>("/api/admin/orders", admin);
  return data.trips;
}

export async function getAdminTrip(id: string): Promise<Trip> {
  const data = await api.get<{ trip: Trip }>(`/api/admin/orders/${id}`, admin);
  return data.trip;
}

export async function listAdminUsers(): Promise<OpsUser[]> {
  const data = await api.get<{ riders: OpsUser[] }>("/api/admin/riders", admin);
  return data.riders;
}

export async function assignAdminOrder(orderId: string, riderId: string): Promise<Trip> {
  const data = await api.post<{ trip: Trip }>(
    `/api/admin/orders/${orderId}/assign`,
    { riderId },
    admin,
  );
  return data.trip;
}

export async function overrideAdminStatus(
  orderId: string,
  status: TripStatus,
  phase?: RiderPhase | null,
): Promise<Trip> {
  const data = await api.post<{ trip: Trip }>(
    `/api/admin/orders/${orderId}/override-status`,
    { status, phase },
    admin,
  );
  return data.trip;
}

export async function markAdminPayoutPaid(orderId: string): Promise<Trip> {
  const data = await api.post<{ trip: Trip }>(
    `/api/admin/orders/${orderId}/mark-paid`,
    undefined,
    admin,
  );
  return data.trip;
}

export async function addAdminRider(input: { name: string; phone: string }): Promise<OpsUser> {
  const data = await api.post<{ rider: OpsUser }>("/api/admin/riders", input, admin);
  return data.rider;
}

export async function setAdminRiderApproved(
  riderId: string,
  approved: boolean,
): Promise<OpsUser> {
  const data = await api.patch<{ rider: OpsUser }>(
    `/api/admin/riders/${riderId}`,
    { approved },
    admin,
  );
  return data.rider;
}
