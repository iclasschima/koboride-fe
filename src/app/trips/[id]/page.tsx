"use client";

import { useEffect, useState } from "react";
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
import { formatDateTime, formatDuration, formatFare, formatNaira, tripDurationSeconds } from "@/lib/format";
import {
  useAcceptRetentionOfferMutation,
  useCancelOrderMutation,
  useRevealDeliveryPinMutation,
  useTrip,
} from "@/lib/query/hooks";
import {
  CANCEL_REASONS,
  canCustomerCancel,
  canShareDeliveryPin,
  isActiveTrip,
  isComplimentary,
  tripHeadline,
  tripPaidOnline,
  type Trip,
} from "@/types/request";
import { ApiError } from "@/lib/api/client";

const PEEK = 0.38;
const OPEN = 0.78;

export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const tripId = params.id;

  const { data: trip, isPending, isError } = useTrip(tripId);
  const cancelOrder = useCancelOrderMutation();
  const acceptOffer = useAcceptRetentionOfferMutation();
  const revealPin = useRevealDeliveryPinMutation();

  const [snap, setSnap] = useState<number | string | null>(PEEK);
  const [askCancel, setAskCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelNote, setCancelNote] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [showRetentionOffer, setShowRetentionOffer] = useState(false);
  const [retentionDiscount, setRetentionDiscount] = useState(100);
  const [offerError, setOfferError] = useState("");

  useEffect(() => {
    if (trip?.riderPhase === "delivered" || trip?.status === "completed") {
      setSnap(OPEN);
      return;
    }
    if (trip?.deliveryPinRequested && !trip.deliveryPinRevealed) {
      setSnap(OPEN);
    }
  }, [
    trip?.riderPhase,
    trip?.status,
    trip?.deliveryPinRequested,
    trip?.deliveryPinRevealed,
  ]);

  useEffect(() => {
    setShowRetentionOffer(false);
    setOfferError("");
  }, [tripId]);

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
  const emptyZone = trip.cancelReason === "No riders in this area yet";
  const scheduledPending = Boolean(
    searching &&
      trip.scheduledFor &&
      new Date(trip.scheduledFor).getTime() > Date.now(),
  );
  const showCancel = canCustomerCancel(trip) && !showRetentionOffer;
  const offerAmount = retentionDiscount || trip.retentionDiscountNgn || 100;

  async function handleCancel() {
    setCancelError("");
    try {
      const result = await cancelOrder.mutateAsync({
        tripId,
        reason: cancelReason,
        note: cancelReason === "Other" ? cancelNote.trim() : undefined,
      });
      if (result.offerAvailable) {
        setAskCancel(false);
        setShowRetentionOffer(true);
        setRetentionDiscount(result.discountAmount ?? 100);
        setSnap(OPEN);
        return;
      }
      router.push("/");
    } catch (err) {
      setAskCancel(false);
      setCancelError(
        err instanceof ApiError ? err.message : "Could not cancel this order",
      );
    }
  }

  async function handleAcceptOffer() {
    setOfferError("");
    try {
      await acceptOffer.mutateAsync(tripId);
      setShowRetentionOffer(false);
      setSnap(PEEK);
    } catch (err) {
      setOfferError(
        err instanceof ApiError ? err.message : "Could not apply that discount",
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
        autoHeight
        snapPoints={[PEEK, OPEN]}
        activeSnapPoint={snap}
        setActiveSnapPoint={setSnap}
        className="pb-[calc(var(--kb-nav)+0.25rem)]"
      >
        <div className="px-5 pt-1">
          {searching || assigned || trip.status === "completed" ? (
            <div className="mb-3">
              <StatusStepper trip={trip} />
              {searching || assigned ? <NotifyPrompt /> : null}
            </div>
          ) : null}

          {trip.status === "completed" ? (
            <div>
              <p className="font-display text-[22px] font-semibold tracking-[-0.03em]">
                Package delivered
              </p>
              {tripDurationSeconds(trip) != null ? (
                <p className="mt-2 text-[13px] text-[#8A8780]">
                  Completed in {formatDuration(tripDurationSeconds(trip)!)}
                </p>
              ) : null}
              {trip.riderName ? (
                <div className="mt-4 flex items-center gap-3">
                  <Avatar
                    src={trip.riderPhotoUrl}
                    name={trip.riderName}
                    className="h-11 w-11 text-[16px]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[15px] font-semibold">{trip.riderName}</p>
                    <p className="text-[13px] text-[#8A8780]">Your rider</p>
                  </div>
                </div>
              ) : null}
              <TripRoute trip={trip} />
              <dl className="mt-3 space-y-1.5">
                <DetailRow label="Ordered" value={formatDateTime(trip.createdAt)} />
                <DetailRow
                  label="Delivered"
                  value={formatDateTime(trip.completedAt ?? trip.updatedAt)}
                />
                <DetailRow
                  label="Fare"
                  value={
                    isComplimentary(trip)
                      ? "Free"
                      : `${formatNaira(trip.feeNgn)}${tripPaidOnline(trip)
                          ? " · paid online"
                          : " · paid cash"
                        }`
                  }
                />
                {trip.customerRole === "receiver" && trip.senderName ? (
                  <DetailRow label="From" value={trip.senderName} />
                ) : trip.receiverName ? (
                  <DetailRow label="For" value={trip.receiverName} />
                ) : null}
                {trip.notes ? <DetailRow label="Package" value={trip.notes} /> : null}
              </dl>
            </div>
          ) : null}

          {searching ? (
            <>
              <p className="font-display text-[22px] font-semibold tracking-[-0.03em]">
                {scheduledPending ? "Rescheduled" : "Searching for a rider"}
                {!scheduledPending ? (
                  <span className="inline-flex w-[1.1em] animate-pulse">…</span>
                ) : null}
              </p>
              {scheduledPending && trip.scheduledFor ? (
                <p className="mt-2 text-[13px] text-[#8A8780]">
                  We’ll search again around{" "}
                  <span className="font-medium text-[#1A1A16]">
                    {formatDateTime(trip.scheduledFor)}
                  </span>
                </p>
              ) : (
                <p className="mt-2 text-[13px] text-[#8A8780]">
                  <span className="num font-semibold">{formatFare(trip.feeNgn)}</span>
                  {isComplimentary(trip)
                    ? " · no payment this time"
                    : tripPaidOnline(trip)
                      ? " · paid online"
                      : trip.farePayer === "receiver"
                        ? " · receiver pays cash"
                        : trip.farePayer === "sender" && trip.customerRole === "receiver"
                          ? " · sender pays cash"
                          : " · you pay cash to the rider"}
                </p>
              )}
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
                {isComplimentary(trip) ? (
                  "This order is free"
                ) : tripPaidOnline(trip) ? (
                  <>
                    Paid{" "}
                    <span className="num font-semibold">{formatNaira(trip.feeNgn)}</span>{" "}
                    online
                  </>
                ) : trip.farePayer === "receiver" ? (
                  <>
                    <span className="num font-semibold">{formatNaira(trip.feeNgn)}</span>
                    {" · receiver pays cash at drop-off"}
                  </>
                ) : trip.farePayer === "sender" && trip.customerRole === "receiver" ? (
                  <>
                    <span className="num font-semibold">{formatNaira(trip.feeNgn)}</span>
                    {" · sender pays cash at pickup"}
                  </>
                ) : (
                  <>
                    Pay{" "}
                    <span className="num font-semibold">{formatNaira(trip.feeNgn)}</span>{" "}
                    cash to the rider
                  </>
                )}
              </p>
              {trip.deliveryPin ? (
                <DeliveryPin
                  pin={trip.deliveryPin}
                  revealed={Boolean(trip.deliveryPinRevealed)}
                  requested={Boolean(trip.deliveryPinRequested) && !trip.deliveryPinRevealed}
                  canReveal={canShareDeliveryPin(trip)}
                  revealing={revealPin.isPending}
                  onReveal={() => revealPin.mutate(tripId)}
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
                {emptyZone ? "No riders here yet" : "This request was cancelled"}
              </p>
              {emptyZone ? (
                <p className="mt-2 text-[13px] text-[#8A8780]">
                  KoboRide doesn't have registered riders here yet. Your request
                  is saved — we'll use it when we start matching.
                </p>
              ) : trip.cancelReason ? (
                <p className="mt-2 text-[13px] text-[#8A8780]">{trip.cancelReason}</p>
              ) : null}
              {trip.paymentStatus === "refunded" ? (
                <p className="mt-2 text-[13px] text-[#8A8780]">
                  Your payment is being refunded to your bank or card.
                </p>
              ) : null}
              <TripRoute trip={trip} />
              <dl className="mt-3 space-y-1.5">
                <DetailRow label="Ordered" value={formatDateTime(trip.createdAt)} />
                <DetailRow label="Cancelled" value={formatDateTime(trip.updatedAt)} />
                <DetailRow
                  label="Fare"
                  value={
                    isComplimentary(trip)
                      ? "Free"
                      : `${formatNaira(trip.feeNgn)}${trip.paymentStatus === "refunded"
                          ? " · refunded"
                          : tripPaidOnline(trip)
                            ? " · paid online"
                            : " · never charged"
                        }`
                  }
                />
                {trip.customerRole === "receiver" && trip.senderName ? (
                  <DetailRow label="From" value={trip.senderName} />
                ) : trip.receiverName ? (
                  <DetailRow label="For" value={trip.receiverName} />
                ) : null}
                {trip.notes ? <DetailRow label="Package" value={trip.notes} /> : null}
              </dl>
            </div>
          ) : null}
        </div>

        <div className="px-5 pt-3">
          {showRetentionOffer ? (
            <div className="space-y-3">
              <p className="font-display text-center text-[20px] font-semibold tracking-[-0.03em]">
                Keep waiting and save {formatNaira(offerAmount)}
              </p>
              <p className="text-center text-[13px] text-[#8A8780]">
                {tripPaidOnline(trip)
                  ? `We’ll keep looking for a rider and refund ${formatNaira(offerAmount)} to your bank or card.`
                  : `We’ll keep looking for a rider at ${formatNaira(Math.max(100, trip.feeNgn - offerAmount))}.`}
              </p>
              <Button
                className="w-full"
                disabled={acceptOffer.isPending || cancelOrder.isPending}
                onClick={() => void handleAcceptOffer()}
              >
                {acceptOffer.isPending
                  ? "Saving…"
                  : `Keep waiting · save ${formatNaira(offerAmount)}`}
              </Button>
              <button
                type="button"
                className="w-full py-2 text-center text-[14px] font-medium text-danger"
                disabled={acceptOffer.isPending || cancelOrder.isPending}
                onClick={() => {
                  setShowRetentionOffer(false);
                  void handleCancel();
                }}
              >
                Cancel anyway
              </button>
              {offerError ? (
                <p className="text-center text-[13px] text-[#B42318]">{offerError}</p>
              ) : null}
            </div>
          ) : null}

          {showCancel || askCancel ? (
            <div>
              {askCancel ? (
                <div className="space-y-3">
                  <p className="text-center text-[13px] text-[#8A8780]">
                    {assigned
                      ? tripPaidOnline(trip)
                        ? "The rider is already on the way. We’ll refund the fare to your bank or card."
                        : "The rider is already on the way. Why are you cancelling?"
                      : tripPaidOnline(trip)
                        ? "We’ll refund the fare to your bank or card."
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
                            : "rounded-full bg-[#EEEDE8] px-2.5 py-1 text-[12px] font-medium text-[#1A1A16]"
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
                      className="w-full rounded-2xl bg-[#EEEDE8] px-3 py-2 text-[14px] outline-none"
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
                    {cancelOrder.isPending
                      ? "Cancelling…"
                      : tripPaidOnline(trip)
                        ? "Cancel and refund"
                        : "Yes, cancel"}
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
                    {assigned ? "Keep this order" : "Keep waiting"}
                  </button>
                </div>
              ) : showCancel ? (
                <div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    className="w-full text-danger"
                    onClick={() => {
                      setSnap(OPEN);
                      setCancelError("");
                      setCancelReason("");
                      setCancelNote("");
                      setAskCancel(true);
                    }}
                  >
                    Cancel this order
                  </Button>
                  <p className="mt-2 text-center text-[12px] text-[#8A8780]">
                    {assigned
                      ? "You can cancel until the rider picks up the package."
                      : scheduledPending
                        ? "You can cancel before we start searching again."
                        : "Free to cancel while we look for a rider."}
                  </p>
                </div>
              ) : null}
              {cancelError ? (
                <p className="mt-3 text-center text-[13px] text-[#B42318]">{cancelError}</p>
              ) : null}
            </div>
          ) : isActiveTrip(trip) && !showRetentionOffer ? (
            <p className="text-center text-[13px] text-[#8A8780]">
              The rider already has this package, so it is too late to cancel. Call the
              rider or tap Report if something is wrong.
            </p>
          ) : null}

          {trip.status === "completed" || trip.status === "cancelled" ? (
            <Link href="/">
              <Button className="w-full">Book another errand</Button>
            </Link>
          ) : null}
        </div>
      </AppSheet>
    </div>
  );
}

function TripRoute({ trip }: { trip: Trip }) {
  return (
    <div className="mt-4 flex gap-3 rounded-2xl bg-[#EEEDE8] px-4 py-3">
      <div className="flex flex-col items-center pt-1.5">
        <span className="h-2 w-2 rounded-full bg-brand" />
        <span className="my-1 w-px flex-1 bg-[#C9C6BE]" />
        <span className="h-2 w-2 rounded-full bg-accent" />
      </div>
      <div className="min-w-0 flex-1 space-y-2.5">
        <div>
          <p className="text-[11px] font-medium tracking-[0.06em] text-[#8A8780] uppercase">
            Pickup
          </p>
          <p className="text-[14px] font-medium text-[#1A1A16]">{trip.pickup}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium tracking-[0.06em] text-[#8A8780] uppercase">
            Drop-off
          </p>
          <p className="text-[14px] font-medium text-[#1A1A16]">{trip.dropoff}</p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-[13px]">
      <dt className="shrink-0 text-[#8A8780]">{label}</dt>
      <dd className="min-w-0 text-right font-medium text-[#1A1A16]">{value}</dd>
    </div>
  );
}

function DeliveryPin({
  pin,
  revealed,
  requested,
  canReveal,
  revealing,
  onReveal,
}: {
  pin: string;
  revealed?: boolean;
  requested?: boolean;
  canReveal?: boolean;
  revealing?: boolean;
  onReveal?: () => void;
}) {
  const shareReady = Boolean(canReveal || requested);
  const hint = revealed
    ? "Shared with the rider"
    : requested
      ? "Rider is waiting for this code"
      : shareReady
        ? "Give this to the rider at drop-off"
        : "Share this when the rider is heading to drop-off";

  return (
    <div className="mt-4 rounded-2xl bg-[#EEEDE8] px-4 py-3">
      <p className="text-[11px] font-medium tracking-[0.06em] text-[#8A8780] uppercase">
        Delivery PIN
      </p>
      <p className="num mt-1 text-[28px] font-semibold tracking-[0.28em] text-[#1A1A16]">
        {pin}
      </p>
      <p className="mt-1 text-[13px] text-[#8A8780]">{hint}</p>
      {onReveal && !revealed ? (
        <Button
          type="button"
          variant="secondary"
          size="md"
          className="mt-3 w-full bg-[#FAFAF7]"
          disabled={revealing || !shareReady}
          onClick={onReveal}
        >
          {revealing ? "Sharing…" : "Reveal code"}
        </Button>
      ) : null}
    </div>
  );
}
