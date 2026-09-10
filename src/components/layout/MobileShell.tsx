"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import { RiderNav } from "@/components/layout/RiderNav";
import { useRiderAuth } from "@/lib/auth/RiderAuthProvider";
import { cn } from "@/lib/cn";

export function MobileShell({ children }: { children: React.ReactNode }) {
  const { authenticated: riderAuthenticated } = useRiderAuth();
  const pathname = usePathname();

  const isAdmin = pathname.startsWith("/admin");
  const isRider = pathname.startsWith("/rider");
  const isTripDetail = /^\/trips\/[^/]+$/.test(pathname);
  const isRiderJob = pathname.startsWith("/rider/job");

  const showCustomerNav =
    !isAdmin &&
    !isRider &&
    !isTripDetail &&
    (pathname === "/" || pathname === "/trips" || pathname === "/profile");

  const showRiderNav =
    isRider && !isRiderJob && pathname !== "/rider/login" && riderAuthenticated;
  const mapChrome =
    pathname === "/" ||
    pathname === "/rider" ||
    isTripDetail ||
    isRiderJob;

  if (isAdmin) {
    return (
      <div className="relative mx-auto min-h-svh w-full max-w-none overflow-auto bg-[#FAFAF7]">
        {children}
      </div>
    );
  }

  return (
    <div className="kb-phone relative mx-auto flex w-full max-w-md flex-col overflow-hidden bg-[#FAFAF7] shadow-[0_0_80px_rgba(15,61,46,0.35)]">
      <div
        className={cn(
          "relative min-h-0 flex-1",
          mapChrome ? "overflow-hidden" : "overflow-y-auto",
        )}
      >
        {children}
      </div>
      {showCustomerNav ? <BottomNav /> : null}
      {showRiderNav ? <RiderNav /> : null}
    </div>
  );
}
