"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CityMap } from "@/components/map/CityMap";
import { FareNumber } from "@/components/ui/FareNumber";
import { getRiderOnline, setRiderOnline } from "@/lib/api/requests";
import { useRiderActiveJobs, useRiderEarnings } from "@/lib/query/hooks";
import { cn } from "@/lib/cn";

export default function RiderHomePage() {
  const router = useRouter();
  const [online, setOnline] = useState(false);
  const { data: active = [] } = useRiderActiveJobs();
  const { data: earned = [] } = useRiderEarnings();

  useEffect(() => {
    void getRiderOnline().then(setOnline);
  }, []);

  const job = active[0];
  const todayTrips = earned.filter((trip) => isSameDay(trip.updatedAt));
  const todayPayout = todayTrips.reduce((sum, trip) => sum + trip.payoutNgn, 0);

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

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-[#FAFAF7]/95 px-4 py-3 shadow-[0_8px_24px_rgba(15,61,46,0.1)]">
            <p className="text-[11px] font-medium tracking-[0.06em] text-[#8A8780] uppercase">
              Today
            </p>
            <p className="num mt-1 text-[22px] font-semibold">
              {todayTrips.length} {todayTrips.length === 1 ? "job" : "jobs"}
            </p>
          </div>
          <div className="rounded-2xl bg-[#FAFAF7]/95 px-4 py-3 shadow-[0_8px_24px_rgba(15,61,46,0.1)]">
            <p className="text-[11px] font-medium tracking-[0.06em] text-[#8A8780] uppercase">
              Earned
            </p>
            <FareNumber amount={todayPayout} className="mt-1 text-[22px]" />
          </div>
        </div>
      </div>

      {job ? (
        <button
          type="button"
          className="absolute inset-x-4 bottom-[5.5rem] z-20 rounded-2xl bg-brand px-4 py-4 text-left text-[#FAFAF7] shadow-[0_12px_32px_rgba(15,61,46,0.25)]"
          onClick={() => router.push(`/rider/job/${job.id}`)}
        >
          <p className="text-[12px] font-medium text-white/70">Assigned order</p>
          <p className="font-display text-[17px] font-semibold">
            Continue to {job.dropoff}
          </p>
        </button>
      ) : (
        <p className="absolute inset-x-4 bottom-[5.5rem] z-20 rounded-2xl bg-[#FAFAF7]/95 px-4 py-4 text-[14px] text-[#8A8780] shadow-[0_8px_24px_rgba(15,61,46,0.1)]">
          {online
            ? "No assigned job yet. Ops will assign you from admin."
            : "Go online when you’re ready for the next assignment."}
        </p>
      )}
    </div>
  );
}

function isSameDay(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  return date.toDateString() === now.toDateString();
}
