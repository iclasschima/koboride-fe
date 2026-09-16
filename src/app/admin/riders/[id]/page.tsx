"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ActiveToggle } from "@/components/admin/ActiveToggle";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { RiderVerificationForm } from "@/components/admin/RiderVerificationForm";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { formatDate, formatDuration, formatKm, formatNaira } from "@/lib/format";
import {
  useAdminRider,
  useEditRiderMutation,
  useRemoveRiderMutation,
  useSetRiderApprovedMutation,
} from "@/lib/query/hooks";

export default function AdminRiderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isPending, isError } = useAdminRider(params.id);
  const editRider = useEditRiderMutation();
  const setApproved = useSetRiderApprovedMutation();
  const removeRider = useRemoveRiderMutation();
  const [error, setError] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);

  if (isPending) {
    return <div className="h-64 animate-pulse rounded-xl bg-[#EEEDE8]" />;
  }

  if (isError || !data) {
    return (
      <div>
        <p className="font-display text-[20px] font-semibold">Rider not found</p>
        <Link href="/admin/riders" className="mt-3 inline-block text-brand">
          Back to riders
        </Link>
      </div>
    );
  }

  const { rider, trips } = data;

  return (
    <div>
      <Link
        href="/admin/riders"
        className="inline-flex items-center gap-1 text-[13px] font-medium text-[#8A8780]"
      >
        <ChevronLeft className="h-4 w-4" />
        Riders
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar
            src={rider.photoUrl}
            name={rider.name}
            className="h-14 w-14 shrink-0 text-[18px]"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-[22px] font-semibold tracking-[-0.03em] md:text-[26px]">
                {rider.name}
              </h1>
              {rider.online ? (
                <span className="inline-flex rounded-full bg-[#DCEEE4] px-2 py-0.5 text-[11px] font-semibold text-success">
                  Online
                </span>
              ) : null}
            </div>
            <a href={`tel:${rider.phone}`} className="mt-1 inline-block text-[14px] text-brand">
              {rider.phone}
            </a>
            <p className="mt-1 text-[13px] text-[#8A8780]">
              Added {formatDate(rider.createdAt)}
              {rider.lastJobAt ? ` · last job ${formatDate(rider.lastJobAt)}` : ""}
            </p>
          </div>
        </div>
        <ActiveToggle
          active={rider.active ?? rider.approved}
          pending={setApproved.isPending}
          onToggle={() => {
            setError("");
            void setApproved
              .mutateAsync({
                riderId: rider.id,
                approved: !(rider.active ?? rider.approved),
              })
              .catch((err) =>
                setError(err instanceof Error ? err.message : "Could not update rider"),
              );
          }}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        <Stat label="Jobs" value={String(rider.jobsCount)} />
        <Stat
          label="Completed"
          value={String(rider.completedCount)}
          hint={`${formatKm(rider.distanceKm)} · ${rider.avgDurationSeconds != null
              ? formatDuration(rider.avgDurationSeconds)
              : "—"
            } avg`}
        />
        <Stat label="Earned" value={formatNaira(rider.earnedNgn)} />
        <Stat
          label="Dropped jobs"
          value={String(rider.droppedCount ?? 0)}
          hint={
            rider.droppedCount
              ? `${rider.droppedRecentCount ?? 0} this week${rider.lastDropReason ? ` · last: ${rider.lastDropReason}` : ""}`
              : undefined
          }
        />
      </div>

      {rider.docsComplete === false ? (
        <p className="mt-4 rounded-xl border border-black/6 bg-white px-4 py-3 text-[13px] font-medium text-[#8A4B1F]">
          Verification docs are incomplete. Add a photo, government ID, and next
          of kin below.
        </p>
      ) : null}

      <section className="mt-8 rounded-xl border border-black/6 bg-white p-4">
        <h2 className="font-display text-[16px] font-semibold">Verification</h2>
        <div className="mt-4">
          <RiderVerificationForm
            rider={rider}
            pending={editRider.isPending}
            submitLabel="Save changes"
            onSubmit={async (input) => {
              setError("");
              await editRider.mutateAsync({ riderId: rider.id, ...input });
            }}
          />
        </div>
        {error ? <p className="mt-3 text-[13px] font-medium text-danger">{error}</p> : null}
      </section>

      <section className="mt-8 overflow-hidden rounded-xl border border-black/6 bg-white">
        <div className="border-b border-black/6 px-4 py-3">
          <h2 className="font-display text-[16px] font-semibold">Trip history</h2>
        </div>
        <OrdersTable
          trips={trips}
          emptyTitle="No trips yet"
          empty="When this rider takes a job, it will show here with payout."
        />
      </section>

      <section className="mt-8 rounded-xl border border-danger/20 bg-white p-5">
        <h2 className="text-[11px] font-semibold tracking-[0.07em] text-danger uppercase">
          Remove rider
        </h2>
        <p className="mt-3 text-[14px] text-[#8A8780]">
          Permanently delete this rider. Deactivate them instead if they might
          come back. Live jobs must be reassigned or finished first.
        </p>
        {confirmRemove ? (
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              className="flex-1"
              size="md"
              variant="secondary"
              disabled={removeRider.isPending}
              onClick={() => setConfirmRemove(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1"
              size="md"
              variant="danger"
              disabled={removeRider.isPending}
              onClick={() => {
                setError("");
                void removeRider
                  .mutateAsync(rider.id)
                  .then(() => router.push("/admin/riders"))
                  .catch((err) =>
                    setError(
                      err instanceof Error ? err.message : "Could not remove rider",
                    ),
                  );
              }}
            >
              {removeRider.isPending ? "Removing…" : "Confirm remove"}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            className="mt-3"
            size="md"
            variant="danger"
            onClick={() => {
              setError("");
              setConfirmRemove(true);
            }}
          >
            Remove rider
          </Button>
        )}
        {error ? <p className="mt-3 text-[13px] font-medium text-danger">{error}</p> : null}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-black/6 bg-white px-4 py-3">
      <p className="text-[11px] font-semibold tracking-[0.07em] text-[#8A8780] uppercase">
        {label}
      </p>
      <p className="num mt-1 text-[20px] font-semibold tracking-[-0.03em] sm:text-[22px]">
        {value}
      </p>
      {hint ? <p className="mt-1 text-[12px] text-[#8A8780]">{hint}</p> : null}
    </div>
  );
}
