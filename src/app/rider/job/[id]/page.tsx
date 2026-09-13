"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Navigation, Phone } from "lucide-react";
import { CityMap } from "@/components/map/CityMap";
import { ReportOrderButton } from "@/components/support/WhatsAppSupport";
import { Button } from "@/components/ui/Button";
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

const CONFIRM: Partial<
  Record<RiderPhase, { title: string; body: string; confirm: string }>
> = {
  en_route_pickup: {
    title: "Item collected?",
    body: "Only continue if you have the package with you.",
    confirm: "Yes, collected",
  },
  en_route_dropoff: {
    title: "Mark as delivered?",
    body: "Only continue if you have handed this to the receiver.",
    confirm: "Yes, delivered",
  },
};

export default function RiderJobPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: trip, isPending, isError } = useRiderTrip(params.id);
  const advance = useAdvanceRiderMutation();
  const [askConfirm, setAskConfirm] = useState(false);

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
        <p className="font-display text-[20px] font-semibold">
          {trip.status === "cancelled" ? "This order was cancelled" : "This job is closed"}
        </p>
        <Link href="/rider" className="mt-3 inline-block text-brand">
          Home
        </Link>
      </div>
    );
  }

  const phase = trip.riderPhase ?? "accepted";
  const confirm = CONFIRM[phase];
  const navTo =
    phase === "accepted" || phase === "en_route_pickup" ? trip.pickup : trip.dropoff;
  const maps = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(navTo)}`;

  async function next() {
    const updated = await advance.mutateAsync(params.id);
    setAskConfirm(false);
    if (updated.riderPhase === "delivered") {
      router.push("/rider");
    }
  }

  function onAdvanceClick() {
    if (confirm && !askConfirm) {
      setAskConfirm(true);
      return;
    }
    void next();
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
        <ReportOrderButton
          orderId={trip.id}
          className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-3 z-10"
        />
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
          <ContactRow
            label={phase === "accepted" || phase === "en_route_pickup" ? "Pickup from" : "Deliver to"}
            name={
              phase === "accepted" || phase === "en_route_pickup"
                ? trip.senderName
                : trip.receiverName
            }
            phone={
              phase === "accepted" || phase === "en_route_pickup"
                ? trip.senderPhone
                : trip.receiverPhone
            }
          />
          {trip.notes ? (
            <p className="mt-3 rounded-2xl bg-[#EEEDE8] px-4 py-3 text-[14px]">{trip.notes}</p>
          ) : null}
        </div>

        <div className="mt-4 space-y-2">
          {phase !== "delivered" && !askConfirm ? (
            <a href={maps} target="_blank" rel="noreferrer">
              <Button className="w-full" variant="secondary">
                <Navigation className="mr-2 h-4 w-4" />
                Open Google Maps
              </Button>
            </a>
          ) : null}
          {phase !== "delivered" && askConfirm && confirm ? (
            <div className="rounded-[24px] bg-[#EEEDE8] px-4 py-4">
              <p className="font-display text-[18px] font-semibold tracking-[-0.02em]">
                {confirm.title}
              </p>
              <p className="mt-1 text-[14px] text-[#8A8780]">{confirm.body}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  disabled={advance.isPending}
                  onClick={() => setAskConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="w-full"
                  disabled={advance.isPending}
                  onClick={() => void next()}
                >
                  {advance.isPending ? "Updating…" : confirm.confirm}
                </Button>
              </div>
            </div>
          ) : phase !== "delivered" ? (
            <Button
              className="w-full"
              disabled={advance.isPending}
              onClick={onAdvanceClick}
            >
              {advance.isPending ? "Updating…" : NEXT_LABEL[phase]}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ContactRow({
  label,
  name,
  phone,
}: {
  label: string;
  name: string;
  phone: string;
}) {
  if (!name && !phone) return null;
  return (
    <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[#EEEDE8] px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium tracking-[0.06em] text-[#8A8780] uppercase">
          {label}
        </p>
        <p className="font-display truncate text-[15px] font-semibold">
          {name || "No name"}
        </p>
        {phone ? <p className="text-[13px] text-[#8A8780]">{phone}</p> : null}
      </div>
      {phone ? (
        <a
          href={`tel:${phone}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FAFAF7] text-brand"
          aria-label={`Call ${label}`}
        >
          <Phone className="h-5 w-5" />
        </a>
      ) : null}
    </div>
  );
}
