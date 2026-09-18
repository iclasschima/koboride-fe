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
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Trip } from "@/types/request";

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

      <div className="absolute inset-x-0 bottom-[var(--kb-nav)] z-20 max-h-[46%] overflow-y-auto rounded-t-[28px] bg-[#FAFAF7] px-4 pt-3 pb-4 shadow-[0_-8px_32px_rgba(15,61,46,0.12)]">
        {job ? (
          <button
            type="button"
            className="w-full rounded-2xl bg-brand px-4 py-3.5 text-left text-[#FAFAF7]"
            onClick={() => router.push(`/rider/job/${job.id}`)}
          >
            <p className="text-[12px] font-medium text-white/70">Your assigned order</p>
            <p className="font-display text-[16px] font-semibold">
              Continue to {job.dropoff}
            </p>
            <p className="mt-1 text-[13px] text-white/80">{job.pickup}</p>
          </button>
        ) : null}

        <h2
          className={cn(
            "font-display text-[16px] font-semibold tracking-[-0.02em]",
            job ? "mt-4" : "mt-1",
          )}
        >
          Jobs waiting
        </h2>
        {awaiting.length === 0 ? (
          <p className="mt-2 text-[14px] text-[#8A8780]">
            {online
              ? "No orders waiting. New requests show up here."
              : "Go online when you’re ready. New requests land here."}
          </p>
        ) : (
          <>
            {acceptError ? (
              <p className="mt-2 text-[13px] font-medium text-danger">{acceptError}</p>
            ) : job ? (
              <p className="mt-2 text-[13px] text-[#8A8780]">
                Finish your current job before accepting another.
              </p>
            ) : null}
            <ul className="mt-2 space-y-2">
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
  return (
    <li className="rounded-2xl bg-[#EEEDE8] px-4 py-3">
      <p className="truncate text-[14px] font-medium text-[#1A1A16]">{trip.pickup}</p>
      <p className="truncate text-[13px] text-[#8A8780]">→ {trip.dropoff}</p>
      <div className="mt-2 flex justify-end">
        <Button
          type="button"
          size="md"
          className="h-10 px-4"
          disabled={busy}
          onClick={onAccept}
        >
          {pending ? "Accepting…" : "Accept"}
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
