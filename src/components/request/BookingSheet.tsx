"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, LocateFixed, MapPin, Package, ShoppingBag, Star, User } from "lucide-react";
import { AppSheet } from "@/components/ui/AppSheet";
import { Button } from "@/components/ui/Button";
import { FareNumber } from "@/components/ui/FareNumber";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  autocompletePlaces,
  placeDetails,
  reverseGeocode,
  type GooglePlaceSuggestion,
} from "@/lib/api/places";
import { ApiError } from "@/lib/api/client";
import { estimateFare, initializeOrderPayment } from "@/lib/api/requests";
import { SEARCH_PLACES, type Place } from "@/lib/places";
import { quoteFee, isInActiveServiceArea } from "@/lib/fare";
import { formatNaira } from "@/lib/format";
import { useClientAppStatus, useCreateTripMutation } from "@/lib/query/hooks";
import { activatePush, primePushPermission } from "@/lib/push";
import { cn } from "@/lib/cn";
import { tripHeadline, type CustomerRole, type PaymentMethod, type Trip } from "@/types/request";
import { openPaystack } from "@/lib/paystack";

function newSession() {
  return crypto.randomUUID();
}

const PEEK = 0.34;
const MID = 0.62;
const TALL = 0.9;

type Step = "peek" | "locations" | "search" | "details" | "fare";
type SearchTarget = "pickup" | "dropoff";

export function BookingSheet({
  activeTrip,
  activeCount = 0,
  maxActiveOrders = 3,
  onRouteChange,
}: {
  activeTrip: Trip | null;
  activeCount?: number;
  maxActiveOrders?: number;
  onRouteChange: (pickup: string | null, dropoff: string | null) => void;
}) {
  const router = useRouter();
  const { authenticated, openAuth, user } = useAuth();
  const createTrip = useCreateTripMutation();
  const { data: appStatus } = useClientAppStatus();
  const paystackEnabled = Boolean(appStatus?.paystackEnabled);

  const [snap, setSnap] = useState<number | string | null>(PEEK);
  const [step, setStep] = useState<Step>("peek");
  const [pickupPlace, setPickupPlace] = useState<Place | null>(null);
  const [dropoffPlace, setDropoffPlace] = useState<Place | null>(null);
  const [searchTarget, setSearchTarget] = useState<SearchTarget>("dropoff");
  const [query, setQuery] = useState("");
  const [googleHits, setGoogleHits] = useState<GooglePlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [notes, setNotes] = useState("");
  const [customerRole, setCustomerRole] = useState<CustomerRole>("sender");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("paystack");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [distanceError, setDistanceError] = useState("");
  const [checkingRange, setCheckingRange] = useState(false);
  const sessionRef = useRef(newSession());

  const pickup = pickupPlace?.name ?? "";
  const dropoff = dropoffPlace?.name ?? "";
  const typed = query.trim();
  const showQuick = typed.length < 2;

  useEffect(() => {
    if (step === "peek") {
      onRouteChange(null, null);
      return;
    }
    onRouteChange(pickup || null, dropoff || null);
  }, [step, pickup, dropoff, onRouteChange]);

  const fee = useMemo(() => {
    if (!pickupPlace || !dropoffPlace || distanceError) return 0;
    return quoteFee({
      pickupLat: pickupPlace.lat,
      pickupLng: pickupPlace.lng,
      dropoffLat: dropoffPlace.lat,
      dropoffLng: dropoffPlace.lng,
    });
  }, [pickupPlace, dropoffPlace, distanceError]);

  useEffect(() => {
    if (!pickupPlace || !dropoffPlace) {
      setDistanceError("");
      setCheckingRange(false);
      return;
    }

    let cancelled = false;
    setCheckingRange(true);
    setDistanceError("");
    void estimateFare({
      pickupLat: pickupPlace.lat,
      pickupLng: pickupPlace.lng,
      dropoffLat: dropoffPlace.lat,
      dropoffLng: dropoffPlace.lng,
    })
      .then(() => {
        if (!cancelled) setDistanceError("");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (
          err instanceof ApiError &&
          (err.code === "DISTANCE_EXCEEDS_MAX" || err.code === "OUTSIDE_SERVICE_AREA")
        ) {
          setDistanceError(err.message);
          return;
        }
        setDistanceError("");
      })
      .finally(() => {
        if (!cancelled) setCheckingRange(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pickupPlace, dropoffPlace]);

  useEffect(() => {
    if (step !== "search") return;
    if (typed.length < 2) {
      setGoogleHits([]);
      setSearching(false);
      setSearchError("");
      return;
    }

    let cancelled = false;
    setSearching(true);
    setSearchError("");
    const t = window.setTimeout(() => {
      void autocompletePlaces(typed, sessionRef.current)
        .then((places) => {
          if (!cancelled) setGoogleHits(places);
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setGoogleHits([]);
            setSearchError(err instanceof Error ? err.message : "Search failed");
          }
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [typed, step]);

  const sending = customerRole === "sender";

  const atActiveLimit = activeCount >= maxActiveOrders;

  function startBooking() {
    if (atActiveLimit) {
      setError(
        `You already have ${maxActiveOrders} live orders. Finish or cancel one to book again.`,
      );
      return;
    }
    setStep("locations");
    setSnap(MID);
    setError("");
  }

  function openSearch(target: SearchTarget) {
    setSearchTarget(target);
    setQuery("");
    setGoogleHits([]);
    setSearchError("");
    sessionRef.current = newSession();
    setStep("search");
    setSnap(TALL);
  }

  function pickQuick(place: Place) {
    if (searchTarget === "pickup") setPickupPlace(place);
    else setDropoffPlace(place);
    setStep("locations");
    setSnap(MID);
  }

  function readGps(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Location is not available on this device"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            reject(new Error("Allow location to pin your exact street"));
            return;
          }
          reject(new Error("Could not read your location. Try again."));
        },
        { enableHighAccuracy: true, timeout: 12_000, maximumAge: 5_000 },
      );
    });
  }

  async function pickCurrentLocation() {
    setLocating(true);
    setSearchError("");
    try {
      const gps = await readGps();
      if (!isInActiveServiceArea(gps.lat, gps.lng)) {
        setSearchError("This location is outside the KoboRide service area.");
        return;
      }
      const place = await reverseGeocode(gps.lat, gps.lng);
      const selected: Place = {
        name: place.name,
        area: place.area,
        lat: gps.lat,
        lng: gps.lng,
        current: true,
      };
      if (searchTarget === "pickup") setPickupPlace(selected);
      else setDropoffPlace(selected);
      setStep("locations");
      setSnap(MID);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Could not use current location");
    } finally {
      setLocating(false);
    }
  }

  async function pickGoogle(hit: GooglePlaceSuggestion) {
    setResolvingId(hit.id);
    setSearchError("");
    try {
      const place = await placeDetails(hit.id, sessionRef.current);
      if (!isInActiveServiceArea(place.lat, place.lng)) {
        setSearchError("This location is outside the KoboRide service area.");
        return;
      }
      sessionRef.current = newSession();
      const selected: Place = {
        name: place.name,
        area: place.area,
        lat: place.lat,
        lng: place.lng,
      };
      if (searchTarget === "pickup") setPickupPlace(selected);
      else setDropoffPlace(selected);
      setStep("locations");
      setSnap(MID);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Could not load that place");
    } finally {
      setResolvingId(null);
    }
  }

  function reset() {
    setStep("peek");
    setSnap(PEEK);
    setPickupPlace(null);
    setDropoffPlace(null);
    setNotes("");
    setCustomerRole("sender");
    setContactName("");
    setContactPhone("");
    setPaymentMethod("paystack");
    setPaying(false);
    setError("");
    setDistanceError("");
    setCheckingRange(false);
  }

  async function findRider() {
    if (!authenticated) {
      openAuth("login");
      return;
    }
    if (!pickupPlace || !dropoffPlace) return;
    setError("");
    primePushPermission();
    void activatePush("customer");
    const meName = user?.name?.trim() || "Customer";
    const mePhone = user?.phone ?? "";
    const payload = {
      pickup: pickupPlace.name,
      dropoff: dropoffPlace.name,
      notes,
      customerRole,
      senderName: sending ? meName : contactName.trim(),
      senderPhone: sending ? mePhone : contactPhone.trim(),
      receiverName: sending ? contactName.trim() : meName,
      receiverPhone: sending ? contactPhone.trim() : mePhone,
      pickupLat: pickupPlace.lat,
      pickupLng: pickupPlace.lng,
      dropoffLat: dropoffPlace.lat,
      dropoffLng: dropoffPlace.lng,
    };
    try {
      if (paystackEnabled && paymentMethod === "paystack") {
        setPaying(true);
        const checkout = await initializeOrderPayment(payload);
        const reference = await openPaystack(checkout);
        const trip = await createTrip.mutateAsync({
          ...payload,
          paymentMethod: "paystack",
          paystackReference: reference,
        });
        router.push(`/trips/${trip.id}`);
        return;
      }
      const trip = await createTrip.mutateAsync({
        ...payload,
        paymentMethod: "cash",
      });
      router.push(`/trips/${trip.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.code === "DISTANCE_EXCEEDS_MAX") {
        setDistanceError(err.message);
        setStep("locations");
        setSnap(MID);
        return;
      }
      setError(err instanceof Error ? err.message : "Could not create request");
    } finally {
      setPaying(false);
    }
  }

  return (
    <AppSheet
      snapPoints={[PEEK, MID, TALL]}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
      autoHeight={step !== "search"}
      className="bottom-[var(--kb-nav)] z-40"
    >
      <div className="flex min-h-0 flex-1 flex-col px-5 pb-5 pt-1">
        {activeTrip && step === "peek" ? (
          <button
            type="button"
            className="mb-3 flex w-full items-center justify-between rounded-2xl bg-brand px-4 py-3 text-left text-[#FAFAF7]"
            onClick={() =>
              router.push(activeCount > 1 ? "/trips" : `/trips/${activeTrip.id}`)
            }
          >
            <div className="min-w-0">
              <p className="font-display text-[11px] font-medium uppercase tracking-[0.08em] text-white/70">
                Live
              </p>
              <p className="truncate font-display text-[16px] font-semibold">
                {activeCount > 1
                  ? `${activeCount} live orders`
                  : tripHeadline(activeTrip)}
              </p>
            </div>
            <span className="kb-pulse shrink-0 text-[12px] font-semibold">Open</span>
          </button>
        ) : null}

        {step === "peek" ? (
          <div>
            <h1 className="font-display text-[22px] leading-tight font-semibold tracking-[-0.03em] text-[#1A1A16]">
              Send a package
            </h1>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={startBooking}
                onTouchEnd={(event) => {
                  event.preventDefault();
                  startBooking();
                }}
                className={cn(
                  "relative z-50 flex min-h-[7.5rem] w-full flex-col items-start rounded-[22px] bg-[#EEEDE8] px-3.5 py-4 text-left",
                  "pointer-events-auto touch-manipulation select-none active:bg-[#E4E2DB]",
                  atActiveLimit && "opacity-60",
                )}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FAFAF7] text-brand">
                  <Package className="h-5 w-5" strokeWidth={2.1} />
                </span>
                <span className="mt-3 font-display text-[16px] leading-tight font-semibold tracking-[-0.02em]">
                  Pickup & Drop-off
                </span>
                <span className="mt-0.5 text-[12px] text-[#8A8780]">
                  Send something
                </span>
              </button>
              <div
                aria-disabled="true"
                className="relative z-50 flex min-h-[7.5rem] w-full flex-col items-start rounded-[22px] bg-[#EEEDE8] px-3.5 py-4 text-left opacity-60"
              >
                <span className="font-display absolute top-3 right-3 rounded-full bg-[#FAFAF7] px-2 py-0.5 text-[10px] font-semibold tracking-[0.02em] text-[#5C5A54]">
                  Coming soon
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FAFAF7] text-[#8A8780]">
                  <ShoppingBag className="h-5 w-5" strokeWidth={2.1} />
                </span>
                <span className="mt-3 font-display text-[16px] leading-tight font-semibold tracking-[-0.02em] text-[#5C5A54]">
                  Buy & deliver
                </span>
                <span className="mt-0.5 text-[12px] text-[#8A8780]">
                  We shop for you
                </span>
              </div>
            </div>
            {atActiveLimit ? (
              <p className="mt-3 text-[13px] font-medium text-[#8A8780]">
                You already have {maxActiveOrders} live orders. Finish or cancel
                one to book again.
              </p>
            ) : error ? (
              <p className="mt-3 text-[13px] font-medium text-danger">{error}</p>
            ) : null}
          </div>
        ) : null}

        {step === "locations" || step === "details" || step === "fare" ? (
          <button
            type="button"
            className="mb-3 inline-flex items-center gap-1 text-[13px] font-medium text-[#8A8780]"
            onClick={() => {
              if (step === "fare") {
                setStep("details");
                return;
              }
              if (step === "details") {
                setStep("locations");
                return;
              }
              reset();
            }}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
        ) : null}

        {step === "locations" ? (
          <div>
            <h2 className="font-display text-[20px] font-semibold tracking-[-0.03em]">
              Set locations
            </h2>
            <div className="mt-4 space-y-2">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-2xl bg-[#EEEDE8] px-4 py-3.5 text-left"
                onClick={() => openSearch("pickup")}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-brand" />
                <span className="min-w-0">
                  <span className="block text-[11px] font-medium text-[#8A8780]">Pickup</span>
                  <span
                    className={cn(
                      "block truncate text-[15px]",
                      pickup ? "font-medium text-[#1A1A16]" : "font-normal text-[#8A8780]",
                    )}
                  >
                    {pickup || "Where should we pick up?"}
                  </span>
                </span>
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-2xl bg-[#EEEDE8] px-4 py-3.5 text-left"
                onClick={() => openSearch("dropoff")}
              >
                <span className="h-2.5 w-2.5 rounded-sm bg-brand" />
                <span className="min-w-0">
                  <span className="block text-[11px] font-medium text-[#8A8780]">Drop-off</span>
                  <span
                    className={cn(
                      "block truncate text-[15px]",
                      dropoff ? "font-medium text-[#1A1A16]" : "font-normal text-[#8A8780]",
                    )}
                  >
                    {dropoff || "Where should it go?"}
                  </span>
                </span>
              </button>
            </div>
            {checkingRange && pickup && dropoff ? (
              <p className="mt-3 text-[13px] text-[#8A8780]">Checking delivery range…</p>
            ) : null}
            {distanceError ? (
              <p className="mt-3 text-[13px] font-medium text-danger">{distanceError}</p>
            ) : null}
            <Button
              className="mt-5 w-full"
              disabled={
                !pickup.trim() ||
                !dropoff.trim() ||
                checkingRange ||
                Boolean(distanceError)
              }
              onClick={() => {
                if (checkingRange || distanceError) return;
                setStep("details");
                setSnap(TALL);
              }}
            >
              Continue
            </Button>
          </div>
        ) : null}

        {step === "search" ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <h2 className="shrink-0 font-display text-[20px] font-semibold tracking-[-0.03em]">
              {searchTarget === "pickup" ? "Pickup" : "Drop-off"}
            </h2>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search an address"
              className="mt-4 h-12 w-full shrink-0 rounded-2xl bg-[#EEEDE8] px-4 text-[15px] outline-none placeholder:text-[#8A8780]"
            />
            {searchError ? (
              <p className="mt-2 shrink-0 text-[13px] font-medium text-danger">{searchError}</p>
            ) : null}
            <ul className="mt-2 min-h-0 flex-1 divide-y divide-black/5 overflow-y-auto">
              {showQuick ? (
                <li>
                  <button
                    type="button"
                    disabled={locating}
                    className="flex w-full items-center gap-3 py-3 text-left disabled:opacity-60"
                    onClick={() => void pickCurrentLocation()}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEEDE8] text-brand">
                      <LocateFixed className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-[15px] font-semibold">
                        {locating ? "Finding your street…" : "Use current location"}
                      </span>
                      <span className="block text-[13px] text-[#8A8780]">
                        {locating ? "Using GPS for an exact pin" : "Pin the street you’re on"}
                      </span>
                    </span>
                  </button>
                </li>
              ) : null}
              {showQuick
                ? SEARCH_PLACES.map((place) => (
                  <li key={place.name}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 py-3 text-left"
                      onClick={() => pickQuick(place)}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEEDE8] text-brand">
                        <Star className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-[15px] font-semibold">{place.name}</span>
                        <span className="block text-[13px] text-[#8A8780]">{place.area}</span>
                      </span>
                    </button>
                  </li>
                ))
                : null}
              {!showQuick && searching ? (
                <li className="py-3 text-[13px] text-[#8A8780]">Searching…</li>
              ) : null}
              {!showQuick && !searching && googleHits.length === 0 && !searchError ? (
                <li className="py-3 text-[13px] text-[#8A8780]">
                  No places found. Try a nearby street or landmark.
                </li>
              ) : null}
              {!showQuick
                ? googleHits.map((place) => (
                  <li key={place.id}>
                    <button
                      type="button"
                      disabled={resolvingId !== null}
                      className="flex w-full items-center gap-3 py-3 text-left disabled:opacity-50"
                      onClick={() => void pickGoogle(place)}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEEDE8] text-brand">
                        <MapPin className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-[15px] leading-snug font-semibold">
                          {place.name}
                        </span>
                        {resolvingId === place.id ? (
                          <span className="block text-[13px] text-[#8A8780]">Loading…</span>
                        ) : place.area ? (
                          <span className="block text-[13px] text-[#8A8780]">{place.area}</span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                ))
                : null}
            </ul>
          </div>
        ) : null}

        {step === "details" ? (
          <div>
            <h2 className="font-display text-[22px] font-semibold tracking-[-0.03em]">
              Package details
            </h2>
            <p className="mt-1 text-[13px] text-[#8A8780]">
              {sending
                ? "What’s going, and who the rider should call at drop-off."
                : "What’s going, and who the rider should collect from."}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-1.5 rounded-2xl bg-[#EEEDE8] p-1">
              <button
                type="button"
                className={cn(
                  "rounded-[14px] px-3 py-2.5 text-[13px] font-semibold",
                  sending ? "bg-[#FAFAF7] text-[#1A1A16]" : "text-[#8A8780]",
                )}
                onClick={() => setCustomerRole("sender")}
              >
                I’m sending
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-[14px] px-3 py-2.5 text-[13px] font-semibold",
                  sending ? "text-[#8A8780]" : "bg-[#FAFAF7] text-[#1A1A16]",
                )}
                onClick={() => setCustomerRole("receiver")}
              >
                I’m receiving
              </button>
            </div>

            <label className="mt-5 block">
              <span className="text-[13px] font-medium text-[#8A8780]">What’s moving</span>
              <textarea
                className="mt-1.5 min-h-22 w-full resize-none rounded-2xl bg-[#EEEDE8] px-4 py-3 text-[15px] outline-none placeholder:text-[#8A8780]"
                placeholder="A small bag, documents, a food pack…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>

            <div className="mt-4 rounded-[22px] bg-[#EEEDE8] p-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#FAFAF7] text-brand">
                  <User className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-display text-[15px] font-semibold tracking-[-0.02em]">
                    {sending ? "Receiver" : "Sender"}
                  </p>
                  <p className="text-[12px] text-[#8A8780]">
                    {sending ? "Name and phone at drop-off" : "Name and phone at pickup"}
                  </p>
                </div>
              </div>
              <input
                className="mt-3.5 h-12 w-full rounded-2xl bg-[#FAFAF7] px-4 text-[15px] outline-none placeholder:text-[#8A8780]"
                placeholder="Name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                autoComplete="name"
              />
              <input
                className="mt-2 h-12 w-full rounded-2xl bg-[#FAFAF7] px-4 text-[15px] outline-none placeholder:text-[#8A8780]"
                placeholder="Phone number"
                inputMode="tel"
                autoComplete="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>

            {error ? (
              <p className="mt-3 text-[13px] font-medium text-danger">{error}</p>
            ) : null}
            <Button
              className="mt-5 w-full"
              onClick={() => {
                if (!notes.trim()) {
                  setError("Tell us what we’re moving");
                  return;
                }
                if (contactName.trim().length < 2 || contactPhone.trim().length < 7) {
                  setError(
                    sending
                      ? "Add the receiver name and phone"
                      : "Add the sender name and phone",
                  );
                  return;
                }
                setError("");
                setStep("fare");
                setSnap(MID);
              }}
            >
              See fare
            </Button>
          </div>
        ) : null}

        {step === "fare" ? (
          <div>
            <FareNumber amount={fee} />
            <p className="mt-2 text-[13px] text-[#8A8780]">
              Flat rate ·{" "}
              <span className="num font-semibold">{formatNaira(fee)}</span>
            </p>
            {paystackEnabled ? (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={cn(
                    "rounded-2xl px-3 py-3 text-left",
                    paymentMethod === "paystack" ? "bg-brand text-[#FAFAF7]" : "bg-[#EEEDE8]",
                  )}
                  onClick={() => setPaymentMethod("paystack")}
                >
                  <p className="font-display text-[15px] font-semibold">Pay now</p>
                  <p
                    className={cn(
                      "mt-0.5 text-[12px]",
                      paymentMethod === "paystack" ? "text-white/70" : "text-[#8A8780]",
                    )}
                  >
                    Card or transfer
                  </p>
                </button>
                <button
                  type="button"
                  className={cn(
                    "rounded-2xl px-3 py-3 text-left",
                    paymentMethod === "cash" ? "bg-brand text-[#FAFAF7]" : "bg-[#EEEDE8]",
                  )}
                  onClick={() => setPaymentMethod("cash")}
                >
                  <p className="font-display text-[15px] font-semibold">I'll pay cash</p>
                  <p
                    className={cn(
                      "mt-0.5 text-[12px]",
                      paymentMethod === "cash" ? "text-white/70" : "text-[#8A8780]",
                    )}
                  >
                    Pay the rider
                  </p>
                </button>
              </div>
            ) : (
              <p className="mt-2 text-[13px] text-[#8A8780]">Pay cash to the rider</p>
            )}
            {error ? (
              <p className="mt-3 text-[13px] font-medium text-danger">{error}</p>
            ) : null}
            <button
              type="button"
              className="mt-6 mb-3 w-full text-center text-[14px] font-medium text-[#8A8780]"
              onClick={reset}
            >
              Cancel
            </button>
            <Button
              className="w-full"
              disabled={createTrip.isPending || paying}
              onClick={() => void findRider()}
            >
              {paying
                ? "Paying…"
                : createTrip.isPending
                  ? "Starting…"
                  : paymentMethod === "paystack"
                    ? `Pay ${formatNaira(fee)}`
                    : "Find a rider"}
            </Button>
          </div>
        ) : null}
      </div>
    </AppSheet>
  );
}
