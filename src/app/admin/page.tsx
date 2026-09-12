"use client";

import Link from "next/link";
import { KpiCard } from "@/components/admin/KpiCard";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { EnableNotifications } from "@/components/notify/EnableNotifications";
import { formatNaira } from "@/lib/format";
import { useAdminTrips, useAdminRiders } from "@/lib/query/hooks";

export default function AdminOverviewPage() {
  const { data: trips = [], isPending } = useAdminTrips();
  const { data: riders = [] } = useAdminRiders();
  const live = trips.filter(
    (t) => t.status === "dispatching" || t.status === "in_progress",
  );
  const searching = trips.filter((t) => t.status === "dispatching");
  const cancelled = trips.filter((t) => t.status === "cancelled");
  const completedToday = trips.filter(
    (t) => t.status === "completed" && isToday(t.updatedAt),
  );
  const pendingPayout = trips
    .filter((t) => t.status === "completed" && !t.payoutPaid)
    .reduce((sum, t) => sum + t.payoutNgn, 0);
  const approvedRiders = riders.filter((u) => u.approved);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[22px] font-semibold tracking-[-0.03em] md:text-[26px]">
            Overview
          </h1>
          <p className="mt-1 text-[14px] text-[#8A8780]">
            Assign riders, watch status, mark bank transfers paid.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders/new"
            className="inline-flex h-9 items-center rounded-full bg-brand px-4 text-[13px] font-semibold text-[#FAFAF7]"
          >
            Create order
          </Link>
          <Link
            href="/admin/orders"
            className="text-[13px] font-semibold text-brand hover:underline"
          >
            All orders →
          </Link>
        </div>
      </div>

      <section className="mt-6 rounded-xl border border-black/6 bg-white px-4 py-3">
        <h2 className="font-display text-[16px] font-semibold">Alerts</h2>
        <p className="mt-1 text-[13px] text-[#8A8780]">
          Get a push when a customer signs up, a new order lands, or an order
          status changes.
        </p>
        <EnableNotifications role="admin" />
      </section>

      <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-5">
        <KpiCard
          label="Live orders"
          value={isPending ? "—" : String(live.length)}
          hint={`${searching.length} waiting for a rider`}
        />
        <KpiCard
          label="Completed today"
          value={isPending ? "—" : String(completedToday.length)}
        />
        <KpiCard
          label="Unpaid payouts"
          value={isPending ? "—" : formatNaira(pendingPayout)}
          tone="amber"
        />
        <KpiCard
          label="Cancelled"
          value={isPending ? "—" : String(cancelled.length)}
          hint="Still kept in order records"
        />
        <KpiCard
          label="Approved riders"
          value={isPending ? "—" : String(approvedRiders.length)}
        />
      </div>

      <section className="mt-8 overflow-hidden rounded-xl border border-black/6 bg-white">
        <div className="flex items-center justify-between border-b border-black/6 px-4 py-3">
          <h2 className="font-display text-[16px] font-semibold">Needs attention</h2>
          <p className="text-[12px] text-[#8A8780]">Searching and live</p>
        </div>
        {isPending ? (
          <div className="h-48 animate-pulse bg-[#EEEDE8]" />
        ) : (
          <OrdersTable
            trips={trips.filter(
              (t) => t.status === "dispatching" || t.status === "in_progress",
            )}
            empty="New pickup requests will land here."
          />
        )}
      </section>

      <section className="mt-8 overflow-hidden rounded-xl border border-black/6 bg-white">
        <div className="flex items-center justify-between border-b border-black/6 px-4 py-3">
          <h2 className="font-display text-[16px] font-semibold">Recent records</h2>
          <p className="text-[12px] text-[#8A8780]">Includes cancelled</p>
        </div>
        {isPending ? (
          <div className="h-48 animate-pulse bg-[#EEEDE8]" />
        ) : (
          <OrdersTable
            trips={trips.slice(0, 20)}
            empty="When a customer taps Find a rider, the order is saved here even if they cancel."
          />
        )}
      </section>
    </div>
  );
}

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}
