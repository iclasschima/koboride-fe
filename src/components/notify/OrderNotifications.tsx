"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useRiderAuth } from "@/lib/auth/RiderAuthProvider";
import { customerOrderAlert, tripSig } from "@/lib/order-alerts";
import { showOrderNotification } from "@/lib/notify";
import {
  useRiderActiveJobs,
  useRiderAvailableJobs,
  useTrip,
  useTrips,
} from "@/lib/query/hooks";
import type { Trip } from "@/types/request";

export function OrderNotifications() {
  return (
    <>
      <CustomerOrderNotifications />
      <RiderOrderNotifications />
    </>
  );
}

function CustomerOrderNotifications() {
  const pathname = usePathname();
  const { ready, authenticated, user } = useAuth();
  const customerSurface = !pathname.startsWith("/admin") && !pathname.startsWith("/rider");
  const { data: trips = [] } = useTrips(ready && authenticated && customerSurface);
  const tripId = pathname.match(/^\/trips\/([^/]+)$/)?.[1] ?? "";
  const { data: detail } = useTrip(tripId, Boolean(tripId) && authenticated && customerSurface);
  const seen = useRef(new Map<string, string>());

  useEffect(() => {
    seen.current.clear();
  }, [user?.id]);

  useEffect(() => {
    if (!customerSurface || !authenticated) return;
    const byId = new Map<string, Trip>();
    for (const trip of trips) byId.set(trip.id, trip);
    if (detail) byId.set(detail.id, detail);

    for (const trip of byId.values()) {
      const sig = tripSig(trip);
      const prev = seen.current.get(trip.id);
      if (prev === undefined) {
        seen.current.set(trip.id, sig);
        continue;
      }
      if (prev === sig) continue;
      seen.current.set(trip.id, sig);
      const alert = customerOrderAlert(prev, trip);
      if (!alert) continue;
      showOrderNotification({
        ...alert,
        url: `/trips/${trip.id}`,
        tag: `order-${trip.id}-${sig}`,
      });
    }
  }, [authenticated, customerSurface, detail, trips]);

  return null;
}

function RiderOrderNotifications() {
  const pathname = usePathname();
  const { ready, authenticated, user } = useRiderAuth();
  const onRider = pathname.startsWith("/rider") && pathname !== "/rider/login";
  const enabled = ready && authenticated && onRider;
  const { data: active = [] } = useRiderActiveJobs(enabled);
  const { data: waiting = [] } = useRiderAvailableJobs(enabled);
  const seenActive = useRef(new Set<string>());
  const seenWaiting = useRef(new Set<string>());
  const primed = useRef(false);

  useEffect(() => {
    seenActive.current.clear();
    seenWaiting.current.clear();
    primed.current = false;
  }, [user?.id]);

  useEffect(() => {
    if (!enabled) return;
    const activeIds = new Set(active.map((trip) => trip.id));
    const waitingIds = new Set(waiting.map((trip) => trip.id));

    if (!primed.current) {
      seenActive.current = activeIds;
      seenWaiting.current = waitingIds;
      primed.current = true;
      return;
    }

    for (const trip of waiting) {
      if (seenWaiting.current.has(trip.id)) continue;
      showOrderNotification({
        title: "New order waiting",
        body: `${trip.pickup} → ${trip.dropoff}`,
        url: "/rider",
        tag: `wait-${trip.id}`,
      });
    }

    for (const trip of active) {
      if (seenActive.current.has(trip.id)) continue;
      if (seenWaiting.current.has(trip.id)) continue;
      showOrderNotification({
        title: "Order assigned to you",
        body: `${trip.pickup} → ${trip.dropoff}`,
        url: `/rider/job/${trip.id}`,
        tag: `job-${trip.id}`,
      });
    }

    seenActive.current = activeIds;
    seenWaiting.current = waitingIds;
  }, [active, enabled, waiting]);

  return null;
}
