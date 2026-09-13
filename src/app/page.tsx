"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { LocateFixed, UserRound } from "lucide-react";
import { BookingSheet } from "@/components/request/BookingSheet";
import { CityMap } from "@/components/map/CityMap";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTrips } from "@/lib/query/hooks";
import { isActiveTrip } from "@/types/request";

export default function HomePage() {
  const router = useRouter();
  const { authenticated, openAuth, user, ready } = useAuth();
  const { data } = useTrips(ready && authenticated);
  const trips = data?.trips ?? [];

  const [pickup, setPickup] = useState<string | null>(null);
  const [dropoff, setDropoff] = useState<string | null>(null);

  const live = trips.filter(isActiveTrip);
  const active = live[0];
  const maxActiveOrders = data?.maxActiveOrders ?? 3;
  const initial = (user?.name ?? "You").trim().charAt(0).toUpperCase();

  const onRouteChange = useCallback((from: string | null, to: string | null) => {
    setPickup(from);
    setDropoff(to);
  }, []);

  return (
    <div className="relative h-full overflow-hidden bg-[#E4DFD4]">
      <CityMap
        className="pointer-events-none absolute inset-0"
        mode={pickup && dropoff ? "route" : "idle"}
        pickupLabel={pickup ?? active?.pickup}
        dropoffLabel={dropoff ?? active?.dropoff}
      />

      <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-end px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => {
            if (authenticated) router.push("/profile");
            else openAuth("login");
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FAFAF7] text-brand shadow-[0_8px_24px_rgba(15,61,46,0.12)]"
          aria-label={authenticated ? "Account" : "Sign in"}
        >
          {authenticated ? (
            <span className="text-[13px] font-bold">{initial}</span>
          ) : (
            <UserRound className="h-5 w-5" strokeWidth={2.2} />
          )}
        </button>
      </div>

      <div className="absolute right-3 bottom-36 z-20">
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FAFAF7] text-[#1A1A16] shadow-[0_8px_24px_rgba(15,61,46,0.14)]"
          aria-label="Recenter map"
        >
          <LocateFixed className="h-5 w-5" strokeWidth={2.1} />
        </button>
      </div>

      <BookingSheet
        activeTrip={active ?? null}
        activeCount={live.length}
        maxActiveOrders={maxActiveOrders}
        onRouteChange={onRouteChange}
      />
    </div>
  );
}
