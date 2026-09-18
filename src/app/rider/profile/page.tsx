"use client";

import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { EnableNotifications } from "@/components/notify/EnableNotifications";
import { AddToHomeScreenCard } from "@/components/pwa/AddToHomeScreen";
import { WhatsAppSupport } from "@/components/support/WhatsAppSupport";
import { useRiderAuth } from "@/lib/auth/RiderAuthProvider";

export default function RiderProfilePage() {
  const { user, logout } = useRiderAuth();
  const name = user?.name?.trim() || "Rider";

  return (
    <div className="min-h-full bg-[#FAFAF7] px-5 pt-[max(2rem,env(safe-area-inset-top))] pb-4">
      <Avatar src={user?.photoUrl} name={name} className="h-16 w-16 text-[22px]" />
      <h1 className="mt-4 font-display text-[28px] font-semibold tracking-[-0.04em]">
        {name}
      </h1>
      <p className="mt-1 text-[14px] text-[#8A8780]">{user?.phone}</p>

      <section className="mt-8">
        <h2 className="font-display text-[18px] font-semibold">Notifications</h2>
        <p className="mt-1 text-[14px] text-[#8A8780]">
          Alerts turn on when you sign in or go online.
        </p>
        <EnableNotifications role="rider" />
      </section>

      <AddToHomeScreenCard />

      <WhatsAppSupport className="mt-6" />

      <Button className="mt-3 w-full" variant="secondary" onClick={() => logout()}>
        Log out
      </Button>
    </div>
  );
}
