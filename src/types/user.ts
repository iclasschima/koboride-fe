import type { TripStatus } from "@/types/request";

export type User = {
  id: string;
  phone: string;
  name: string | null;
  photoUrl?: string | null;
  isRider?: boolean;
};

export type UserRole = "customer" | "rider" | "admin";

export type RiderIdType = "nin" | "drivers_license" | "voters_card" | "passport";

export const RIDER_ID_TYPE_OPTIONS: Array<{ id: RiderIdType; label: string }> = [
  { id: "nin", label: "NIN slip / card" },
  { id: "drivers_license", label: "Driver's license" },
  { id: "voters_card", label: "Voter's card" },
  { id: "passport", label: "International passport" },
];

export const KIN_RELATIONSHIPS = [
  "Spouse",
  "Parent",
  "Sibling",
  "Child",
  "Relative",
  "Friend",
  "Other",
] as const;

export type OpsUser = {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
  photoUrl?: string | null;
  approved: boolean;
  active?: boolean;
  createdAt: string;
  idType?: RiderIdType | null;
  idNumber?: string | null;
  idDocumentUrl?: string | null;
  nextOfKinName?: string | null;
  nextOfKinPhone?: string | null;
  nextOfKinRelationship?: string | null;
  docsComplete?: boolean;
};

export type AdminRiderDetail = OpsUser & {
  online: boolean;
  jobsCount: number;
  completedCount: number;
  earnedNgn: number;
  unpaidNgn: number;
  paidNgn: number;
  distanceKm: number;
  avgDurationSeconds?: number | null;
  lastJobAt: string | null;
};

export type AdminCustomer = {
  id: string;
  name: string | null;
  phone: string;
  active: boolean;
  createdAt: string;
  ordersCount: number;
  lastOrderAt: string | null;
  lastOrderStatus: TripStatus | null;
  spentNgn: number;
  isRider: boolean;
  cancelsInWindow?: number;
  cancelLimit?: number;
  cancelWindowHours?: number;
  cancelLimited?: boolean;
  activeOrders?: number;
  maxActiveOrders?: number;
};

export type PlatformSettings = {
  maxActiveOrders: number;
  platformCutPercent: number;
};
