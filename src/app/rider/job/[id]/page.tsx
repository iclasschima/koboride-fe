"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Bike, Check, ChevronLeft, Navigation, Package, Phone } from "lucide-react";
import { CityMap } from "@/components/map/CityMap";
import { ReportOrderButton } from "@/components/support/WhatsAppSupport";
import { Avatar } from "@/components/ui/Avatar";
import { StatusStepper } from "@/components/ui/StatusStepper";
import { Button } from "@/components/ui/Button";
import { tapFeedback } from "@/lib/tapFeedback";
import { SUPPORT_TEL_URL } from "@/lib/support";
import {
  useAdvanceRiderMutation,
  useReleaseJobMutation,
  useRequestDeliveryPinMutation,
  useRiderTrip,
} from "@/lib/query/hooks";
import { canRiderRelease, RELEASE_REASONS, tripPaidOnline, type RiderPhase } from "@/types/request";
import { formatNaira } from "@/lib/format";

const SKIP_REASONS = [
  "Phone died",
  "Not around",
  "No app",
];

const ACTION: Record<
  RiderPhase,
  { label: string; pidgin: string; icon: typeof Bike }
> = {
  accepted: { label: "I'm heading there", pidgin: "I don enter road", icon: Bike },
  en_route_pickup: { label: "Mark as collected", pidgin: "I don collect am", icon: Package },
  collected: { label: "Mark as delivered", pidgin: "I don deliver", icon: Check },
  en_route_dropoff: { label: "Mark as delivered", pidgin: "I don deliver", icon: Check },
  delivered: { label: "Done", pidgin: "E don finish", icon: Check },
};

function atPickup(phase: RiderPhase) {
  return phase === "accepted" || phase === "en_route_pickup";
}

function atDropoff(phase: RiderPhase) {
  return phase === "collected" || phase === "en_route_dropoff";
}

export default function RiderJobPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [askPin, setAskPin] = useState(false);
  const [pin, setPin] = useState("");
  const { data: trip, isPending, isError, refetch } = useRiderTrip(
    params.id,
    true,
    askPin ? 2_000 : 12_000,
  );
  const advance = useAdvanceRiderMutation();
  const requestPin = useRequestDeliveryPinMutation();
  const release = useReleaseJobMutation();
  const [skipOpen, setSkipOpen] = useState(false);
  const [skipReason, setSkipReason] = useState("");
  const [skipPhoto, setSkipPhoto] = useState<File | null>(null);
  const [proofError, setProofError] = useState("");
  const [askRelease, setAskRelease] = useState(false);
  const [releaseReason, setReleaseReason] = useState("");
  const [releaseNote, setReleaseNote] = useState("");
  const [releaseError, setReleaseError] = useState("");

  useEffect(() => {
    if (!askPin) return;
    void refetch();
  }, [askPin, refetch]);

  useEffect(() => {
    if (!askPin) return;
    const revealed = trip?.deliveryPin?.replace(/\D/g, "").slice(0, 4) ?? "";
    if (revealed.length === 4) setPin(revealed);
  }, [askPin, trip?.deliveryPin]);

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
  const pickup = atPickup(phase);
  const dropoff = atDropoff(phase);
  const canDrop = canRiderRelease(trip);
  const needsPin = Boolean(trip.requiresDeliveryPin ?? trip.deliveryPin);
  const action = ACTION[phase];
  const place = pickup ? trip.pickup : trip.dropoff;
  const maps = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place)}`;

  async function next(input?: { pin?: string; skipReason?: string; photo?: File }) {
    setProofError("");
    try {
      let updated = await advance.mutateAsync({ tripId: params.id, ...input });
      if (updated.status === "in_progress" && updated.riderPhase === "collected") {
        updated = await advance.mutateAsync({ tripId: params.id });
      }
      setAskPin(false);
      setSkipOpen(false);
      if (updated.status === "completed" || updated.riderPhase === "delivered") {
        router.push("/rider");
      }
    } catch (err) {
      setProofError(err instanceof Error ? err.message : "Could not update this job");
    }
  }

  function onAction() {
    tapFeedback();
    if (dropoff && needsPin) {
      setAskPin(true);
      return;
    }
    void next();
  }

  async function dropJob() {
    setReleaseError("");
    try {
      await release.mutateAsync({
        tripId: params.id,
        reason: releaseReason,
        note: releaseReason === "Other" ? releaseNote.trim() : undefined,
      });
      router.push("/rider");
    } catch (err) {
      setReleaseError(err instanceof Error ? err.message : "Could not drop this job");
    }
  }

  return (
    <div className="relative flex h-full flex-col bg-[#FAFAF7]">
      <div className="relative min-h-36 flex-1">
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

      <div className="relative z-10 -mt-5 max-h-[72%] shrink-0 overflow-y-auto rounded-t-[28px] bg-[#FAFAF7] px-5 pt-4 pb-2">
        {askRelease && canDrop ? (
          <ReleasePanel
            reason={releaseReason}
            note={releaseNote}
            error={releaseError}
            pending={release.isPending}
            onReason={setReleaseReason}
            onNote={setReleaseNote}
            onBack={() => {
              setAskRelease(false);
              setReleaseReason("");
              setReleaseNote("");
              setReleaseError("");
            }}
            onConfirm={() => {
              tapFeedback();
              void dropJob();
            }}
          />
        ) : askPin && needsPin ? (
          <PinPanel
            pin={pin}
            shared={Boolean(trip.deliveryPin && trip.deliveryPin.length === 4)}
            asked={Boolean(trip.deliveryPinRequested)}
            asking={requestPin.isPending}
            error={proofError}
            pending={advance.isPending}
            skipOpen={skipOpen}
            skipReason={skipReason}
            onPin={setPin}
            onRequest={() => {
              tapFeedback();
              setProofError("");
              void requestPin.mutateAsync(params.id).catch((err) => {
                setProofError(err instanceof Error ? err.message : "Could not ask for the PIN");
              });
            }}
            onCancel={() => {
              setAskPin(false);
              setSkipOpen(false);
              setProofError("");
            }}
            onConfirm={() => {
              tapFeedback();
              void next({ pin });
            }}
            onSkipOpen={() => setSkipOpen(true)}
            onSkipReason={setSkipReason}
            onSkipPhoto={setSkipPhoto}
            onSkip={() => {
              tapFeedback();
              void next({
                skipReason: skipReason.trim(),
                photo: skipPhoto ?? undefined,
              });
            }}
          />
        ) : (
          <>
            <StatusStepper trip={trip} />
            <p className="mt-4 font-display text-[13px] font-semibold tracking-[0.08em] text-[#8A8780] uppercase">
              {pickup ? "Pickup" : "Drop-off"}
            </p>
            <a
              href={maps}
              target="_blank"
              rel="noreferrer"
              className="mt-2 flex items-center gap-3"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EEEDE8] text-brand">
                <Navigation className="h-6 w-6" strokeWidth={2.2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="font-display block text-[20px] leading-tight font-semibold tracking-[-0.03em]">
                  {place}
                </span>
                <span className="mt-0.5 block text-[15px] font-medium text-brand">
                  Show direction
                </span>
              </span>
            </a>
            <JobDetails
              personLabel={pickup ? "Who to meet" : "Deliver to"}
              name={pickup ? trip.senderName : trip.receiverName}
              phone={pickup ? trip.senderPhone : trip.receiverPhone}
              notes={trip.notes}
              pickupFallbackPhone={dropoff ? trip.senderPhone : ""}
            />
            <p className="mt-3 text-[13px] text-[#8A8780]">
              {tripPaidOnline(trip)
                ? `Customer paid ${formatNaira(trip.feeNgn)} online`
                : `Collect ${formatNaira(trip.feeNgn)} cash`}
            </p>

            {phase !== "delivered" ? (
              <>
                <SlideToAction
                  key={phase}
                  icon={action.icon}
                  label={advance.isPending ? "…" : action.label}
                  pidgin={action.pidgin}
                  disabled={advance.isPending}
                  onComplete={onAction}
                />
                <div className="mt-2 flex items-center justify-center gap-3 text-[13px] font-medium text-[#8A8780]">
                  <a href={SUPPORT_TEL_URL} className="py-1">
                    Call support
                  </a>
                  {canDrop ? (
                    <>
                      <span aria-hidden>·</span>
                      <button
                        type="button"
                        className="py-1"
                        onClick={() => {
                          setReleaseError("");
                          setReleaseReason("");
                          setReleaseNote("");
                          setAskRelease(true);
                        }}
                      >
                        Cancel this job
                      </button>
                    </>
                  ) : null}
                </div>
              </>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function SlideToAction({
  icon: Icon,
  label,
  pidgin,
  disabled,
  onComplete,
}: {
  icon: typeof Bike;
  label: string;
  pidgin: string;
  disabled?: boolean;
  onComplete: () => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(0);
  const [maxTravel, setMaxTravel] = useState(0);
  const xRef = useRef(0);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startOffset = useRef(0);
  const maxX = useRef(0);

  const thumbX = disabled ? 0 : x;

  function setOffset(next: number) {
    xRef.current = next;
    setX(next);
  }

  function travel() {
    const width = trackRef.current?.clientWidth ?? 0;
    return Math.max(0, width - 68);
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (disabled) return;
    dragging.current = true;
    startX.current = event.clientX;
    startOffset.current = 0;
    setOffset(0);
    const max = travel();
    maxX.current = max;
    setMaxTravel(max);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    const next = Math.min(
      maxX.current,
      Math.max(0, startOffset.current + event.clientX - startX.current),
    );
    setOffset(next);
  }

  function complete() {
    maxX.current = travel();
    setOffset(maxX.current);
    tapFeedback();
    onComplete();
  }

  function onPointerUp() {
    if (!dragging.current) return;
    dragging.current = false;
    const max = maxX.current || travel();
    if (max > 0 && xRef.current >= max * 0.85) {
      complete();
      return;
    }
    setOffset(0);
  }

  const fade = Math.max(0, 1 - thumbX / 140);

  return (
    <div
      ref={trackRef}
      className="relative mt-3 h-[4.75rem] w-full overflow-hidden rounded-[28px] bg-accent"
    >
      <div
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-16"
        style={{ opacity: fade }}
      >
        <span className="font-display text-center text-[18px] font-bold tracking-[-0.03em]">
          {label}
        </span>
        <span className="text-[13px] font-medium text-[#1A1A16]/70">{pidgin}</span>
      </div>
      <div
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={maxTravel ? Math.round((thumbX / maxTravel) * 100) : 0}
        aria-label={label}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            maxX.current = travel();
            complete();
          }
        }}
        className="absolute top-1.5 left-1.5 z-10 flex h-14 w-14 cursor-grab touch-none items-center justify-center rounded-full bg-[#FAFAF7] text-[#1A1A16] shadow-[0_4px_16px_rgba(15,61,46,0.16)] active:cursor-grabbing"
        style={{ transform: `translateX(${thumbX}px)` }}
      >
        <Icon className="h-7 w-7" strokeWidth={2.4} />
      </div>
    </div>
  );
}

function ReleasePanel({
  reason,
  note,
  error,
  pending,
  onReason,
  onNote,
  onBack,
  onConfirm,
}: {
  reason: string;
  note: string;
  error: string;
  pending: boolean;
  onReason: (value: string) => void;
  onNote: (value: string) => void;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const ready = reason !== "" && (reason !== "Other" || note.trim().length >= 4);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <p className="font-display text-[22px] font-semibold tracking-[-0.03em]">
        Cancel this job?
      </p>
      <p className="mt-1 text-[15px] text-[#8A8780]">
        It goes back to the waiting list for another rider. You can only do this before
        you collect the package.
      </p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {RELEASE_REASONS.map((option) => (
          <button
            key={option}
            type="button"
            className={
              reason === option
                ? "rounded-full bg-brand px-3 py-2 text-[14px] font-semibold text-white"
                : "rounded-full bg-[#EEEDE8] px-3 py-2 text-[14px] font-medium"
            }
            onClick={() => onReason(option)}
          >
            {option}
          </button>
        ))}
      </div>
      {reason === "Other" ? (
        <textarea
          value={note}
          onChange={(e) => onNote(e.target.value)}
          rows={2}
          placeholder="Wetin happen?"
          className="mt-3 w-full rounded-2xl bg-[#EEEDE8] px-3 py-2 text-[16px] outline-none"
        />
      ) : null}
      {error ? <p className="mt-2 text-[16px] font-medium text-danger">{error}</p> : null}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          disabled={pending}
          onClick={onBack}
        >
          Keep the job
        </Button>
        <Button
          type="button"
          variant="danger"
          className="w-full"
          disabled={pending || !ready}
          onClick={onConfirm}
        >
          {pending ? "…" : "Yes, cancel"}
        </Button>
      </div>
    </div>
  );
}

function PinPanel({
  pin,
  shared,
  asked,
  asking,
  error,
  pending,
  skipOpen,
  skipReason,
  onPin,
  onRequest,
  onCancel,
  onConfirm,
  onSkipOpen,
  onSkipReason,
  onSkipPhoto,
  onSkip,
}: {
  pin: string;
  shared: boolean;
  asked: boolean;
  asking: boolean;
  error: string;
  pending: boolean;
  skipOpen: boolean;
  skipReason: string;
  onPin: (value: string) => void;
  onRequest: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  onSkipOpen: () => void;
  onSkipReason: (value: string) => void;
  onSkipPhoto: (file: File | null) => void;
  onSkip: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <p className="font-display text-[22px] font-semibold tracking-[-0.03em]">PIN</p>
      <input
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={4}
        value={pin}
        onChange={(e) => onPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
        placeholder="••••"
        className="num mt-4 h-16 w-full rounded-2xl bg-[#EEEDE8] px-4 text-center text-[28px] tracking-[0.4em] outline-none"
      />
      {error ? <p className="mt-2 text-[16px] font-medium text-danger">{error}</p> : null}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button type="button" variant="secondary" className="w-full" disabled={pending} onClick={onCancel}>
          Back
        </Button>
        <Button
          type="button"
          className="w-full"
          disabled={pending || pin.length !== 4}
          onClick={onConfirm}
        >
          {pending ? "…" : "OK"}
        </Button>
      </div>
      {!shared ? (
        <button
          type="button"
          className="mt-4 w-full text-center text-[14px] font-medium text-brand"
          disabled={pending || asking}
          onClick={onRequest}
        >
          {asking ? "Asking…" : asked ? "Ask again" : "Request code"}
        </button>
      ) : null}
      {!skipOpen ? (
        <button
          type="button"
          className="mt-4 w-full text-center text-[14px] font-medium text-[#8A8780]"
          onClick={onSkipOpen}
        >
          No PIN
        </button>
      ) : (
        <div className="mt-4">
          <div className="flex flex-wrap gap-1.5">
            {SKIP_REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                className="rounded-full bg-[#EEEDE8] px-3 py-2 text-[14px] font-medium"
                onClick={() => onSkipReason(reason)}
              >
                {reason}
              </button>
            ))}
          </div>
          <textarea
            value={skipReason}
            onChange={(e) => onSkipReason(e.target.value)}
            rows={2}
            placeholder="Note"
            className="mt-2 w-full rounded-2xl bg-[#EEEDE8] px-3 py-2 text-[16px] outline-none"
          />
          <input
            type="file"
            accept="image/*"
            className="mt-2 block w-full text-[14px]"
            onChange={(e) => onSkipPhoto(e.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            className="mt-3 w-full"
            disabled={pending || skipReason.trim().length < 8}
            onClick={onSkip}
          >
            {pending ? "…" : "Done"}
          </Button>
        </div>
      )}
    </div>
  );
}

function JobDetails({
  personLabel,
  name,
  phone,
  notes,
  pickupFallbackPhone,
}: {
  personLabel: string;
  name: string;
  phone: string;
  notes: string;
  pickupFallbackPhone?: string;
}) {
  const item = notes.trim() || "Not specified";
  const showPickupFallback = Boolean(pickupFallbackPhone);

  return (
    <div className="mt-4 shrink-0 overflow-hidden rounded-[22px] bg-[#EEEDE8]">
      {name || phone ? (
        <div className="px-3.5 py-3">
          <div className="flex items-center gap-3">
            <Avatar
              name={name || "?"}
              className="h-12 w-12 shrink-0 text-[18px]"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold tracking-[0.06em] text-[#8A8780] uppercase">
                {personLabel}
              </p>
              <p className="font-display truncate text-[18px] leading-tight font-semibold">
                {name || "No name"}
              </p>
            </div>
            {phone ? (
              <a
                href={`tel:${phone}`}
                className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-[#FAFAF7] px-3.5 text-brand"
              >
                <Phone className="h-5 w-5" strokeWidth={2.2} />
                <span className="text-[15px] font-semibold">Call</span>
              </a>
            ) : null}
          </div>
          {showPickupFallback ? (
            <a
              href={`tel:${pickupFallbackPhone}`}
              className="mt-2.5 block text-[13px] font-medium text-brand"
            >
              Not answering? Call pickup person
            </a>
          ) : null}
        </div>
      ) : null}
      <div
        className={`flex items-start gap-3 px-3.5 py-3 ${
          name || phone ? "border-t border-[#1A1A16]/8" : ""
        }`}
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FAFAF7] text-brand">
          <Package className="h-6 w-6" strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[12px] font-semibold tracking-[0.06em] text-[#8A8780] uppercase">
            Package details
          </p>
          <p className="mt-0.5 text-[16px] leading-snug font-medium text-[#1A1A16]">
            {item}
          </p>
        </div>
      </div>
    </div>
  );
}
