"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, LocateFixed, MapPin, Package, ShoppingBag, Star } from "lucide-react";
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
import { SEARCH_PLACES, type Place } from "@/lib/places";
import { quoteFee, isInYabaZone } from "@/lib/fare";
import { formatNaira } from "@/lib/format";
import { useCreateTripMutation } from "@/lib/query/hooks";
import { cn } from "@/lib/cn";
import { tripHeadline, type Trip } from "@/types/request";

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
  onRouteChange,
}: {
  activeTrip: Trip | null;
  onRouteChange: (pickup: string | null, dropoff: string | null) => void;
}) {
  const router = useRouter();
  const { authenticated, openAuth } = useAuth();
  const createTrip = useCreateTripMutation();

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
  const [error, setError] = useState("");
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
    if (!pickupPlace || !dropoffPlace) return 0;
    return quoteFee({
      pickupLat: pickupPlace.lat,
      pickupLng: pickupPlace.lng,
      dropoffLat: dropoffPlace.lat,
      dropoffLng: dropoffPlace.lng,
    });
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

  function startBooking() {
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
      if (!isInYabaZone(gps.lat, gps.lng)) {
        setSearchError("You're outside Yaba. Pickup and drop-off must be in Yaba.");
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
      if (!isInYabaZone(place.lat, place.lng)) {
        setSearchError("KoboRide only operates in Yaba");
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
    setError("");
  }

  async function findRider() {
    if (!authenticated) {
      openAuth("login");
      return;
    }
    if (!pickupPlace || !dropoffPlace) return;
    setError("");
    try {
      const trip = await createTrip.mutateAsync({
        pickup: pickupPlace.name,
        dropoff: dropoffPlace.name,
        notes,
        pickupLat: pickupPlace.lat,
        pickupLng: pickupPlace.lng,
        dropoffLat: dropoffPlace.lat,
        dropoffLng: dropoffPlace.lng,
      });
      router.push(`/trips/${trip.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create request");
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
      <div className="flex min-h-0 flex-1 flex-col px-5 pb-5 pt-1">
        {activeTrip && step === "peek" ? (
          <button
            type="button"
            className="mb-3 flex w-full items-center justify-between rounded-2xl bg-brand px-4 py-3 text-left text-[#FAFAF7]"
            onClick={() => router.push(`/trips/${activeTrip.id}`)}
          >
            <div className="min-w-0">
              <p className="font-display text-[11px] font-medium uppercase tracking-[0.08em] text-white/70">
                Live
              </p>
              <p className="truncate font-display text-[16px] font-semibold">
                {tripHeadline(activeTrip)}
              </p>
            </div>
            <span className="kb-pulse shrink-0 text-[12px] font-semibold">Open</span>
          </button>
        ) : null}

        {step === "peek" ? (
          <div>
            <h1 className="font-display text-[22px] leading-tight font-semibold tracking-[-0.03em] text-[#1A1A16]">
              Send something across Yaba
            </h1>
            <p className="mt-1 text-[13px] text-[#8A8780]">
              Yaba only. Pickup & drop-off on a bike. Pay the rider in cash.
            </p>
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
                  Purchase Errand
                </span>
                <span className="mt-0.5 text-[12px] text-[#8A8780]">
                  Buy something
                </span>
              </div>
            </div>
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
            <p className="mt-1 text-[13px] text-[#8A8780]">Pickup and drop-off must both be in Yaba.</p>
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
            <Button
              className="mt-5 w-full"
              disabled={!pickup.trim() || !dropoff.trim()}
              onClick={() => {
                setStep("details");
                setSnap(MID);
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
            <p className="mt-1 shrink-0 text-[13px] text-[#8A8780]">Yaba addresses only.</p>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search addresses in Yaba"
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
                  No places in Yaba. Try a nearby street or landmark.
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
                          <span className="block text-[15px] font-semibold">{place.name}</span>
                          <span className="block text-[13px] text-[#8A8780]">
                            {resolvingId === place.id ? "Loading…" : place.area}
                          </span>
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
            <h2 className="font-display text-[20px] font-semibold tracking-[-0.03em]">
              What are we moving?
            </h2>
            <textarea
              className="mt-4 min-h-24 w-full resize-none rounded-2xl bg-[#EEEDE8] px-4 py-3 text-[15px] outline-none placeholder:text-[#8A8780]"
              placeholder="A small bag, documents, a food pack…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
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
              Yaba flat rate ·{" "}
              <span className="num font-semibold">{formatNaira(fee)}</span>
              {" · pay cash to the rider"}
            </p>
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
              disabled={createTrip.isPending}
              onClick={() => void findRider()}
            >
              {createTrip.isPending ? "Starting…" : "Find a rider"}
            </Button>
          </div>
        ) : null}
      </div>
    </AppSheet>
  );
}
