"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime } from "@/lib/format";
import { useRiderEarnings, useRiderMe } from "@/lib/query/hooks";

export default function RiderEarningsPage() {
  const { data: me, isPending: mePending } = useRiderMe();
  const approved = Boolean(me?.approved);
  const { data: trips = [], isPending } = useRiderEarnings(approved);

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
        <ul className="mt-3 divide-y divide-black/5">
          {trips.map((trip) => (
            <li key={trip.id} className="py-3">
              <p className="font-display truncate text-[15px] font-semibold">{trip.dropoff}</p>
              <p className="text-[12px] text-[#8A8780]">{formatDateTime(trip.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
