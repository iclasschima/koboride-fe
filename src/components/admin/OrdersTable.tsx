"use client";

import { useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime, formatKm, formatNaira, shortId } from "@/lib/format";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { StatusStepper } from "@/components/ui/StatusStepper";
import { useDeleteAdminOrderMutation } from "@/lib/query/hooks";
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
  const removeOrder = useDeleteAdminOrderMutation();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (trips.length === 0) {
    return <EmptyState title={emptyTitle} description={empty} />;
  }

  function onDelete(orderId: string) {
    setError("");
    void removeOrder
      .mutateAsync(orderId)
      .then(() => setConfirmId(null))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not delete order"),
      );
  }

  return (
    <div>
      {error ? (
        <p className="border-b border-black/6 px-4 py-2 text-[13px] font-medium text-danger">
          {error}
        </p>
      ) : null}

      <ul className="divide-y divide-black/5 md:hidden">
        {trips.map((trip) => (
          <li key={trip.id} className="px-4 py-3">
            <Link href={`/admin/orders/${trip.id}`} className="block">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display text-[15px] font-semibold">
                    {trip.pickup}
                  </p>
                  <p className="truncate text-[13px] text-[#8A8780]">
                    → {trip.dropoff}
                  </p>
                </div>
                <StatusBadge status={trip.status} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-[12px] text-[#8A8780]">
                <p className="min-w-0 truncate">
                  {trip.customerName ?? "No name"} · {shortId(trip.id)}
                </p>
                <p className="num shrink-0 font-semibold text-accent">
                  {formatNaira(trip.feeNgn)}
                </p>
              </div>
              <p className="mt-1 text-[12px] text-[#8A8780]">
                {trip.riderName ?? "Unassigned"} · {formatKm(trip.distanceKm ?? 0)} ·{" "}
                {formatDateTime(trip.createdAt)}
              </p>
            </Link>
            <div className="mt-2 flex justify-end">
              <DeleteOrderAction
                confirming={confirmId === trip.id}
                pending={removeOrder.isPending}
                onAsk={() => {
                  setError("");
                  setConfirmId(trip.id);
                }}
                onCancel={() => setConfirmId(null)}
                onConfirm={() => onDelete(trip.id)}
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1080px] text-left text-[13px]">
          <thead className="border-b border-black/6 bg-[#FAFAF7] text-[11px] font-semibold tracking-[0.05em] text-[#8A8780] uppercase">
            <tr>
              <th className="px-4 py-3 font-semibold">Order</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Route</th>
              <th className="px-4 py-3 font-semibold">Distance</th>
              <th className="px-4 py-3 font-semibold">Rider</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Fare</th>
              <th className="px-4 py-3 font-semibold">Progress</th>
              <th className="px-4 py-3 font-semibold text-right"> </th>
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
                <td className="px-4 py-3 align-top whitespace-nowrap">
                  <p className="num font-medium">{formatKm(trip.distanceKm ?? 0)}</p>
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
                <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                  <DeleteOrderAction
                    confirming={confirmId === trip.id}
                    pending={removeOrder.isPending}
                    onAsk={() => {
                      setError("");
                      setConfirmId(trip.id);
                    }}
                    onCancel={() => setConfirmId(null)}
                    onConfirm={() => onDelete(trip.id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DeleteOrderAction({
  confirming,
  pending,
  onAsk,
  onCancel,
  onConfirm,
}: {
  confirming: boolean;
  pending: boolean;
  onAsk: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (confirming) {
    return (
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          className="text-[12px] font-semibold text-[#8A8780]"
          disabled={pending}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className="text-[12px] font-semibold text-danger"
          disabled={pending}
          onClick={onConfirm}
        >
          {pending ? "Deleting…" : "Confirm"}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="text-[12px] font-semibold text-danger"
      onClick={onAsk}
    >
      Delete
    </button>
  );
}
