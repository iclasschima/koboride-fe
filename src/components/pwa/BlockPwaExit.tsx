"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isStandaloneApp } from "@/lib/pwa";

/** Tab / section homes where an extra Back should stay in the PWA, not leave it. */
function isTabRoot(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/trips" ||
    pathname === "/profile" ||
    pathname === "/rider" ||
    pathname === "/rider/earnings" ||
    pathname === "/rider/profile" ||
    pathname === "/rider/login" ||
    pathname === "/admin" ||
    pathname === "/admin/login" ||
    pathname === "/admin/orders" ||
    pathname === "/admin/orders/new" ||
    pathname === "/admin/riders" ||
    pathname === "/admin/riders/new" ||
    pathname === "/admin/users" ||
    pathname === "/admin/settings"
  );
}

function sectionHome(pathname: string): string {
  if (pathname.startsWith("/rider")) return "/rider";
  if (pathname.startsWith("/admin")) return "/admin";
  return "/";
}

/**
 * Homescreen / standalone PWAs close (or jump to Safari) when Back empties the
 * history stack. Keep a stay buffer on tab roots, and seed a section home under
 * deep cold-start links so the first Back stays inside the app.
 */
export function BlockPwaExit() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isStandaloneApp()) return;

    try {
      const path = `${window.location.pathname}${window.location.search}`;
      if (!isTabRoot(window.location.pathname) && !sessionStorage.getItem("kb.histSeed")) {
        sessionStorage.setItem("kb.histSeed", "1");
        const home = sectionHome(window.location.pathname);
        window.history.replaceState({ kbStay: true }, "", home);
        window.history.pushState({ kbPage: true }, "", path);
      }
    } catch {
      /* private mode */
    }
  }, []);

  useEffect(() => {
    if (!isStandaloneApp()) return;

    if (isTabRoot(pathname)) {
      const state = window.history.state as { kbStay?: boolean } | null;
      if (!state?.kbStay) {
        window.history.pushState({ kbStay: true }, "", window.location.href);
      }
    }

    const onPopState = () => {
      if (!isStandaloneApp()) return;
      if (!isTabRoot(window.location.pathname)) return;
      // Re-arm so another Back cannot leave the homescreen app.
      window.history.pushState({ kbStay: true }, "", window.location.href);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [pathname]);

  return null;
}
