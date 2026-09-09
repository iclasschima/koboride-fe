export type User = {
  id: string;
  phone: string;
  name: string | null;
};

export type UserRole = "customer" | "rider";

export type OpsUser = {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
  approved: boolean;
  createdAt: string;
};
