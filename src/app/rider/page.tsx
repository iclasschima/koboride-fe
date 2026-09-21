"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CityMap } from "@/components/map/CityMap";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { setRiderOnline } from "@/lib/api/requests";
import { activatePush, primePushPermission } from "@/lib/push";
import {
  useAcceptJobMutation,
  useRiderActiveJobs,
  useRiderAvailableJobs,
  useRiderEarnings,
  useRiderMe,
} from "@/lib/query/hooks";
import { formatKm, formatNaira, formatTimeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";
import { isComplimentary, tripPaidOnline, type Trip } from "@/types/request";

export default function RiderHomePage() {
  const router = useRouter();
  const [online, setOnline] = useState(false);
  const { data: me, isPending: mePending } = useRiderMe();
  const approved = Boolean(me?.approved);
  const { data: active = [] } = useRiderActiveJobs(approved);
  const { data: awaiting = [] } = useRiderAvailableJobs(approved);
  const { data: earned = [] } = useRiderEarnings(approved);
  const accept = useAcceptJobMutation();
  const [acceptError, setAcceptError] = useState("");

  useEffect(() => {
    if (me) setOnline(me.online);
  }, [me]);

  const job = active[0];
  const todayTrips = earned.filter((trip) => isSameDay(trip.updatedAt));
  const todayPayout = todayTrips.reduce((sum, trip) => sum + trip.payoutNgn, 0);

  if (mePending) {
    return <div className="h-full animate-pulse bg-[#E4DFD4]" />;
  }

  if (!approved) {
    return (
      <EmptyState
        title="Account inactive"
        description="Ops adds riders from the dashboard. There is no self-signup."
      />
    );
  }

  return (
    <div className="relative h-full overflow-hidden bg-[#E4DFD4]">
      <CityMap
        className="pointer-events-none absolute inset-0"
        mode={job ? "route" : "idle"}
        pickupLabel={job?.pickup}
        dropoffLabel={job?.dropoff}
      />

      <div className="absolute inset-x-0 top-0 z-20 px-4 pt-[max(0.85rem,env(safe-area-inset-top))]">
        <button
          type="button"
          aria-pressed={online}
          onClick={() => {
            const next = !online;
            setOnline(next);
            if (next) {
              primePushPermission();
              void activatePush("rider");
            }
            void setRiderOnline(next).catch(() => setOnline(!next));
          }}
          className={cn(
            "flex h-16 w-full items-center justify-between rounded-[28px] px-5 shadow-[0_10px_32px_rgba(15,61,46,0.18)] transition-colors duration-300",
            online ? "bg-success text-white" : "bg-[#FAFAF7] text-[#1A1A16]",
          )}
        >
          <span className="font-display text-[20px] font-semibold tracking-[-0.03em]">
            {online ? "You’re online" : "You’re offline"}
          </span>
          <span
            className={cn(
              "relative h-9 w-[3.75rem] shrink-0 overflow-hidden rounded-full transition-colors duration-300",
              online ? "bg-white/25" : "bg-[#D9D6CE]",
            )}
          >
            <span
              className={cn(
                "absolute top-1 left-1 h-7 w-7 rounded-full shadow-sm transition-transform duration-300",
                online ? "translate-x-6 bg-accent" : "translate-x-0 bg-[#FAFAF7]",
              )}
            />
          </span>
        </button>

        <div className="mt-3 w-fit min-w-44 rounded-2xl bg-[#FAFAF7]/95 px-4 py-3 shadow-[0_8px_24px_rgba(15,61,46,0.1)]">
          <p className="text-[11px] font-medium tracking-[0.06em] text-[#8A8780] uppercase">
            Today
          </p>
          <p className="num mt-1 text-[22px] font-semibold">
            {formatNaira(todayPayout)}
          </p>
          <p className="mt-1 text-[12px] text-[#8A8780]">
            {todayTrips.length} {todayTrips.length === 1 ? "job" : "jobs"} · your payout
          </p>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 max-h-[calc(46%+var(--kb-nav))] overflow-y-auto rounded-t-[28px] bg-[#FAFAF7] px-4 pt-2.5 pb-[calc(var(--kb-nav)+0.5rem)] shadow-[0_-8px_32px_rgba(15,61,46,0.12)]">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#D9D6CE]" aria-hidden />

        {job ? (
          <button
            type="button"
            className="w-full rounded-2xl bg-brand px-4 py-3.5 text-left text-[#FAFAF7] transition-opacity active:opacity-90"
            onClick={() => router.push(`/rider/job/${job.id}`)}
          >
            <p className="text-[11px] font-medium tracking-[0.06em] text-white/65 uppercase">
              Active job
            </p>
            <p className="mt-0.5 font-display text-[16px] font-semibold tracking-[-0.02em]">
              Continue to {job.dropoff}
            </p>
            <p className="mt-1 truncate text-[13px] text-white/75">{job.pickup}</p>
          </button>
        ) : null}

        <div
          className={cn(
            "flex items-end justify-between gap-3",
            job ? "mt-4" : "mt-0.5",
          )}
        >
          <div>
            <h2 className="font-display text-[18px] font-semibold tracking-[-0.03em]">
              Jobs waiting
            </h2>
            {awaiting.length > 0 ? (
              <p className="mt-0.5 text-[13px] text-[#8A8780]">
                {awaiting.length === 1
                  ? "1 request nearby"
                  : `${awaiting.length} requests nearby`}
              </p>
            ) : null}
          </div>
          {awaiting.length > 0 ? (
            <span className="num mb-0.5 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-brand px-2 text-[13px] font-semibold text-[#FAFAF7]">
              {awaiting.length}
            </span>
          ) : null}
        </div>

        {awaiting.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-[#EEEDE8]/80 px-4 py-5 text-center">
            <p className="font-display text-[15px] font-semibold text-[#1A1A16]">
              {online ? "No jobs yet" : "You’re offline"}
            </p>
            <p className="mt-1 text-[13px] leading-snug text-[#8A8780]">
              {online
                ? "New requests will show up here as they come in."
                : "Go online when you’re ready to take jobs."}
            </p>
          </div>
        ) : (
          <>
            {acceptError ? (
              <p className="mt-3 text-[13px] font-medium text-danger">{acceptError}</p>
            ) : job ? (
              <p className="mt-2 text-[13px] text-[#8A8780]">
                Finish your current job before accepting another.
              </p>
            ) : null}
            <ul className="mt-3 space-y-2.5">
              {awaiting.map((trip) => (
                <AwaitingRow
                  key={trip.id}
                  trip={trip}
                  busy={Boolean(job) || accept.isPending}
                  pending={accept.isPending && accept.variables === trip.id}
                  onAccept={() => {
                    setAcceptError("");
                    void accept
                      .mutateAsync(trip.id)
                      .then((taken) => router.push(`/rider/job/${taken.id}`))
                      .catch((err) =>
                        setAcceptError(
                          err instanceof Error ? err.message : "Could not accept this order",
                        ),
                      );
                  }}
                />
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function AwaitingRow({
  trip,
  busy,
  pending,
  onAccept,
}: {
  trip: Trip;
  busy: boolean;
  pending: boolean;
  onAccept: () => void;
}) {
  const paidOnline = tripPaidOnline(trip);
  const complimentary = isComplimentary(trip);

  return (
    <li className="overflow-hidden rounded-[22px] bg-white ring-1 ring-black/5">
      <div className="flex gap-3 px-3.5 pt-3.5 pb-3">
        <div className="flex w-3 shrink-0 flex-col items-center pt-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-brand" />
          <span className="my-1 w-px flex-1 bg-[#D9D6CE]" />
          <span className="h-2.5 w-2.5 rounded-full bg-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[15px] font-semibold tracking-[-0.02em] text-[#1A1A16]">
            {trip.pickup}
          </p>
          <p className="mt-2 truncate text-[14px] text-[#5C5A54]">{trip.dropoff}</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[#8A8780]">
            <span className="num font-medium text-[#1A1A16]">
              {formatNaira(complimentary ? trip.payoutNgn : trip.feeNgn)}
            </span>
            <span aria-hidden>·</span>
            <span>{formatKm(trip.distanceKm)}</span>
            {complimentary ? (
              <>
                <span aria-hidden>·</span>
                <span className="font-medium text-success">Don't collect</span>
              </>
            ) : paidOnline ? (
              <>
                <span aria-hidden>·</span>
                <span className="font-medium text-success">Paid online</span>
              </>
            ) : null}
            <span aria-hidden>·</span>
            <span>{formatTimeAgo(trip.createdAt)}</span>
          </div>
        </div>
      </div>
      <div className="border-t border-black/4 px-3.5 py-2.5">
        <Button
          type="button"
          size="md"
          className="h-11 w-full"
          disabled={busy}
          onClick={onAccept}
        >
          {pending ? "Accepting…" : "Accept job"}
        </Button>
      </div>
    </li>
  );
}

function isSameDay(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  return date.toDateString() === now.toDateString();
}
