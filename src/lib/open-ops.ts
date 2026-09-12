"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { getAdminToken } from "@/lib/api/client";

const TAPS = 7;
const WINDOW_MS = 2500;

/** Hidden: tap 7 times quickly to open ops. No UI. */
export function useOpenOps() {
  const router = useRouter();
  const count = useRef(0);
  const reset = useRef(0);

  return function openOpsIfReady() {
    window.clearTimeout(reset.current);
    count.current += 1;
    if (count.current >= TAPS) {
      count.current = 0;
      router.push(getAdminToken() ? "/admin" : "/admin/login");
      return;
    }
    reset.current = window.setTimeout(() => {
      count.current = 0;
    }, WINDOW_MS);
  };
}
