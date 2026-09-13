"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Phone } from "lucide-react";
import { CityMap, type MapMode } from "@/components/map/CityMap";
import { AppSheet } from "@/components/ui/AppSheet";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { StatusStepper } from "@/components/ui/StatusStepper";
import { NotifyPrompt } from "@/components/notify/NotifyPrompt";
import { ReportOrderButton } from "@/components/support/WhatsAppSupport";
import { formatNaira, formatDuration, tripDurationSeconds } from "@/lib/format";
import {
  useAutoAssignMutation,
  useCancelOrderMutation,
  useTrip,
} from "@/lib/query/hooks";
import { CANCEL_REASONS, canCustomerCancel, tripHeadline } from "@/types/request";
import { ApiError } from "@/lib/api/client";

const SEARCH_MS = 4_000;

const PEEK = 0.38;
const OPEN = 0.78;

export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const tripId = params.id;

  const { data: trip, isPending, isError } = useTrip(tripId);
  const autoAssign = useAutoAssignMutation();
  const assignOnce = useRef<string | null>(null);
  const cancelOrder = useCancelOrderMutation();

  const [snap, setSnap] = useState<number | string | null>(PEEK);
  const [askCancel, setAskCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelNote, setCancelNote] = useState("");
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    if (trip?.riderPhase === "delivered" || trip?.status === "completed") {
      setSnap(OPEN);
    }
  }, [trip?.riderPhase, trip?.status]);

  useEffect(() => {
    if (!trip || trip.status !== "dispatching") return;
    if (assignOnce.current === trip.id) return;
    const elapsed = Date.now() - new Date(trip.createdAt).getTime();
    const wait = Math.max(0, SEARCH_MS - elapsed);
    const timer = window.setTimeout(() => {
      assignOnce.current = trip.id;
      void autoAssign.mutateAsync(trip.id).catch(() => {
        assignOnce.current = null;
      });
    }, wait);
    return () => window.clearTimeout(timer);
  }, [autoAssign, trip]);

  if (isPending) {
    return (
      <div className="h-full bg-[#E4DFD4]">
        <div className="h-full animate-pulse bg-[#DAD4C8]" />
      </div>
    );
  }

  if (isError || !trip) {
    return (
      <div className="px-4 pt-16 text-center">
        <p className="font-display text-[20px] font-semibold">Trip not found</p>
        <Link href="/trips" className="mt-3 inline-block text-brand">
          Back to orders
        </Link>
      </div>
    );
  }

  const assigned = trip.status === "in_progress";
  const searching = trip.status === "dispatching";
  const showCancel = canCustomerCancel(trip);

  async function handleCancel() {
    setCancelError("");
    try {
      await cancelOrder.mutateAsync({
        tripId,
        reason: cancelReason,
        note: cancelReason === "Other" ? cancelNote.trim() : undefined,
      });
      router.push("/");
    } catch (err) {
      setAskCancel(false);
      setCancelError(
        err instanceof ApiError ? err.message : "Could not cancel this order",
      );
    }
  }
  const mapMode: MapMode =
    searching ? "searching" : trip.pickup && trip.dropoff ? "route" : "idle";

  return (
    <div className="relative h-full overflow-hidden bg-[#E4DFD4]">
      <CityMap
        className="pointer-events-none absolute inset-0"
        mode={mapMode}
        pickupLabel={trip.pickup}
        dropoffLabel={trip.dropoff}
      />

      <header className="absolute inset-x-0 top-0 z-20 flex items-center gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FAFAF7] text-[#1A1A16] shadow-[0_8px_24px_rgba(15,61,46,0.12)]"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2.2} />
        </Link>
        <div className="min-w-0 flex-1 rounded-full bg-[#FAFAF7]/95 px-3 py-2 shadow-[0_8px_24px_rgba(15,61,46,0.12)]">
          <h1 className="truncate font-display text-[14px] font-semibold tracking-[-0.02em]">
            {tripHeadline(trip)}
          </h1>
        </div>
        <ReportOrderButton orderId={trip.id} />
      </header>

      <AppSheet
        snapPoints={[PEEK, OPEN]}
        activeSnapPoint={snap}
        setActiveSnapPoint={setSnap}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-1">
          {searching || assigned || trip.status === "completed" ? (
            <div className="mb-4">
              <StatusStepper trip={trip} />
              {trip.status === "completed" && tripDurationSeconds(trip) != null ? (
                <p className="mt-2 text-[13px] text-[#8A8780]">
                  Completed in {formatDuration(tripDurationSeconds(trip)!)}
                </p>
              ) : null}
              {searching || assigned ? <NotifyPrompt /> : null}
            </div>
          ) : null}

          {searching ? (
            <>
              <p className="font-display text-[22px] font-semibold tracking-[-0.03em]">
                Searching for a rider
                <span className="inline-flex w-[1.1em] animate-pulse">…</span>
              </p>
              <p className="mt-2 text-[13px] text-[#8A8780]">
                <span className="num font-semibold">{formatNaira(trip.feeNgn)}</span>
                {" · pay cash to the rider"}
              </p>
              {trip.deliveryPin ? (
                <DeliveryPin
                  pin={trip.deliveryPin}
                  hint="The rider will ask for this code at drop-off."
                />
              ) : null}
            </>
          ) : null}

          {assigned && trip.riderName ? (
            <div>
              <div className="flex items-center gap-3">
                <Avatar
                  src={trip.riderPhotoUrl}
                  name={trip.riderName}
                  className="h-12 w-12 text-[18px]"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[17px] font-semibold">{trip.riderName}</p>
                  <p className="font-display text-[13px] font-medium text-[#8A8780]">
                    {tripHeadline(trip)}
                  </p>
                </div>
                {trip.riderPhone ? (
                  <a
                    href={`tel:${trip.riderPhone}`}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EEEDE8] text-brand"
                    aria-label="Call rider"
                  >
                    <Phone className="h-5 w-5" />
                  </a>
                ) : null}
              </div>
              <p className="mt-3 text-[13px] text-[#8A8780]">
                Pay{" "}
                <span className="num font-semibold">{formatNaira(trip.feeNgn)}</span>{" "}
                cash to the rider
              </p>
              {trip.deliveryPin ? (
                <DeliveryPin
                  pin={trip.deliveryPin}
                  hint="Give this code to the rider when they hand over the package."
                />
              ) : null}
              {trip.customerRole === "receiver" && trip.senderName ? (
                <p className="mt-2 text-[13px] text-[#8A8780]">
                  Coming from {trip.senderName}
                  {trip.senderPhone ? ` · ${trip.senderPhone}` : ""}
                </p>
              ) : trip.receiverName ? (
                <p className="mt-2 text-[13px] text-[#8A8780]">
                  Delivering to {trip.receiverName}
                  {trip.receiverPhone ? ` · ${trip.receiverPhone}` : ""}
                </p>
              ) : null}
            </div>
          ) : null}

          {trip.status === "cancelled" ? (
            <div>
              <p className="font-display text-[22px] font-semibold tracking-[-0.03em]">
                This request was cancelled
              </p>
              {trip.cancelReason ? (
                <p className="mt-2 text-[13px] text-[#8A8780]">{trip.cancelReason}</p>
              ) : null}
            </div>
          ) : null}

          <div className="pt-5">
            {showCancel ? (
              <div>
                {askCancel ? (
                  <div className="space-y-3">
                    <p className="text-center text-[13px] text-[#8A8780]">
                      {assigned
                        ? "The rider is already on the way. Why are you cancelling?"
                        : "Why are you cancelling?"}
                    </p>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {CANCEL_REASONS.map((reason) => (
                        <button
                          key={reason}
                          type="button"
                          className={
                            cancelReason === reason
                              ? "rounded-full bg-brand px-2.5 py-1 text-[12px] font-semibold text-white"
                              : "rounded-full bg-[#FAFAF7] px-2.5 py-1 text-[12px] font-medium text-[#1A1A16]"
                          }
                          onClick={() => setCancelReason(reason)}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                    {cancelReason === "Other" ? (
                      <textarea
                        value={cancelNote}
                        onChange={(e) => setCancelNote(e.target.value)}
                        rows={2}
                        placeholder="Add a short note"
                        className="w-full rounded-2xl bg-[#FAFAF7] px-3 py-2 text-[14px] outline-none"
                      />
                    ) : null}
                    <Button
                      className="w-full"
                      disabled={
                        cancelOrder.isPending ||
                        !cancelReason ||
                        (cancelReason === "Other" && cancelNote.trim().length < 4)
                      }
                      onClick={() => void handleCancel()}
                    >
                      {cancelOrder.isPending ? "Cancelling…" : "Yes, cancel"}
                    </Button>
                    <button
                      type="button"
                      className="w-full text-center text-[14px] font-medium text-[#8A8780]"
                      disabled={cancelOrder.isPending}
                      onClick={() => {
                        setAskCancel(false);
                        setCancelReason("");
                        setCancelNote("");
                      }}
                    >
                      Keep waiting
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="w-full text-center text-[14px] font-medium text-[#8A8780]"
                    onClick={() => {
                      setCancelError("");
                      setCancelReason("");
                      setCancelNote("");
                      setAskCancel(true);
                    }}
                  >
                    Cancel
                  </button>
                )}
                {cancelError ? (
                  <p className="mt-3 text-center text-[13px] text-[#B42318]">
                    {cancelError}
                  </p>
                ) : null}
              </div>
            ) : null}

            {trip.status === "completed" || trip.status === "cancelled" ? (
              <Link href="/">
                <Button className="w-full">Book another errand</Button>
              </Link>
            ) : null}
          </div>
        </div>
      </AppSheet>
    </div>
  );
}

function DeliveryPin({ pin, hint }: { pin: string; hint: string }) {
  return (
    <div className="mt-4 rounded-2xl bg-[#EEEDE8] px-4 py-3">
      <p className="text-[11px] font-medium tracking-[0.06em] text-[#8A8780] uppercase">
        Delivery PIN
      </p>
      <p className="num mt-1 text-[28px] font-semibold tracking-[0.28em] text-[#1A1A16]">
        {pin}
      </p>
      <p className="mt-1 text-[13px] text-[#8A8780]">{hint}</p>
    </div>
  );
}
