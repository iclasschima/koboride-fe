"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, History, LocateFixed, MapPin, Package, ShoppingBag, Star } from "lucide-react";
import { NigeriaPhoneField } from "@/components/auth/NigeriaPhoneField";
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
import { recentDeliveredPlaces, samePlace, SAME_PLACE_MESSAGE, type Place } from "@/lib/places";
import { deliveryRangeError, DEFAULT_MAX_DELIVERY_KM, quoteFee } from "@/lib/fare";
import { formatKm, formatNaira } from "@/lib/format";
import { NG_PHONE_ERROR, normalizeNgPhone } from "@/lib/phone";
import { useClientAppStatus, useCreateTripMutation, useTrips } from "@/lib/query/hooks";
import { distanceKmBetween, isInLagos } from "@/lib/zones";
import { activatePush, primePushPermission } from "@/lib/push";
import { cn } from "@/lib/cn";
import {
  ONLINE_PAYMENT_DISCOUNT_NGN,
  tripHeadline,
  type CustomerRole,
  type PaymentMethod,
  type Trip,
} from "@/types/request";
import { openPaystack } from "@/lib/paystack";

function newSession() {
  return crypto.randomUUID();
}

const PEEK = 0.34;
const PROMO_PEEK = 0.5;
const MID = 0.62;
const TALL = 0.9;

type Step = "peek" | "locations" | "search" | "who" | "fare";
const BOOKING_STEPS: Step[] = ["locations", "who", "fare"];
type SearchTarget = "pickup" | "dropoff";

const PACKAGE_PRESETS = [
  "Documents",
  "Food pack",
  "Groceries",
  "Clothes",
  "Small parcel",
  "Phone or gadget",
] as const;

const PACKAGE_OTHER = "other";

function packageNotes(kind: string | null, custom: string): string {
  if (kind === PACKAGE_OTHER) return custom.trim();
  return kind?.trim() ?? "";
}

export function BookingSheet({
  activeTrip,
  activeCount = 0,
  maxActiveOrders = 3,
  cancelLimited = false,
  orderHoldReason,
  onRouteChange,
}: {
  activeTrip: Trip | null;
  activeCount?: number;
  maxActiveOrders?: number;
  cancelLimited?: boolean;
  orderHoldReason?: string | null;
  onRouteChange: (pickup: string | null, dropoff: string | null) => void;
}) {
  const router = useRouter();
  const { authenticated, openAuth, user } = useAuth();
  const createTrip = useCreateTripMutation();
  const { data: appStatus } = useClientAppStatus();
  const { data: tripsPage } = useTrips(authenticated);
  const paystackEnabled = Boolean(appStatus?.paystackEnabled);
  const zones = appStatus?.zones;
  const maxDeliveryKm = appStatus?.maxDeliveryDistanceKm ?? DEFAULT_MAX_DELIVERY_KM;

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
  const [packageKind, setPackageKind] = useState<string | null>(null);
  const [customNotes, setCustomNotes] = useState("");
  const [customerRole, setCustomerRole] = useState<CustomerRole>("sender");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("paystack");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [distanceError, setDistanceError] = useState("");
  const [quotedListFee, setQuotedListFee] = useState(0);
  const [quotedOnlineFee, setQuotedOnlineFee] = useState(0);
  const [quotedOnlineDiscount, setQuotedOnlineDiscount] = useState(ONLINE_PAYMENT_DISCOUNT_NGN);
  const [quotedSecondFree, setQuotedSecondFree] = useState(false);
  const sessionRef = useRef(newSession());

  const secondOrderFree = quotedSecondFree || Boolean(tripsPage?.secondOrderFree);
  const noCompletedOrder =
    !authenticated ||
    (tripsPage != null &&
      !tripsPage.trips.some((trip) => trip.status === "completed"));
  const iPay = customerRole === "sender";
  const payingOnline =
    !secondOrderFree && paystackEnabled && iPay && paymentMethod === "paystack";
  const pickup = pickupPlace?.name ?? "";
  const dropoff = dropoffPlace?.name ?? "";
  const typed = query.trim();
  const showQuick = typed.length < 2;
  const recentPlaces = recentDeliveredPlaces(tripsPage?.trips ?? []).filter((place) => {
    const other = searchTarget === "dropoff" ? pickupPlace : dropoffPlace;
    if (!other) return true;
    if (samePlace(place, other)) return false;
    return (
      deliveryRangeError(
        searchTarget === "dropoff" ? other.lat : place.lat,
        searchTarget === "dropoff" ? other.lng : place.lng,
        searchTarget === "dropoff" ? place.lat : other.lat,
        searchTarget === "dropoff" ? place.lng : other.lng,
        zones,
        maxDeliveryKm,
      ) == null
    );
  });
  const inRangeHits =
    searchTarget === "dropoff" && pickupPlace
      ? googleHits.filter(
          (place) =>
            typeof place.distanceKm !== "number" || place.distanceKm <= maxDeliveryKm,
        )
      : googleHits;

  useEffect(() => {
    if (step === "peek") {
      onRouteChange(null, null);
      return;
    }
    onRouteChange(pickup || null, dropoff || null);
  }, [step, pickup, dropoff, onRouteChange]);

  useEffect(() => {
    if (step !== "peek") return;
    setSnap(noCompletedOrder ? PROMO_PEEK : PEEK);
  }, [step, noCompletedOrder]);

  const listFee = quotedListFee;
  const fee = secondOrderFree
    ? 0
    : payingOnline && quotedOnlineFee > 0
      ? quotedOnlineFee
      : listFee;
  const onlineDiscount =
    payingOnline && listFee > fee ? listFee - fee : 0;

  useEffect(() => {
    if (!pickupPlace || !dropoffPlace) {
      setDistanceError("");
      setQuotedListFee(0);
      setQuotedOnlineFee(0);
      setQuotedOnlineDiscount(ONLINE_PAYMENT_DISCOUNT_NGN);
      setQuotedSecondFree(false);
      return;
    }

    if (samePlace(pickupPlace, dropoffPlace)) {
      setDistanceError(SAME_PLACE_MESSAGE);
      setQuotedListFee(0);
      setQuotedOnlineFee(0);
      setQuotedSecondFree(false);
      return;
    }

    const rangeError = deliveryRangeError(
      pickupPlace.lat,
      pickupPlace.lng,
      dropoffPlace.lat,
      dropoffPlace.lng,
      zones,
      maxDeliveryKm,
    );
    if (rangeError) {
      setDistanceError(rangeError);
      setQuotedListFee(0);
      setQuotedOnlineFee(0);
      setQuotedSecondFree(false);
      return;
    }

    setDistanceError("");
    setQuotedListFee(
      quoteFee({
        pickupLat: pickupPlace.lat,
        pickupLng: pickupPlace.lng,
        dropoffLat: dropoffPlace.lat,
        dropoffLng: dropoffPlace.lng,
        paymentMethod: "cash",
        zones,
      }),
    );
    setQuotedOnlineFee(
      quoteFee({
        pickupLat: pickupPlace.lat,
        pickupLng: pickupPlace.lng,
        dropoffLat: dropoffPlace.lat,
        dropoffLng: dropoffPlace.lng,
        paymentMethod: "paystack",
        zones,
      }),
    );

    let cancelled = false;
    void estimateFare({
      pickupLat: pickupPlace.lat,
      pickupLng: pickupPlace.lng,
      dropoffLat: dropoffPlace.lat,
      dropoffLng: dropoffPlace.lng,
    })
      .then((estimate) => {
        if (cancelled) return;
        setQuotedSecondFree(Boolean(estimate.secondOrderFree));
        setQuotedListFee(
          estimate.secondOrderFree
            ? (estimate.listFeeNgn ?? estimate.feeNgn)
            : estimate.feeNgn,
        );
        setQuotedOnlineFee(estimate.onlineFeeNgn ?? estimate.feeNgn);
        setQuotedOnlineDiscount(
          estimate.onlineDiscountNgn ?? ONLINE_PAYMENT_DISCOUNT_NGN,
        );
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (
          err instanceof ApiError &&
          (err.code === "DISTANCE_EXCEEDS_MAX" ||
            err.code === "OUTSIDE_SERVICE_AREA" ||
            err.code === "CROSS_ZONE" ||
            err.code === "SAME_LOCATION")
        ) {
          setDistanceError(err.message);
          setQuotedListFee(0);
          setQuotedOnlineFee(0);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pickupPlace, dropoffPlace, zones, maxDeliveryKm, authenticated]);

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
      void autocompletePlaces(
        typed,
        sessionRef.current,
        searchTarget === "dropoff" && pickupPlace
          ? { lat: pickupPlace.lat, lng: pickupPlace.lng }
          : undefined,
      )
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
  }, [typed, step, searchTarget, pickupPlace]);

  const sending = customerRole === "sender";

  const atActiveLimit = activeCount >= maxActiveOrders;

  function startBooking() {
    if (cancelLimited) {
      setError(
        orderHoldReason ??
          "You've cancelled too many orders recently. You can book again later.",
      );
      return;
    }
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

  function applyPickedPlace(target: SearchTarget, place: Place) {
    const other = target === "pickup" ? dropoffPlace : pickupPlace;
    if (other && samePlace(place, other)) {
      setSearchError(SAME_PLACE_MESSAGE);
      return;
    }
    if (other) {
      const rangeError = deliveryRangeError(
        target === "dropoff" ? other.lat : place.lat,
        target === "dropoff" ? other.lng : place.lng,
        target === "dropoff" ? place.lat : other.lat,
        target === "dropoff" ? place.lng : other.lng,
        zones,
        maxDeliveryKm,
      );
      if (rangeError) {
        setSearchError(rangeError);
        return;
      }
    }
    if (target === "pickup") setPickupPlace(place);
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
      if (!isInLagos(gps.lat, gps.lng)) {
        setSearchError("KoboRide only picks up and drops off in Lagos.");
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
      applyPickedPlace(searchTarget, selected);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Could not use current location");
    } finally {
      setLocating(false);
    }
  }

  async function pickGoogle(hit: GooglePlaceSuggestion) {
    if (
      searchTarget === "dropoff" &&
      pickupPlace &&
      typeof hit.distanceKm === "number" &&
      hit.distanceKm > maxDeliveryKm
    ) {
      setSearchError(
        `This delivery is ${formatKm(hit.distanceKm)}, which is beyond KoboRide's current bicycle delivery range (${formatKm(maxDeliveryKm)}).`,
      );
      return;
    }
    setResolvingId(hit.id);
    setSearchError("");
    try {
      const place = await placeDetails(hit.id, sessionRef.current);
      if (!isInLagos(place.lat, place.lng)) {
        setSearchError("KoboRide only picks up and drops off in Lagos.");
        return;
      }
      sessionRef.current = newSession();
      const selected: Place = {
        name: place.name,
        area: place.area,
        lat: place.lat,
        lng: place.lng,
      };
      applyPickedPlace(searchTarget, selected);
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
    setPackageKind(null);
    setCustomNotes("");
    setCustomerRole("sender");
    setContactName("");
    setContactPhone("");
    setPaymentMethod("paystack");
    setPaying(false);
    setError("");
    setDistanceError("");
    setQuotedListFee(0);
    setQuotedOnlineFee(0);
    setQuotedOnlineDiscount(ONLINE_PAYMENT_DISCOUNT_NGN);
    setQuotedSecondFree(false);
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
    const otherPhone = normalizeNgPhone(contactPhone);
    if (!otherPhone) {
      setError(NG_PHONE_ERROR);
      setStep("who");
      setSnap(TALL);
      return;
    }
    const notes = packageNotes(packageKind, customNotes);
    if (!notes) {
      setError("Tell us what we’re moving");
      setStep("who");
      setSnap(TALL);
      return;
    }
    const payload = {
      pickup: pickupPlace.name,
      dropoff: dropoffPlace.name,
      notes,
      customerRole,
      farePayer: "sender" as const,
      senderName: sending ? meName : contactName.trim(),
      senderPhone: sending ? mePhone : otherPhone,
      receiverName: sending ? contactName.trim() : meName,
      receiverPhone: sending ? otherPhone : mePhone,
      pickupLat: pickupPlace.lat,
      pickupLng: pickupPlace.lng,
      dropoffLat: dropoffPlace.lat,
      dropoffLng: dropoffPlace.lng,
    };
    try {
      if (payingOnline && !secondOrderFree) {
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
      if (err instanceof ApiError && err.code === "CANCEL_LIMIT_REACHED") {
        setError(err.message);
        setStep("peek");
        setSnap(PEEK);
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
      className="bottom-0 z-40"
    >
      <div className="flex min-h-0 flex-1 flex-col px-5 pt-1 pb-[calc(var(--kb-nav)+0.35rem)]">
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
            {noCompletedOrder ? (
              <button
                type="button"
                onClick={startBooking}
                onTouchEnd={(event) => {
                  event.preventDefault();
                  startBooking();
                }}
                className="relative z-50 mt-3 w-full rounded-[22px] bg-accent px-4 py-3.5 text-left text-[#1A1A16] shadow-[0_8px_20px_rgba(245,166,35,0.28)] active:brightness-95"
              >
                <span className="inline-flex items-center gap-1 rounded-full bg-[#1A1A16] px-2 py-0.5 text-[10px] font-bold tracking-[0.07em] text-accent uppercase">
                  <Star className="h-3 w-3" strokeWidth={2.6} fill="currentColor" />
                  Offer
                </span>
                <p className="mt-1.5 font-display text-[18px] leading-tight font-semibold tracking-[-0.03em]">
                  2nd order free
                </p>
                <p className="mt-0.5 text-[13px] leading-snug text-[#1A1A16]/70">
                  Send one package. The next delivery is on us.
                </p>
              </button>
            ) : null}
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
                  (atActiveLimit || cancelLimited) && "opacity-60",
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
                  Get me something
                </span>
                <span className="mt-0.5 text-[12px] text-[#8A8780]">
                  Groceries, meds, anything
                </span>
              </div>
            </div>
            {cancelLimited ? (
              <p className="mt-3 text-[13px] font-medium text-[#8A8780]">
                {orderHoldReason ??
                  "You've cancelled too many orders recently. You can book again later."}
              </p>
            ) : atActiveLimit ? (
              <p className="mt-3 text-[13px] font-medium text-[#8A8780]">
                You already have {maxActiveOrders} live orders. Finish or cancel
                one to book again.
              </p>
            ) : error ? (
              <p className="mt-3 text-[13px] font-medium text-danger">{error}</p>
            ) : secondOrderFree ? (
              <p className="mt-3 text-[13px] text-[#8A8780]">
                Your next order is free after that first delivery.
              </p>
            ) : null}
          </div>
        ) : null}

        {BOOKING_STEPS.includes(step) ? (
          <button
            type="button"
            className="mb-3 inline-flex items-center gap-1 text-[13px] font-medium text-[#8A8780]"
            onClick={() => {
              if (step === "fare") {
                setStep("who");
                setSnap(TALL);
              } else if (step === "who") setStep("locations");
              else reset();
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
            {distanceError ? (
              <p className="mt-3 text-[13px] font-medium text-danger">{distanceError}</p>
            ) : null}
            <Button
              className="mt-5 w-full"
              disabled={
                !pickup.trim() ||
                !dropoff.trim() ||
                Boolean(distanceError)
              }
              onClick={() => {
                if (distanceError) return;
                setStep("who");
                setSnap(TALL);
              }}
            >
              Continue
            </Button>
          </div>
        ) : null}

        {step === "search" ? (
          <div key={searchTarget} className="flex min-h-0 flex-1 flex-col">
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
                ? recentPlaces.map((place) => (
                    <li key={`${place.lat},${place.lng}`}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 py-3 text-left"
                        onClick={() => applyPickedPlace(searchTarget, place)}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEEDE8] text-brand">
                          <History className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-semibold">
                            {place.name}
                          </span>
                          <span className="block truncate text-[13px] text-[#8A8780]">
                            {place.area}
                          </span>
                        </span>
                        {searchTarget === "dropoff" && pickupPlace ? (
                          <span className="num shrink-0 text-[13px] text-[#8A8780]">
                            {formatKm(
                              distanceKmBetween(
                                pickupPlace.lat,
                                pickupPlace.lng,
                                place.lat,
                                place.lng,
                              ),
                            )}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  ))
                : null}
              {!showQuick && searching ? (
                <li className="py-3 text-[13px] text-[#8A8780]">Searching…</li>
              ) : null}
              {!showQuick && !searching && inRangeHits.length === 0 && !searchError ? (
                <li className="py-3 text-[13px] text-[#8A8780]">
                  {googleHits.length > 0
                    ? "Those places are outside delivery range."
                    : "No places found. Try a nearby street or landmark."}
                </li>
              ) : null}
              {!showQuick
                ? inRangeHits.map((place) => (
                  <li key={place.id}>
                    <button
                      type="button"
                      disabled={resolvingId !== null}
                      className="flex w-full items-center gap-3 py-3 text-left disabled:opacity-50"
                      onClick={() => void pickGoogle(place)}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEEDE8] text-brand">
                        <MapPin className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-semibold">
                          {place.name}
                        </span>
                        {resolvingId === place.id ? (
                          <span className="block text-[13px] text-[#8A8780]">Loading…</span>
                        ) : place.area ? (
                          <span className="block truncate text-[13px] text-[#8A8780]">
                            {place.area}
                          </span>
                        ) : null}
                      </span>
                      {searchTarget === "dropoff" &&
                      typeof place.distanceKm === "number" ? (
                        <span className="num shrink-0 text-[13px] text-[#8A8780]">
                          {formatKm(place.distanceKm)}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))
                : null}
            </ul>
          </div>
        ) : null}

        {step === "who" ? (
          <div>
            <h2 className="font-display text-[20px] font-semibold tracking-[-0.03em]">
              Sending or receiving?
            </h2>
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

            <p className="mt-4 text-[13px] font-medium text-[#8A8780]">
              {sending ? "Receiver at drop-off" : "Sender at pickup"}
            </p>
            <input
              className="mt-2 h-12 w-full rounded-2xl bg-[#EEEDE8] px-4 text-[15px] outline-none placeholder:text-[#8A8780]"
              placeholder="Name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              autoComplete="name"
            />
            <div className="mt-2">
              <NigeriaPhoneField
                tone="muted"
                value={contactPhone}
                onChange={setContactPhone}
              />
            </div>

            <p className="mt-4 text-[13px] font-medium text-[#8A8780]">What’s moving</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PACKAGE_PRESETS.map((label) => {
                const selected = packageKind === label;
                return (
                  <button
                    key={label}
                    type="button"
                    className={cn(
                      "rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors",
                      selected
                        ? "bg-brand text-[#FAFAF7]"
                        : "bg-[#EEEDE8] text-[#1A1A16]",
                    )}
                    onClick={() => {
                      setPackageKind(label);
                      setError("");
                    }}
                  >
                    {label}
                  </button>
                );
              })}
              <button
                type="button"
                className={cn(
                  "rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors",
                  packageKind === PACKAGE_OTHER
                    ? "bg-brand text-[#FAFAF7]"
                    : "bg-[#EEEDE8] text-[#1A1A16]",
                )}
                onClick={() => {
                  setPackageKind(PACKAGE_OTHER);
                  setError("");
                }}
              >
                Something else
              </button>
            </div>
            {packageKind === PACKAGE_OTHER ? (
              <textarea
                className="mt-3 min-h-22 w-full resize-none rounded-2xl bg-[#EEEDE8] px-4 py-3 text-[15px] outline-none placeholder:text-[#8A8780]"
                placeholder="Describe what we’re moving…"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
              />
            ) : null}

            {error ? (
              <p className="mt-3 text-[13px] font-medium text-danger">{error}</p>
            ) : null}
            <Button
              className="mt-5 w-full"
              onClick={() => {
                if (contactName.trim().length < 2) {
                  setError(
                    sending ? "Add the receiver’s name" : "Add the sender’s name",
                  );
                  return;
                }
                if (!normalizeNgPhone(contactPhone)) {
                  setError(NG_PHONE_ERROR);
                  return;
                }
                if (!packageNotes(packageKind, customNotes)) {
                  setError(
                    packageKind === PACKAGE_OTHER
                      ? "Describe what we’re moving"
                      : "Pick what we’re moving",
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
            {secondOrderFree ? (
              <p className="mt-2 text-[13px]">
                <span className="font-semibold text-brand">2nd order free</span>
                {listFee > 0 ? (
                  <span className="text-[#8A8780]">
                    {" · usual "}
                    <span className="num line-through">{formatNaira(listFee)}</span>
                  </span>
                ) : null}
              </p>
            ) : onlineDiscount > 0 ? (
              <p className="mt-2 text-[13px] text-[#8A8780]">
                Save {formatNaira(onlineDiscount)} online · cash{" "}
                <span className="num line-through">{formatNaira(listFee)}</span>
              </p>
            ) : null}
            {secondOrderFree ? null : paystackEnabled && iPay ? (
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
                    Save {formatNaira(quotedOnlineDiscount || ONLINE_PAYMENT_DISCOUNT_NGN)}
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
                  <p className="font-display text-[15px] font-semibold">I&apos;ll pay cash</p>
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
              <p className="mt-2 text-[13px] text-[#8A8780]">
                {iPay ? "Pay cash to the rider" : "Sender pays cash at pickup"}
              </p>
            )}
            {paystackEnabled && payingOnline ? (
              <p className="mt-3 text-[13px] text-[#8A8780]">
                If you cancel, your payment is refunded automatically to your account.
              </p>
            ) : null}
            {error ? (
              <p className="mt-3 text-[13px] font-medium text-danger">{error}</p>
            ) : null}
            <Button
              className="mt-6 w-full"
              disabled={createTrip.isPending || paying}
              onClick={() => void findRider()}
            >
              {paying
                ? "Paying…"
                : createTrip.isPending
                  ? "Starting…"
                  : payingOnline
                    ? `Pay ${formatNaira(fee)}`
                    : "Find a rider"}
            </Button>
            <button
              type="button"
              className="mt-3 w-full text-center text-[14px] font-medium text-[#8A8780]"
              onClick={reset}
            >
              Cancel
            </button>
          </div>
        ) : null}
      </div>
    </AppSheet>
  );
}
