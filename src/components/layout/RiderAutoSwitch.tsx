"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useRiderAuth } from "@/lib/auth/RiderAuthProvider";
import { isCustomerHomePath } from "@/lib/app-role";

export function RiderAutoSwitch() {
  const pathname = usePathname();
  const router = useRouter();
  const customer = useAuth();
  const rider = useRiderAuth();
  const signingIn = useRef(false);
  const attemptedPhone = useRef<string | null>(null);

  useEffect(() => {
    if (!customer.ready || !rider.ready) return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/rider")) return;
    if (!customer.authenticated || !customer.user?.phone) return;
    if (customer.user.isRider === false) return;

    let cancelled = false;

    async function openRider() {
      if (!rider.authenticated) {
        const phone = customer.user!.phone;
        if (signingIn.current || attemptedPhone.current === phone) return;
        signingIn.current = true;
        attemptedPhone.current = phone;
        try {
          await rider.login(phone);
        } catch {
          return;
        } finally {
          signingIn.current = false;
        }
      }
      if (cancelled) return;
      if (isCustomerHomePath(pathname)) router.replace("/rider");
    }

    void openRider();
    return () => {
      cancelled = true;
    };
  }, [
    customer.authenticated,
    customer.ready,
    customer.user,
    pathname,
    rider,
    rider.authenticated,
    rider.ready,
    router,
  ]);

  return null;
}
