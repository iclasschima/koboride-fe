"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Navigation } from "lucide-react";
import { CityMap } from "@/components/map/CityMap";
import { Button } from "@/components/ui/Button";
import { FareNumber } from "@/components/ui/FareNumber";
import { StatusStepper } from "@/components/ui/StatusStepper";
import { useAdvanceRiderMutation, useRiderTrip } from "@/lib/query/hooks";
import type { RiderPhase } from "@/types/request";

const NEXT_LABEL: Record<RiderPhase, string> = {
  accepted: "En route to pickup",
  en_route_pickup: "Item collected",
  collected: "En route to drop-off",
  en_route_dropoff: "Delivered",
  delivered: "Done",
};

export default function RiderJobPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: trip, isPending, isError } = useRiderTrip(params.id);
  const advance = useAdvanceRiderMutation();

  if (isPending) {
    return <div className="h-full animate-pulse bg-[#E4DFD4]" />;
  }

  if (isError || !trip) {
    return (
      <div className="px-4 pt-16 text-center">
        <p className="font-display text-[20px] font-semibold">Job not found</p>
        <Link href="/rider" className="mt-3 inline-block text-brand">
          Back
        </Link>
      </div>
    );
  }

  if (trip.status !== "in_progress") {
    return (
      <div className="px-4 pt-16 text-center">
        <p className="font-display text-[20px] font-semibold">This job is closed</p>
        <Link href="/rider" className="mt-3 inline-block text-brand">
          Home
        </Link>
      </div>
    );
  }

  const phase = trip.riderPhase ?? "accepted";
  const navTo =
    phase === "accepted" || phase === "en_route_pickup" ? trip.pickup : trip.dropoff;
  const maps = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(navTo)}`;

  async function next() {
    const updated = await advance.mutateAsync(params.id);
    if (updated.riderPhase === "delivered") {
      router.push("/rider");
    }
  }

  return (
    <div className="relative flex h-full flex-col bg-[#FAFAF7]">
      <div className="relative h-[42vh] min-h-52">
        <CityMap
          className="absolute inset-0"
          mode="route"
          pickupLabel={trip.pickup}
          dropoffLabel={trip.dropoff}
        />
        <Link
          href="/rider"
          className="absolute top-[max(0.75rem,env(safe-area-inset-top))] left-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#FAFAF7] shadow-[0_8px_24px_rgba(15,61,46,0.12)]"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-3 z-10 rounded-full bg-[#FAFAF7] px-3 py-2 shadow-[0_8px_24px_rgba(15,61,46,0.12)]">
          <p className="text-[11px] text-[#8A8780]">Payout</p>
          <FareNumber amount={trip.payoutNgn} className="text-[18px]" />
        </div>
      </div>

      <div className="relative z-10 -mt-5 flex flex-1 flex-col rounded-t-[28px] bg-[#FAFAF7] px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <StatusStepper trip={trip} />

        <div className="mt-5 flex-1">
          <h1 className="font-display text-[24px] font-semibold tracking-[-0.03em]">
            {phase === "accepted" || phase === "en_route_pickup"
              ? "Pickup"
              : "Drop-off"}
          </h1>
          <p className="mt-2 text-[15px] text-[#8A8780]">
            {phase === "accepted" || phase === "en_route_pickup"
              ? trip.pickup
              : trip.dropoff}
          </p>
          {trip.notes ? (
            <p className="mt-3 rounded-2xl bg-[#EEEDE8] px-4 py-3 text-[14px]">{trip.notes}</p>
          ) : null}
        </div>

        <div className="mt-4 space-y-2">
          {phase !== "delivered" ? (
            <a href={maps} target="_blank" rel="noreferrer">
              <Button className="w-full" variant="secondary">
                <Navigation className="mr-2 h-4 w-4" />
                Open Google Maps
              </Button>
            </a>
          ) : null}
          {phase !== "delivered" ? (
            <Button
              className="w-full"
              disabled={advance.isPending}
              onClick={() => void next()}
            >
              {advance.isPending ? "Updating…" : NEXT_LABEL[phase]}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
