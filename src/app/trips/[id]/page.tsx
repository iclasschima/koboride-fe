"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Phone } from "lucide-react";
import { CityMap, type MapMode } from "@/components/map/CityMap";
import { AppSheet } from "@/components/ui/AppSheet";
import { Button } from "@/components/ui/Button";
import { StatusStepper } from "@/components/ui/StatusStepper";
import { NotifyPrompt } from "@/components/notify/NotifyPrompt";
import { formatNaira, formatCountdown } from "@/lib/format";
import {
  useAutoAssignMutation,
  useCancelOrderMutation,
  useConfirmCompletionMutation,
  useTrip,
} from "@/lib/query/hooks";
import { tripHeadline } from "@/types/request";

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
  const confirmCompletion = useConfirmCompletionMutation();

  const [snap, setSnap] = useState<number | string | null>(PEEK);
  const [autoConfirmLeft, setAutoConfirmLeft] = useState<number | null>(null);

  useEffect(() => {
    if (trip?.riderPhase === "delivered" || trip?.status === "completed") {
      setSnap(OPEN);
    }
  }, [trip?.riderPhase, trip?.status]);

  useEffect(() => {
    const due =
      trip?.status === "in_progress" && trip.riderPhase === "delivered"
        ? trip.autoConfirmInMs
        : null;
    if (due == null || !trip) {
      setAutoConfirmLeft(null);
      return;
    }
    const started = Date.now();
    const remaining = () => due - (Date.now() - started);
    setAutoConfirmLeft(remaining());
    const tick = window.setInterval(() => setAutoConfirmLeft(remaining()), 15_000);
    const done = window.setTimeout(() => {
      void confirmCompletion.mutateAsync(trip.id).catch(() => undefined);
    }, Math.max(0, due));
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(done);
    };
  }, [confirmCompletion, trip?.autoConfirmInMs, trip?.id, trip?.riderPhase, trip?.status]);

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

  const delivered = trip.status === "in_progress" && trip.riderPhase === "delivered";
  const assigned = trip.status === "in_progress";
  const searching = trip.status === "dispatching";
  const mapMode: MapMode =
    searching ? "searching" : trip.pickup && trip.dropoff ? "route" : "idle";
  const initial = (trip.riderName ?? "R").trim().charAt(0).toUpperCase();

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
        <div className="min-w-0 rounded-full bg-[#FAFAF7]/95 px-3 py-2 shadow-[0_8px_24px_rgba(15,61,46,0.12)]">
          <h1 className="truncate font-display text-[14px] font-semibold tracking-[-0.02em]">
            {tripHeadline(trip)}
          </h1>
        </div>
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
            </>
          ) : null}

          {assigned && trip.riderName ? (
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand font-display text-[18px] font-semibold text-[#FAFAF7]">
                  {initial}
                </span>
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
            <p className="font-display text-[22px] font-semibold tracking-[-0.03em]">
              This request was cancelled
            </p>
          ) : null}

          <div className="pt-5">
            {searching ? (
              <button
                type="button"
                className="w-full text-center text-[14px] font-medium text-[#8A8780]"
                onClick={() =>
                  void cancelOrder.mutateAsync(trip.id).then(() => router.push("/"))
                }
              >
                Cancel
              </button>
            ) : null}

            {delivered ? (
              <div>
                {autoConfirmLeft != null ? (
                  <p className="mb-3 text-center text-[13px] text-[#8A8780]">
                    {autoConfirmLeft > 0
                      ? `Auto-confirms in ${formatCountdown(autoConfirmLeft)}`
                      : "Auto-confirming…"}
                  </p>
                ) : null}
                <Button
                  className="w-full"
                  disabled={confirmCompletion.isPending}
                  onClick={() => void confirmCompletion.mutateAsync(trip.id)}
                >
                  {confirmCompletion.isPending ? "Confirming…" : "Confirm delivered"}
                </Button>
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
