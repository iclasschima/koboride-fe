"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  advanceRiderStatus,
  cancelOrder,
  confirmCompletion,
  createTrip,
  getTrip,
  listRiderEarnings,
  listRiderJobs,
  listTrips,
} from "@/lib/api/requests";
import {
  addAdminRider,
  assignAdminOrder,
  getAdminTrip,
  listAdminTrips,
  listAdminUsers,
  markAdminPayoutPaid,
  overrideAdminStatus,
  setAdminRiderApproved,
} from "@/lib/api/admin";
import { queryKeys } from "@/lib/query/keys";
import type { CreateTripInput, RiderPhase, TripStatus } from "@/types/request";

export function useTrips(enabled = true) {
  return useQuery({
    queryKey: queryKeys.trips.list(),
    queryFn: listTrips,
    enabled,
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
      if (trip.status === "dispatching" || trip.status === "in_progress") {
        return 12_000;
      }
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
    },
  });
}

export function useCancelOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tripId: string) => cancelOrder(tripId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.trips.all });
    },
  });
}

export function useConfirmCompletionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tripId: string) => confirmCompletion(tripId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.trips.all });
    },
  });
}

export function useAdvanceRiderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tripId: string) => advanceRiderStatus(tripId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.trips.all });
      await qc.invalidateQueries({ queryKey: queryKeys.rider.all });
      await qc.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
  });
}

export function useRiderActiveJobs() {
  return useQuery({
    queryKey: queryKeys.rider.active(),
    queryFn: listRiderJobs,
    refetchInterval: 12_000,
  });
}

export function useRiderEarnings() {
  return useQuery({
    queryKey: queryKeys.rider.earnings(),
    queryFn: listRiderEarnings,
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

export function useAdminUsers() {
  return useQuery({
    queryKey: queryKeys.admin.users(),
    queryFn: listAdminUsers,
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
    mutationFn: (input: { name: string; phone: string }) => addAdminRider(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.admin.users() });
    },
  });
}

export function useSetRiderApprovedMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { riderId: string; approved: boolean }) =>
      setAdminRiderApproved(input.riderId, input.approved),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.admin.users() });
    },
  });
}
