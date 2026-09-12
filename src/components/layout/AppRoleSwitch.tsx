"use client";

import Link from "next/link";
import { useRiderAuth } from "@/lib/auth/RiderAuthProvider";

const linkClass =
  "mt-3 block w-full text-center text-[14px] font-medium text-[#8A8780] underline-offset-2 hover:underline";

export function RiderEntryLink() {
  const { ready, authenticated } = useRiderAuth();
  if (!ready) return null;

  return (
    <Link href={authenticated ? "/rider" : "/rider/login"} className={linkClass}>
      {authenticated ? "Open rider app" : "I’m a rider"}
    </Link>
  );
}
