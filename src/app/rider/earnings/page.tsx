"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { commissionNgn, formatDateTime, formatNaira } from "@/lib/format";
import { useRiderEarnings, useRiderMe } from "@/lib/query/hooks";

export default function RiderEarningsPage() {
  const { data: me, isPending: mePending } = useRiderMe();
  const approved = Boolean(me?.approved);
  const { data: trips = [], isPending } = useRiderEarnings(approved);
  const payout = trips.reduce((sum, trip) => sum + trip.payoutNgn, 0);
  const collected = trips.reduce((sum, trip) => sum + trip.feeNgn, 0);
  const commission = commissionNgn(collected, payout);

  if (mePending) {
    return <div className="h-full animate-pulse bg-[#FAFAF7]" />;
  }

  if (!approved) {
    return (
      <EmptyState
        title="Not an approved rider"
        description="Ops adds riders from the dashboard. There is no self-signup."
      />
    );
  }

  return (
    <div className="bg-[#FAFAF7] px-5 pt-6 pb-8">
      <h1 className="font-display text-[22px] font-semibold tracking-[-0.03em]">
        Jobs
      </h1>
      <p className="mt-1 text-[13px] text-[#8A8780]">Completed drop-offs</p>

      {isPending ? (
        <div className="mt-4 space-y-3">
          <div className="h-16 animate-pulse rounded-2xl bg-[#EEEDE8]" />
        </div>
      ) : trips.length === 0 ? (
        <EmptyState
          title="No jobs yet"
          description="Completed drop-offs will show up here."
        />
      ) : (
        <>
          <div className="mt-4 rounded-2xl bg-[#EEEDE8] px-4 py-4">
            <p className="text-[11px] font-medium tracking-[0.06em] text-[#8A8780] uppercase">
              You earned
            </p>
            <p className="num mt-1 text-[28px] font-semibold tracking-[-0.03em]">
              {formatNaira(payout)}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-[13px]">
              <p className="text-[#8A8780]">
                Collected{" "}
                <span className="num font-semibold text-[#1A1A16]">{formatNaira(collected)}</span>
              </p>
              <p className="text-[#8A8780]">
                Commission{" "}
                <span className="num font-semibold text-[#1A1A16]">{formatNaira(commission)}</span>
              </p>
            </div>
          </div>
          <ul className="mt-3 divide-y divide-black/5">
            {trips.map((trip) => (
              <li key={trip.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display truncate text-[15px] font-semibold">
                      {trip.dropoff}
                    </p>
                    <p className="text-[12px] text-[#8A8780]">{formatDateTime(trip.createdAt)}</p>
                  </div>
                  <p className="num shrink-0 text-[15px] font-semibold">
                    {formatNaira(trip.payoutNgn)}
                  </p>
                </div>
                <p className="mt-1 text-[12px] text-[#8A8780]">
                  Collected {formatNaira(trip.feeNgn)} · commission{" "}
                  {formatNaira(commissionNgn(trip.feeNgn, trip.payoutNgn))}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
