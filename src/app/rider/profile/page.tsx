"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function RiderProfilePage() {
  const { user } = useAuth();
  const name = user?.name?.trim() || "Rider";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="bg-[#FAFAF7] px-5 pt-8 pb-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand font-display text-[22px] font-semibold text-[#FAFAF7]">
        {initial}
      </div>
      <h1 className="mt-4 font-display text-[28px] font-semibold tracking-[-0.04em]">
        {name}
      </h1>
      <p className="mt-1 text-[14px] text-[#8A8780]">{user?.phone ?? "Sign in as a rider"}</p>
      <p className="mt-4 text-[13px] text-[#8A8780]">
        Riders are approved by ops. There is no self-signup.
      </p>
      <Link href="/" className="mt-8 block">
        <Button className="w-full" variant="secondary">
          Switch to customer
        </Button>
      </Link>
    </div>
  );
}
