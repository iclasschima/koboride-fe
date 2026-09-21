export const queryKeys = {
  app: {
    status: () => ["app", "status"] as const,
  },
  trips: {
    all: ["trips"] as const,
    list: () => [...queryKeys.trips.all, "list"] as const,
    detail: (id: string) => [...queryKeys.trips.all, "detail", id] as const,
  },
  rider: {
    all: ["rider"] as const,
    me: () => [...queryKeys.rider.all, "me"] as const,
    job: (id: string) => [...queryKeys.rider.all, "job", id] as const,
    active: () => [...queryKeys.rider.all, "active"] as const,
    available: () => [...queryKeys.rider.all, "available"] as const,
    earnings: () => [...queryKeys.rider.all, "earnings"] as const,
  },
  admin: {
    all: ["admin"] as const,
    trips: () => [...queryKeys.admin.all, "trips"] as const,
    trip: (id: string) => [...queryKeys.admin.all, "trip", id] as const,
    riders: () => [...queryKeys.admin.all, "riders"] as const,
    rider: (id: string) => [...queryKeys.admin.all, "rider", id] as const,
    customers: () => [...queryKeys.admin.all, "customers"] as const,
    customer: (id: string) => [...queryKeys.admin.all, "customer", id] as const,
    settings: () => [...queryKeys.admin.all, "settings"] as const,
    zones: () => [...queryKeys.admin.all, "zones"] as const,
  },
};
