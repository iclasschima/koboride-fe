"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useRiderAuth } from "@/lib/auth/RiderAuthProvider";
import { activatePush, pushSupported, registerPushWorker } from "@/lib/push";

export function AutoActivatePush() {
  const pathname = usePathname();
  const customer = useAuth();
  const rider = useRiderAuth();

  useEffect(() => {
    if (pushSupported()) void registerPushWorker();
  }, []);

  useEffect(() => {
    if (!pushSupported() || Notification.permission !== "granted") return;
    if (pathname.startsWith("/admin")) return;
    if (pathname.startsWith("/rider")) {
      if (rider.ready && rider.authenticated) void activatePush("rider");
      return;
    }
    if (customer.ready && customer.authenticated) void activatePush("customer");
  }, [
    customer.authenticated,
    customer.ready,
    pathname,
    rider.authenticated,
    rider.ready,
  ]);

  return null;
}
