"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import { RiderNav } from "@/components/layout/RiderNav";
import { AddToHomeScreenBanner } from "@/components/pwa/AddToHomeScreen";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { useRiderAuth } from "@/lib/auth/RiderAuthProvider";

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
    isRider && pathname !== "/rider/login" && riderAuthenticated;
  const showNav = showCustomerNav || showRiderNav;
  const mapChrome =
    pathname === "/" ||
    pathname === "/rider" ||
    isTripDetail ||
    isRiderJob;
  // Profile pages already have the install card — don't stack a banner on top.
  const showInstallBanner =
    showNav && !mapChrome && pathname !== "/profile" && pathname !== "/rider/profile";

  if (isAdmin) {
    return (
      <div className="relative mx-auto h-svh min-h-svh w-full max-w-none overflow-hidden bg-[#FAFAF7]">
        {children}
      </div>
    );
  }

  return (
    <div
      data-ptr-root
      className="kb-phone relative mx-auto flex w-full max-w-md flex-col overflow-hidden bg-[#FAFAF7] shadow-[0_0_80px_rgba(15,61,46,0.35)]"
    >
      <PullToRefresh className="relative min-h-0 flex-1">
        {children}
        {showNav && !mapChrome ? (
          <div className="h-[var(--kb-nav)] shrink-0" aria-hidden />
        ) : null}
      </PullToRefresh>
      {showInstallBanner ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-[var(--kb-nav)] z-40">
          <AddToHomeScreenBanner />
        </div>
      ) : null}
      {showCustomerNav ? <BottomNav /> : null}
      {showRiderNav ? <RiderNav /> : null}
    </div>
  );
}
