import { api } from "@/lib/api/client";
import type { RiderPhase, Trip, TripStatus } from "@/types/request";
import type { AdminCustomer, OpsUser } from "@/types/user";

const admin = { admin: true as const };

export async function listAdminTrips(): Promise<Trip[]> {
  const data = await api.get<{ trips: Trip[] }>("/api/admin/orders", admin);
  return data.trips;
}

export async function getAdminTrip(id: string): Promise<Trip> {
  const data = await api.get<{ trip: Trip }>(`/api/admin/orders/${id}`, admin);
  return data.trip;
}

export async function listAdminRiders(): Promise<OpsUser[]> {
  const data = await api.get<{ riders: OpsUser[] }>("/api/admin/riders", admin);
  return data.riders;
}

export async function listAdminCustomers(): Promise<AdminCustomer[]> {
  const data = await api.get<{ customers: AdminCustomer[] }>(
    "/api/admin/customers",
    admin,
  );
  return data.customers;
}

export async function getAdminCustomer(
  id: string,
): Promise<{ customer: AdminCustomer; trips: Trip[] }> {
  return api.get<{ customer: AdminCustomer; trips: Trip[] }>(
    `/api/admin/customers/${id}`,
    admin,
  );
}

export async function createAdminOrder(input: {
  customerName?: string;
  customerPhone: string;
  pickup: string;
  dropoff: string;
  notes: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  customerRole?: "sender" | "receiver";
  senderName?: string;
  senderPhone?: string;
  receiverName?: string;
  receiverPhone?: string;
  riderId?: string;
}): Promise<Trip> {
  const data = await api.post<{ trip: Trip }>("/api/admin/orders", input, admin);
  return data.trip;
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

export async function deleteAdminOrder(orderId: string): Promise<void> {
  await api.delete(`/api/admin/orders/${orderId}`, admin);
}

export async function removeAdminRider(riderId: string): Promise<void> {
  await api.delete(`/api/admin/riders/${riderId}`, admin);
}
