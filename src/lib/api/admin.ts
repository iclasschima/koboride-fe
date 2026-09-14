import { api } from "@/lib/api/client";
import type { RiderPhase, Trip, TripStatus } from "@/types/request";
import type {
  AdminCustomer,
  AdminRiderDetail,
  OpsUser,
  PlatformSettings,
  RiderIdType,
} from "@/types/user";

export type RiderWriteInput = {
  name: string;
  phone: string;
  photo?: File;
  idType?: RiderIdType;
  idNumber?: string;
  idDocument?: File;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  nextOfKinRelationship?: string;
};

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

export async function getAdminRider(
  id: string,
): Promise<{ rider: AdminRiderDetail; trips: Trip[] }> {
  return api.get<{ rider: AdminRiderDetail; trips: Trip[] }>(
    `/api/admin/riders/${id}`,
    admin,
  );
}

export async function editAdminRider(
  input: RiderWriteInput & { riderId: string },
): Promise<OpsUser> {
  const body = new FormData();
  appendRiderFields(body, input);
  const data = await api.patchForm<{ rider: OpsUser }>(
    `/api/admin/riders/${input.riderId}`,
    body,
    admin,
  );
  return data.rider;
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

function appendRiderFields(body: FormData, input: RiderWriteInput) {
  body.append("name", input.name);
  body.append("phone", input.phone);
  if (input.idType) body.append("idType", input.idType);
  if (input.idNumber) body.append("idNumber", input.idNumber);
  if (input.nextOfKinName) body.append("nextOfKinName", input.nextOfKinName);
  if (input.nextOfKinPhone) body.append("nextOfKinPhone", input.nextOfKinPhone);
  if (input.nextOfKinRelationship) {
    body.append("nextOfKinRelationship", input.nextOfKinRelationship);
  }
  if (input.photo) body.append("photo", input.photo);
  if (input.idDocument) body.append("idDocument", input.idDocument);
}

export async function addAdminRider(input: RiderWriteInput): Promise<OpsUser> {
  const body = new FormData();
  appendRiderFields(body, input);
  const data = await api.postForm<{ rider: OpsUser }>("/api/admin/riders", body, admin);
  return data.rider;
}

export async function setAdminRiderApproved(
  riderId: string,
  approved: boolean,
): Promise<OpsUser> {
  const data = await api.patch<{ rider: OpsUser }>(
    `/api/admin/riders/${riderId}`,
    { active: approved },
    admin,
  );
  return data.rider;
}

export async function setAdminCustomerActive(
  customerId: string,
  active: boolean,
): Promise<AdminCustomer> {
  const data = await api.patch<{ customer: AdminCustomer }>(
    `/api/admin/customers/${customerId}`,
    { active },
    admin,
  );
  return data.customer;
}

export async function resetAdminCustomerCancels(customerId: string): Promise<AdminCustomer> {
  const data = await api.patch<{ customer: AdminCustomer }>(
    `/api/admin/customers/${customerId}`,
    { resetCancelLimit: true },
    admin,
  );
  return data.customer;
}

export async function deleteAdminOrder(orderId: string): Promise<void> {
  await api.delete(`/api/admin/orders/${orderId}`, admin);
}

export async function removeAdminRider(riderId: string): Promise<void> {
  await api.delete(`/api/admin/riders/${riderId}`, admin);
}

export async function getAdminSettings(): Promise<PlatformSettings> {
  return api.get<PlatformSettings>("/api/admin/settings", admin);
}

export async function updateAdminSettings(
  input: Partial<PlatformSettings> & { bumpClientRefresh?: true },
): Promise<PlatformSettings> {
  return api.patch<PlatformSettings>("/api/admin/settings", input, admin);
}
