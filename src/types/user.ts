import type { TripStatus } from "@/types/request";

export type User = {
  id: string;
  phone: string;
  name: string | null;
};

export type UserRole = "customer" | "rider" | "admin";

export type OpsUser = {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
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
