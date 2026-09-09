export const queryKeys = {
  trips: {
    all: ["trips"] as const,
    list: () => [...queryKeys.trips.all, "list"] as const,
    detail: (id: string) => [...queryKeys.trips.all, "detail", id] as const,
  },
  rider: {
    all: ["rider"] as const,
    active: () => [...queryKeys.rider.all, "active"] as const,
    earnings: () => [...queryKeys.rider.all, "earnings"] as const,
  },
  admin: {
    all: ["admin"] as const,
    trips: () => [...queryKeys.admin.all, "trips"] as const,
    trip: (id: string) => [...queryKeys.admin.all, "trip", id] as const,
    users: () => [...queryKeys.admin.all, "users"] as const,
  },
};
