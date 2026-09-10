"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  autocompletePlaces,
  placeDetails,
  type GooglePlaceSuggestion,
} from "@/lib/api/places";
import { quoteFee } from "@/lib/fare";
import { formatNaira } from "@/lib/format";
import { type Place } from "@/lib/places";
import { useAdminRiders, useCreateAdminOrderMutation } from "@/lib/query/hooks";
import { YABA_FLAT_FEE_NGN } from "@/types/request";

const inputClass =
  "h-10 w-full rounded-lg bg-[#FAFAF7] px-3 text-[14px] ring-1 ring-black/8 outline-none placeholder:text-[#8A8780]";

export default function AdminCreateOrderPage() {
  const router = useRouter();
  const createOrder = useCreateAdminOrderMutation();
  const { data: riders = [] } = useAdminRiders();
  const approved = riders.filter((r) => r.approved);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [pickup, setPickup] = useState<Place | null>(null);
  const [dropoff, setDropoff] = useState<Place | null>(null);
  const [notes, setNotes] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [riderId, setRiderId] = useState("");
  const [error, setError] = useState("");

  const fee = useMemo(() => {
    if (!pickup || !dropoff) return 0;
    return quoteFee({
      pickupLat: pickup.lat,
      pickupLng: pickup.lng,
      dropoffLat: dropoff.lat,
      dropoffLng: dropoff.lng,
    });
  }, [pickup, dropoff]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pickup || !dropoff) {
      setError("Pick a Yaba pickup and drop-off from search.");
      return;
    }
    if (!fee) {
      setError("KoboRide only operates in Yaba.");
      return;
    }
    setError("");
    try {
      const trip = await createOrder.mutateAsync({
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim(),
        pickup: pickup.name,
        dropoff: dropoff.name,
        notes: notes.trim(),
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        dropoffLat: dropoff.lat,
        dropoffLng: dropoff.lng,
        receiverName: receiverName.trim(),
        receiverPhone: receiverPhone.trim(),
        riderId: riderId || undefined,
      });
      router.push(`/admin/orders/${trip.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create order");
    }
  }

  return (
    <div className="max-w-xl">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1 text-[13px] font-medium text-[#8A8780]"
      >
        <ChevronLeft className="h-4 w-4" />
        Orders
      </Link>
      <h1 className="mt-3 font-display text-[22px] font-semibold tracking-[-0.03em] md:text-[26px]">
        Create order
      </h1>
      <p className="mt-1 text-[14px] text-[#8A8780]">
        Book a pickup for a customer. Same {formatNaira(YABA_FLAT_FEE_NGN)} Yaba fare.
      </p>

      <form
        className="mt-6 space-y-5 rounded-xl border border-black/6 bg-white p-4 md:p-5"
        onSubmit={(e) => void onSubmit(e)}
      >
        <fieldset>
          <legend className="text-[11px] font-semibold tracking-[0.07em] text-[#8A8780] uppercase">
            Customer
          </legend>
          <input
            className={`${inputClass} mt-2`}
            placeholder="Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
          <input
            className={`${inputClass} mt-2`}
            placeholder="Phone"
            inputMode="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            required
          />
        </fieldset>

        <fieldset>
          <legend className="text-[11px] font-semibold tracking-[0.07em] text-[#8A8780] uppercase">
            Route
          </legend>
          <div className="mt-2 space-y-3">
            <AddressSearch label="Pickup" value={pickup} onChange={setPickup} />
            <AddressSearch label="Drop-off" value={dropoff} onChange={setDropoff} />
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-[11px] font-semibold tracking-[0.07em] text-[#8A8780] uppercase">
            Package
          </legend>
          <textarea
            className="mt-2 min-h-20 w-full resize-none rounded-lg bg-[#FAFAF7] px-3 py-2 text-[14px] ring-1 ring-black/8 outline-none placeholder:text-[#8A8780]"
            placeholder="What is being moved"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            required
          />
        </fieldset>

        <fieldset>
          <legend className="text-[11px] font-semibold tracking-[0.07em] text-[#8A8780] uppercase">
            Receiver
          </legend>
          <input
            className={`${inputClass} mt-2`}
            placeholder="Name"
            value={receiverName}
            onChange={(e) => setReceiverName(e.target.value)}
            required
          />
          <input
            className={`${inputClass} mt-2`}
            placeholder="Phone"
            inputMode="tel"
            value={receiverPhone}
            onChange={(e) => setReceiverPhone(e.target.value)}
            required
          />
        </fieldset>

        <fieldset>
          <legend className="text-[11px] font-semibold tracking-[0.07em] text-[#8A8780] uppercase">
            Rider
          </legend>
          <select
            className={`${inputClass} mt-2`}
            value={riderId}
            onChange={(e) => setRiderId(e.target.value)}
          >
            <option value="">Assign after creating</option>
            {approved.map((rider) => (
              <option key={rider.id} value={rider.id}>
                {rider.name}
              </option>
            ))}
          </select>
        </fieldset>

        {pickup && dropoff ? (
          <p className="text-[14px]">
            Fare{" "}
            <span className="num font-semibold text-accent">
              {fee ? formatNaira(fee) : "outside Yaba"}
            </span>
          </p>
        ) : null}

        {error ? <p className="text-[13px] font-medium text-danger">{error}</p> : null}

        <Button type="submit" size="md" className="w-full" disabled={createOrder.isPending}>
          {createOrder.isPending ? "Creating…" : "Create order"}
        </Button>
      </form>
    </div>
  );
}

function AddressSearch({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Place | null;
  onChange: (place: Place | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<GooglePlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const session = useRef(crypto.randomUUID());

  useEffect(() => {
    const typed = query.trim();
    if (typed.length < 2 || value?.name === typed) {
      setHits([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = window.setTimeout(() => {
      void autocompletePlaces(typed, session.current)
        .then((places) => {
          if (!cancelled) setHits(places);
        })
        .catch(() => {
          if (!cancelled) setHits([]);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [query, value?.name]);

  async function pick(hit: GooglePlaceSuggestion) {
    try {
      const place = await placeDetails(hit.id, session.current);
      session.current = crypto.randomUUID();
      onChange({ name: place.name, area: place.area, lat: place.lat, lng: place.lng });
      setQuery(place.name);
      setHits([]);
      setOpen(false);
    } catch {
      setHits([]);
    }
  }

  return (
    <div className="relative">
      <p className="mb-1 text-[12px] font-medium text-[#8A8780]">{label}</p>
      <input
        className={inputClass}
        placeholder={`Search ${label.toLowerCase()} in Yaba`}
        value={value && !open ? value.name : query}
        onChange={(e) => {
          onChange(null);
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
          if (value) setQuery(value.name);
        }}
      />
      {open && (searching || hits.length > 0) ? (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-black/8 bg-white py-1 shadow-[0_12px_32px_rgba(15,61,46,0.12)]">
          {searching ? (
            <li className="px-3 py-2 text-[13px] text-[#8A8780]">Searching…</li>
          ) : (
            hits.map((hit) => (
              <li key={hit.id}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-[13px] hover:bg-[#FAFAF7]"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => void pick(hit)}
                >
                  <span className="block font-medium">{hit.name}</span>
                  {hit.area ? (
                    <span className="block text-[12px] text-[#8A8780]">{hit.area}</span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
