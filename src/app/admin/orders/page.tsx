"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { cn } from "@/lib/cn";
import { useAdminTrips } from "@/lib/query/hooks";
import type { TripStatus } from "@/types/request";

const FILTERS: Array<{ id: "all" | TripStatus; label: string }> = [
  { id: "all", label: "All" },
  { id: "dispatching", label: "Searching" },
  { id: "in_progress", label: "Live" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

export default function AdminOrdersPage() {
  const { data: trips = [], isPending } = useAdminTrips();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return trips.filter((trip) => {
      if (filter !== "all" && trip.status !== filter) return false;
      if (!q) return true;
      const blob = [
        trip.id,
        trip.pickup,
        trip.dropoff,
        trip.customerName,
        trip.customerPhone,
        trip.senderName,
        trip.receiverName,
        trip.receiverPhone,
        trip.riderName,
        trip.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [trips, filter, query]);

  return (
    <div>
      <h1 className="font-display text-[22px] font-semibold tracking-[-0.03em] md:text-[26px]">
        Orders
      </h1>
      <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <p className="text-[14px] text-[#8A8780]">
          Open a row to assign or reassign a rider, override status, or mark a payout paid.
        </p>
        <Link
          href="/admin/orders/new"
          className="inline-flex h-9 items-center rounded-full bg-brand px-4 text-[13px] font-semibold text-[#FAFAF7]"
        >
          Create order
        </Link>
      </div>

      <div className="-mx-4 mt-5 flex items-center gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              "h-8 shrink-0 rounded-full px-3 text-[12px] font-semibold",
              filter === item.id
                ? "bg-brand text-[#FAFAF7]"
                : "bg-white text-[#5C5A54] ring-1 ring-black/8",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search customer, rider, route, order ID"
        className="mt-3 h-10 w-full rounded-lg bg-white px-3 text-[14px] ring-1 ring-black/8 outline-none placeholder:text-[#8A8780] focus:ring-brand/40 md:max-w-sm"
      />

      <section className="mt-5 overflow-hidden rounded-xl border border-black/6 bg-white">
        <div className="border-b border-black/6 px-4 py-3 text-[12px] text-[#8A8780]">
          {isPending ? "Loading…" : `${visible.length} orders`}
        </div>
        {isPending ? (
          <div className="h-56 animate-pulse bg-[#EEEDE8]" />
        ) : (
          <OrdersTable
            trips={visible}
            emptyTitle={trips.length === 0 ? "No orders yet" : "No matching orders"}
            empty={
              trips.length === 0
                ? "Create an order from here or wait for a customer booking."
                : "No orders match these filters."
            }
          />
        )}
      </section>
    </div>
  );
}
