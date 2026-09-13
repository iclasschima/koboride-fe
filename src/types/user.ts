import type { TripStatus } from "@/types/request";

export type User = {
  id: string;
  phone: string;
  name: string | null;
  photoUrl?: string | null;
  isRider?: boolean;
};

export type UserRole = "customer" | "rider" | "admin";

export type OpsUser = {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
  photoUrl?: string | null;
  approved: boolean;
  createdAt: string;
};

export type AdminCustomer = {
  id: string;
  name: string | null;
  phone: string;
  createdAt: string;
  ordersCount: number;
  lastOrderAt: string | null;
  lastOrderStatus: TripStatus | null;
  spentNgn: number;
  isRider: boolean;
};
