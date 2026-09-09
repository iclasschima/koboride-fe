"use client";

import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime, formatNaira, shortId } from "@/lib/format";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { StatusStepper } from "@/components/ui/StatusStepper";
import type { Trip } from "@/types/request";

export function OrdersTable({
  trips,
  empty,
  emptyTitle = "No orders yet",
}: {
  trips: Trip[];
  empty: string;
  emptyTitle?: string;
}) {
  if (trips.length === 0) {
    return <EmptyState title={emptyTitle} description={empty} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-[13px]">
        <thead className="border-b border-black/6 bg-[#FAFAF7] text-[11px] font-semibold tracking-[0.05em] text-[#8A8780] uppercase">
          <tr>
            <th className="px-4 py-3 font-semibold">Order</th>
            <th className="px-4 py-3 font-semibold">Customer</th>
            <th className="px-4 py-3 font-semibold">Route</th>
            <th className="px-4 py-3 font-semibold">Rider</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Fare</th>
            <th className="px-4 py-3 font-semibold">Progress</th>
          </tr>
        </thead>
        <tbody>
          {trips.map((trip) => (
            <tr
              key={trip.id}
              className="border-b border-black/5 last:border-0 hover:bg-[#FAFAF7]"
            >
              <td className="px-4 py-3 align-top whitespace-nowrap">
                <Link
                  href={`/admin/orders/${trip.id}`}
                  className="font-display text-[13px] font-semibold text-brand hover:underline"
                >
                  {shortId(trip.id)}
                </Link>
                <p className="mt-0.5 text-[12px] text-[#8A8780]">
                  {formatDateTime(trip.createdAt)}
                </p>
              </td>
              <td className="px-4 py-3 align-top">
                <p className="font-medium">{trip.customerName ?? "—"}</p>
                <p className="text-[12px] text-[#8A8780]">
                  {trip.customerPhone ?? "No phone"}
                </p>
              </td>
              <td className="max-w-[220px] px-4 py-3 align-top">
                <p className="truncate font-medium">{trip.pickup}</p>
                <p className="truncate text-[12px] text-[#8A8780]">→ {trip.dropoff}</p>
              </td>
              <td className="px-4 py-3 align-top">
                <p className="font-medium">{trip.riderName ?? "Unassigned"}</p>
              </td>
              <td className="px-4 py-3 align-top">
                <StatusBadge status={trip.status} />
              </td>
              <td className="px-4 py-3 align-top">
                <p className="num font-semibold text-accent">
                  {formatNaira(trip.feeNgn)}
                </p>
              </td>
              <td className="min-w-40 px-4 py-3 align-top">
                <StatusStepper trip={trip} compact />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
