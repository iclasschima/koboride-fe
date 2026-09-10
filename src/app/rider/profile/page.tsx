"use client";

import { Button } from "@/components/ui/Button";
import { EnableNotifications } from "@/components/notify/EnableNotifications";
import { AddToHomeScreenCard } from "@/components/pwa/AddToHomeScreen";
import { useRiderAuth } from "@/lib/auth/RiderAuthProvider";

export default function RiderProfilePage() {
  const { user, logout } = useRiderAuth();
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
      <p className="mt-1 text-[14px] text-[#8A8780]">{user?.phone}</p>

      <section className="mt-8">
        <h2 className="font-display text-[18px] font-semibold">Notifications</h2>
        <p className="mt-1 text-[14px] text-[#8A8780]">
          Alerts turn on when you sign in or go online. You can switch them off here.
        </p>
        <EnableNotifications role="rider" />
      </section>

      <AddToHomeScreenCard />

      <Button className="mt-8 w-full" variant="secondary" onClick={() => logout()}>
        Log out
      </Button>
    </div>
  );
}
