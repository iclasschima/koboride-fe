"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useRiderAuth } from "@/lib/auth/RiderAuthProvider";

export default function RiderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, authenticated } = useRiderAuth();
  const isLogin = pathname === "/rider/login";

  useEffect(() => {
    if (!ready) return;
    if (!authenticated && !isLogin) router.replace("/rider/login");
    if (authenticated && isLogin) router.replace("/rider");
  }, [authenticated, isLogin, ready, router]);

  if (!ready) {
    return <div className="h-full min-h-80 animate-pulse bg-[#E4DFD4]" />;
  }

  if (isLogin) return children;

  if (!authenticated) {
    return <div className="h-full min-h-80 animate-pulse bg-[#E4DFD4]" />;
  }

  return children;
}
