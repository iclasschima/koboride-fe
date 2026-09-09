"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime, formatNaira } from "@/lib/format";
import { useRiderEarnings } from "@/lib/query/hooks";
import { FareNumber } from "@/components/ui/FareNumber";

export default function RiderEarningsPage() {
  const { data: trips = [], isPending } = useRiderEarnings();
  const pending = trips.filter((t) => !t.payoutPaid);
  const paid = trips.filter((t) => t.payoutPaid);
  const balance = pending.reduce((sum, t) => sum + t.payoutNgn, 0);

  return (
    <div className="bg-[#FAFAF7] px-5 pt-6 pb-8">
      <p className="text-[13px] font-medium tracking-[0.06em] text-[#8A8780] uppercase">
        Pending payout
      </p>
      <FareNumber amount={balance} className="mt-1" />

      <h1 className="mt-8 font-display text-[22px] font-semibold tracking-[-0.03em]">
        Earnings
      </h1>

      {isPending ? (
        <div className="mt-4 space-y-3">
          <div className="h-16 animate-pulse rounded-2xl bg-[#EEEDE8]" />
        </div>
      ) : trips.length === 0 ? (
        <EmptyState
          title="No earnings yet"
          description="Completed jobs will show up here with paid or pending."
        />
      ) : (
        <ul className="mt-3 divide-y divide-black/5">
          {[...pending, ...paid].map((trip) => (
            <li key={trip.id} className="flex items-center justify-between py-3">
              <div className="min-w-0">
                <p className="font-display truncate text-[15px] font-semibold">{trip.dropoff}</p>
                <p className="text-[12px] text-[#8A8780]">
                  {formatDateTime(trip.createdAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="num text-[16px] font-semibold text-accent">
                  {formatNaira(trip.payoutNgn)}
                </p>
                <p
                  className={`font-display text-[11px] font-medium ${trip.payoutPaid ? "text-success" : "text-[#8A5A00]"
                    }`}
                >
                  {trip.payoutPaid ? "Paid" : "Pending"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
