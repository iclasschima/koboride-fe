"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { StatusStepper } from "@/components/ui/StatusStepper";
import { Button } from "@/components/ui/Button";
import {
  formatDateTime,
  formatDuration,
  formatKm,
  formatNaira,
  shortId,
  tripDurationSeconds,
} from "@/lib/format";
import {
  useAdminTrip,
  useAdminRiders,
  useAssignOrderMutation,
  useDeleteAdminOrderMutation,
  useMarkPayoutPaidMutation,
  useOverrideStatusMutation,
} from "@/lib/query/hooks";
import {
  tripHeadline,
  type RiderPhase,
  type Trip,
  type TripStatus,
} from "@/types/request";
import type { OpsUser } from "@/types/user";

const OVERRIDE: TripStatus[] = [
  "dispatching",
  "in_progress",
  "completed",
  "cancelled",
];

function dropPhaseLabel(phase: RiderPhase | null): string {
  return phase === "en_route_pickup" ? "on the way to pickup" : "after accepting";
}

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: trip, isPending, isError } = useAdminTrip(params.id);
  const { data: ridersList = [] } = useAdminRiders();
  const assign = useAssignOrderMutation();
  const override = useOverrideStatusMutation();
  const markPaid = useMarkPayoutPaidMutation();
  const removeOrder = useDeleteAdminOrderMutation();
  const [riderId, setRiderId] = useState("");
  const [status, setStatus] = useState<TripStatus>("dispatching");
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const riders = ridersList.filter((u) => u.approved);
  const durationSeconds = trip ? tripDurationSeconds(trip) : null;

  if (isPending) {
    return <div className="h-64 animate-pulse rounded-xl bg-[#EEEDE8]" />;
  }

  if (isError || !trip) {
    return (
      <div>
        <p className="font-display text-[20px] font-semibold">Order not found</p>
        <Link href="/admin/orders" className="mt-3 inline-block text-brand">
          Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1 text-[13px] font-medium text-[#8A8780]"
      >
        <ChevronLeft className="h-4 w-4" />
        Orders
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-[22px] font-semibold tracking-[-0.03em] md:text-[26px]">
              {shortId(trip.id)}
            </h1>
            <StatusBadge status={trip.status} />
          </div>
          <p className="mt-1 text-[14px] text-[#8A8780]">
            {tripHeadline(trip)} · {formatDateTime(trip.createdAt)}
          </p>
        </div>
        <p className="num text-[24px] font-semibold text-accent md:text-[28px]">
          {formatNaira(trip.feeNgn)}
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-black/6 bg-white px-5 py-4">
        <StatusStepper trip={trip} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-black/6 bg-white p-5 lg:col-span-2">
          <h2 className="text-[11px] font-semibold tracking-[0.07em] text-[#8A8780] uppercase">
            Route
          </h2>
          <p className="mt-3 text-[15px] font-semibold">{trip.pickup}</p>
          <p className="mt-1 text-[15px] font-semibold">→ {trip.dropoff}</p>
          <p className="mt-3 text-[14px] text-[#8A8780]">
            Distance covered{" "}
            <span className="num font-semibold text-[#1A1A16]">
              {formatKm(trip.distanceKm ?? 0)}
            </span>
          </p>
          {durationSeconds != null ? (
            <p className="mt-2 text-[14px] text-[#8A8780]">
              Time to complete{" "}
              <span className="num font-semibold text-[#1A1A16]">
                {formatDuration(durationSeconds)}
              </span>
            </p>
          ) : null}
          {trip.notes ? <p className="mt-3 text-[14px]">{trip.notes}</p> : null}
          {trip.status === "cancelled" && trip.cancelReason ? (
            <p className="mt-3 text-[14px] text-[#8A8780]">
              Cancel reason: {trip.cancelReason}
            </p>
          ) : null}
        </section>
        <section className="rounded-xl border border-black/6 bg-white p-5">
          <h2 className="text-[11px] font-semibold tracking-[0.07em] text-[#8A8780] uppercase">
            Money
          </h2>
          <Row label="Fare" value={formatNaira(trip.feeNgn)} />
          <Row label="Rider payout" value={formatNaira(trip.payoutNgn)} />
          <Row label="Payout" value={trip.payoutPaid ? "Paid" : "Pending"} />
          {trip.deliveryPin ? <Row label="Delivery PIN" value={trip.deliveryPin} /> : null}
          {trip.deliveryProof ? (
            <Row
              label="Proof"
              value={trip.deliveryProof === "pin" ? "PIN confirmed" : "PIN skipped"}
            />
          ) : null}
          {trip.deliveryProofNote ? (
            <p className="mt-2 text-[13px] text-[#8A8780]">{trip.deliveryProofNote}</p>
          ) : null}
          {trip.deliveryProofPhotoUrl ? (
            <a
              href={trip.deliveryProofPhotoUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-[13px] font-medium text-brand"
            >
              View proof photo
            </a>
          ) : null}
        </section>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <PersonCard label="Customer" name={trip.customerName} phone={trip.customerPhone} />
        <PersonCard label="Rider" name={trip.riderName} phone={trip.riderPhone} />
        <PersonCard label="Pickup from" name={trip.senderName} phone={trip.senderPhone} />
        <PersonCard label="Deliver to" name={trip.receiverName} phone={trip.receiverPhone} />
      </div>

      {trip.releases && trip.releases.length > 0 ? (
        <section className="mt-4 rounded-xl border border-black/6 bg-white p-5">
          <h2 className="text-[11px] font-semibold tracking-[0.07em] text-[#8A8780] uppercase">
            Dropped by riders ({trip.releases.length})
          </h2>
          <ul className="mt-3 space-y-2">
            {trip.releases.map((row) => (
              <li key={row.id} className="text-[14px]">
                <Link
                  href={`/admin/riders/${row.riderId}`}
                  className="font-semibold text-brand"
                >
                  {row.riderName ?? "Rider"}
                </Link>
                <span className="text-[#8A8780]">
                  {" · "}
                  {row.reason} · {dropPhaseLabel(row.phase)} · {formatDateTime(row.at)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {error ? (
        <p className="mt-4 text-[13px] font-medium text-danger">{error}</p>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {trip.status === "dispatching" ||
        (trip.status === "in_progress" && trip.riderPhase !== "delivered") ? (
          <AssignRiderCard
            trip={trip}
            riders={riders}
            riderId={riderId}
            setRiderId={setRiderId}
            pending={assign.isPending}
            onAssign={() => {
              setError("");
              void assign
                .mutateAsync({ orderId: trip.id, riderId })
                .then(() => setRiderId(""))
                .catch((err) =>
                  setError(err instanceof Error ? err.message : "Assign failed"),
                );
            }}
          />
        ) : null}

        <section className="rounded-xl border border-black/6 bg-white p-5">
          <h2 className="text-[11px] font-semibold tracking-[0.07em] text-[#8A8780] uppercase">
            Override status
          </h2>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TripStatus)}
            className="mt-3 h-10 w-full rounded-lg bg-[#FAFAF7] px-3 text-[14px] ring-1 ring-black/8 outline-none"
          >
            {OVERRIDE.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <Button
            className="mt-3 w-full"
            size="md"
            variant="secondary"
            disabled={override.isPending}
            onClick={() => {
              setError("");
              void override
                .mutateAsync({ orderId: trip.id, status })
                .catch((err) =>
                  setError(err instanceof Error ? err.message : "Override failed"),
                );
            }}
          >
            {override.isPending ? "Saving…" : "Apply"}
          </Button>
        </section>

        {trip.status === "completed" && !trip.payoutPaid ? (
          <section className="rounded-xl border border-black/6 bg-white p-5">
            <h2 className="text-[11px] font-semibold tracking-[0.07em] text-[#8A8780] uppercase">
              Payout
            </h2>
            <p className="mt-3 text-[14px] text-[#8A8780]">
              After the bank transfer, mark {formatNaira(trip.payoutNgn)} paid.
            </p>
            <Button
              className="mt-3 w-full"
              size="md"
              disabled={markPaid.isPending}
              onClick={() => void markPaid.mutateAsync(trip.id)}
            >
              {markPaid.isPending ? "Saving…" : "Mark paid"}
            </Button>
          </section>
        ) : null}

        <section className="rounded-xl border border-danger/20 bg-white p-5">
          <h2 className="text-[11px] font-semibold tracking-[0.07em] text-danger uppercase">
            Delete order
          </h2>
          <p className="mt-3 text-[14px] text-[#8A8780]">
            Permanently remove this order from records. Use this for sample or test
            data.
          </p>
          {confirmDelete ? (
            <div className="mt-3 flex gap-2">
              <Button
                className="flex-1"
                size="md"
                variant="secondary"
                disabled={removeOrder.isPending}
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                size="md"
                variant="danger"
                disabled={removeOrder.isPending}
                onClick={() => {
                  setError("");
                  void removeOrder
                    .mutateAsync(trip.id)
                    .then(() => router.push("/admin/orders"))
                    .catch((err) =>
                      setError(
                        err instanceof Error ? err.message : "Could not delete order",
                      ),
                    );
                }}
              >
                {removeOrder.isPending ? "Deleting…" : "Confirm delete"}
              </Button>
            </div>
          ) : (
            <Button
              className="mt-3 w-full"
              size="md"
              variant="danger"
              onClick={() => {
                setError("");
                setConfirmDelete(true);
              }}
            >
              Delete order
            </Button>
          )}
        </section>
      </div>
    </div>
  );
}

function AssignRiderCard({
  trip,
  riders,
  riderId,
  setRiderId,
  pending,
  onAssign,
}: {
  trip: Trip;
  riders: OpsUser[];
  riderId: string;
  setRiderId: (id: string) => void;
  pending: boolean;
  onAssign: () => void;
}) {
  const assigned = Boolean(trip.riderId);
  const choices = riders.filter((rider) => rider.id !== trip.riderId);
  const label = assigned ? "Reassign rider" : "Assign rider";

  return (
    <section className="rounded-xl border border-black/6 bg-white p-5">
      <h2 className="text-[11px] font-semibold tracking-[0.07em] text-[#8A8780] uppercase">
        {label}
      </h2>
      {assigned ? (
        <p className="mt-2 text-[13px] text-[#8A8780]">
          Currently assigned to {trip.riderName}. Pick another rider to move this job.
        </p>
      ) : (
        <p className="mt-2 text-[13px] text-[#8A8780]">
          Waiting for a rider. Choose who should take this order.
        </p>
      )}
      {choices.length === 0 ? (
        <p className="mt-3 text-[14px] text-[#8A8780]">
          {assigned
            ? "Add another approved rider to reassign."
            : "Add an approved rider first."}
        </p>
      ) : (
        <>
          <select
            value={riderId}
            onChange={(e) => setRiderId(e.target.value)}
            className="mt-3 h-10 w-full rounded-lg bg-[#FAFAF7] px-3 text-[14px] ring-1 ring-black/8 outline-none"
          >
            <option value="">Select rider</option>
            {choices.map((rider) => (
              <option key={rider.id} value={rider.id}>
                {rider.name}
              </option>
            ))}
          </select>
          <Button
            className="mt-3 w-full"
            size="md"
            disabled={!riderId || pending}
            onClick={onAssign}
          >
            {pending ? (assigned ? "Reassigning…" : "Assigning…") : assigned ? "Reassign" : "Assign"}
          </Button>
        </>
      )}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-2 flex justify-between text-[14px]">
      <span className="text-[#8A8780]">{label}</span>
      <span className="num font-medium">{value}</span>
    </div>
  );
}

function PersonCard({
  label,
  name,
  phone,
}: {
  label: string;
  name: string | null;
  phone: string | null;
}) {
  return (
    <section className="rounded-xl border border-black/6 bg-white p-5">
      <h2 className="text-[11px] font-semibold tracking-[0.07em] text-[#8A8780] uppercase">
        {label}
      </h2>
      <p className="mt-3 font-display text-[18px] font-semibold">{name?.trim() || "—"}</p>
      {phone?.trim() ? (
        <a href={`tel:${phone.trim()}`} className="mt-1 inline-block text-[14px] text-brand">
          {phone.trim()}
        </a>
      ) : (
        <p className="mt-1 text-[14px] text-[#8A8780]">—</p>
      )}
    </section>
  );
}
