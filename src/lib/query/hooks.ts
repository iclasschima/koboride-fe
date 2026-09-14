"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptRiderJob,
  advanceRiderStatus,
  type AdvanceRiderInput,
  cancelOrder,
  createTrip,
  getClientAppStatus,
  getRiderMe,
  getRiderTrip,
  getTrip,
  listRiderAvailableJobs,
  listRiderEarnings,
  listRiderJobs,
  listTripsPage,
  requestDeliveryPin,
  revealDeliveryPin,
} from "@/lib/api/requests";
import {
  addAdminRider,
  assignAdminOrder,
  editAdminRider,
  getAdminRider,
  createAdminOrder,
  deleteAdminOrder,
  getAdminCustomer,
  getAdminTrip,
  listAdminCustomers,
  listAdminRiders,
  listAdminTrips,
  markAdminPayoutPaid,
  overrideAdminStatus,
  removeAdminRider,
  resetAdminCustomerCancels,
  setAdminCustomerActive,
  setAdminRiderApproved,
  getAdminSettings,
  updateAdminSettings,
} from "@/lib/api/admin";
import { queryKeys } from "@/lib/query/keys";
import {
  isActiveTrip,
  type CreateTripInput,
  type RiderPhase,
  type TripStatus,
} from "@/types/request";

export function useClientAppStatus(enabled = true) {
  return useQuery({
    queryKey: queryKeys.app.status(),
    queryFn: getClientAppStatus,
    enabled,
    refetchOnWindowFocus: true,
    staleTime: 60_000,
  });
}

export function useTrips(enabled = true) {
  return useQuery({
    queryKey: queryKeys.trips.list(),
    queryFn: listTripsPage,
    enabled,
    refetchInterval: (query) => {
      const trips = query.state.data?.trips;
      if (!trips?.some(isActiveTrip)) return false;
      return 8_000;
    },
  });
}

export function useTrip(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.trips.detail(id),
    queryFn: () => getTrip(id),
    enabled: enabled && Boolean(id),
    refetchInterval: (query) => {
      const trip = query.state.data;
      if (!trip) return false;
      if (trip.status === "dispatching") return 4_000;
      if (trip.status === "in_progress") return 4_000;
      return false;
    },
  });
}

export function useCreateTripMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTripInput) => createTrip(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.trips.all });
      await qc.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
  });
}

export function useCancelOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { tripId: string; reason: string; note?: string }) =>
      cancelOrder(input.tripId, { reason: input.reason, note: input.note }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.trips.all });
      await qc.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
  });
}

export function useRevealDeliveryPinMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tripId: string) => revealDeliveryPin(tripId),
    onSuccess: async (trip) => {
      qc.setQueryData(queryKeys.trips.detail(trip.id), trip);
      await qc.invalidateQueries({ queryKey: queryKeys.trips.all });
      await qc.invalidateQueries({ queryKey: queryKeys.rider.all });
    },
  });
}

export function useRequestDeliveryPinMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tripId: string) => requestDeliveryPin(tripId),
    onSuccess: async (trip) => {
      qc.setQueryData(queryKeys.rider.job(trip.id), trip);
      await qc.invalidateQueries({ queryKey: queryKeys.rider.all });
      await qc.invalidateQueries({ queryKey: queryKeys.trips.all });
    },
  });
}

export function useAdvanceRiderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tripId, ...input }: { tripId: string } & AdvanceRiderInput) =>
      advanceRiderStatus(tripId, input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.trips.all });
      await qc.invalidateQueries({ queryKey: queryKeys.rider.all });
      await qc.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
  });
}

export function useAcceptJobMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tripId: string) => acceptRiderJob(tripId),
    onSuccess: async (trip) => {
      qc.setQueryData(queryKeys.rider.job(trip.id), trip);
      await qc.invalidateQueries({ queryKey: queryKeys.trips.all });
      await qc.invalidateQueries({ queryKey: queryKeys.rider.all });
      await qc.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
  });
}

export function useRiderTrip(id: string, enabled = true, pollMs = 12_000) {
  return useQuery({
    queryKey: queryKeys.rider.job(id),
    queryFn: () => getRiderTrip(id),
    enabled: enabled && Boolean(id),
    refetchInterval: (query) => {
      const trip = query.state.data;
      if (!trip) return false;
      if (trip.status === "dispatching" || trip.status === "in_progress") {
        return pollMs;
      }
      return false;
    },
  });
}

export function useRiderMe(enabled = true) {
  return useQuery({
    queryKey: queryKeys.rider.me(),
    queryFn: getRiderMe,
    enabled,
  });
}

export function useRiderActiveJobs(enabled = true) {
  return useQuery({
    queryKey: queryKeys.rider.active(),
    queryFn: listRiderJobs,
    enabled,
    refetchInterval: enabled ? 12_000 : false,
  });
}

export function useRiderAvailableJobs(enabled = true) {
  return useQuery({
    queryKey: queryKeys.rider.available(),
    queryFn: listRiderAvailableJobs,
    enabled,
    refetchInterval: enabled ? 12_000 : false,
  });
}

export function useRiderEarnings(enabled = true) {
  return useQuery({
    queryKey: queryKeys.rider.earnings(),
    queryFn: listRiderEarnings,
    enabled,
  });
}

export function useAdminTrips() {
  return useQuery({
    queryKey: queryKeys.admin.trips(),
    queryFn: listAdminTrips,
    refetchInterval: 12_000,
  });
}

export function useAdminTrip(id: string) {
  return useQuery({
    queryKey: queryKeys.admin.trip(id),
    queryFn: () => getAdminTrip(id),
    enabled: Boolean(id),
  });
}

export function useAdminRiders() {
  return useQuery({
    queryKey: queryKeys.admin.riders(),
    queryFn: listAdminRiders,
  });
}

export function useAdminRider(id: string) {
  return useQuery({
    queryKey: queryKeys.admin.rider(id),
    queryFn: () => getAdminRider(id),
    enabled: Boolean(id),
  });
}

export function useAdminCustomers() {
  return useQuery({
    queryKey: queryKeys.admin.customers(),
    queryFn: listAdminCustomers,
  });
}

export function useAdminCustomer(id: string) {
  return useQuery({
    queryKey: queryKeys.admin.customer(id),
    queryFn: () => getAdminCustomer(id),
    enabled: Boolean(id),
  });
}

export function useCreateAdminOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAdminOrder,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.admin.all });
      await qc.invalidateQueries({ queryKey: queryKeys.trips.all });
      await qc.invalidateQueries({ queryKey: queryKeys.rider.all });
    },
  });
}

export function useAssignOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { orderId: string; riderId: string }) =>
      assignAdminOrder(input.orderId, input.riderId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.admin.all });
      await qc.invalidateQueries({ queryKey: queryKeys.rider.all });
    },
  });
}

export function useOverrideStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      orderId: string;
      status: TripStatus;
      phase?: RiderPhase | null;
    }) => overrideAdminStatus(input.orderId, input.status, input.phase),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
  });
}

export function useDeleteAdminOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => deleteAdminOrder(orderId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.admin.all });
      await qc.invalidateQueries({ queryKey: queryKeys.trips.all });
      await qc.invalidateQueries({ queryKey: queryKeys.rider.all });
    },
  });
}

export function useMarkPayoutPaidMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => markAdminPayoutPaid(orderId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.admin.all });
      await qc.invalidateQueries({ queryKey: queryKeys.rider.all });
    },
  });
}

export function useAddRiderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addAdminRider,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
  });
}

export function useEditRiderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: editAdminRider,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.admin.all });
      await qc.invalidateQueries({ queryKey: queryKeys.rider.all });
    },
  });
}

export function useSetRiderApprovedMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { riderId: string; approved: boolean }) =>
      setAdminRiderApproved(input.riderId, input.approved),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
  });
}

export function useSetCustomerActiveMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { customerId: string; active: boolean }) =>
      setAdminCustomerActive(input.customerId, input.active),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
  });
}

export function useResetCustomerCancelsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (customerId: string) => resetAdminCustomerCancels(customerId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
  });
}

export function useRemoveRiderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (riderId: string) => removeAdminRider(riderId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.admin.all });
      await qc.invalidateQueries({ queryKey: queryKeys.rider.all });
    },
  });
}

export function useAdminSettings() {
  return useQuery({
    queryKey: queryKeys.admin.settings(),
    queryFn: getAdminSettings,
  });
}

export function useUpdateAdminSettingsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateAdminSettings,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.admin.settings() });
      await qc.invalidateQueries({ queryKey: queryKeys.app.status() });
      await qc.invalidateQueries({ queryKey: queryKeys.trips.all });
    },
  });
}
