"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useClientAppStatus } from "@/lib/query/hooks";
import { applyClientRefreshNonce } from "@/lib/clientRefresh";

export function ForceAppReload() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const { data } = useClientAppStatus(!isAdmin);

  useEffect(() => {
    if (!data || isAdmin) return;
    applyClientRefreshNonce(String(data.nonce));
  }, [data, isAdmin]);

  return null;
}
