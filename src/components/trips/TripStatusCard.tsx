import { cn } from "@/lib/cn";
import { formatDateTime, formatNaira } from "@/lib/format";
import { tripHeadline, type Trip } from "@/types/request";

export function TripStatusCard({
  trip,
  className,
}: {
  trip: Trip;
  className?: string;
}) {
  const live = trip.status === "dispatching" || trip.status === "in_progress";

  return (
    <article
      className={cn(
        "flex items-start gap-3 rounded-2xl bg-[#EEEDE8] px-3.5 py-3.5",
        className,
      )}
    >
      <span
        className={cn(
          "font-display mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
          live ? "bg-brand text-[#FAFAF7]" : "bg-[#FAFAF7] text-[#1A1A16]",
        )}
      >
        PD
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="font-display truncate text-[15px] font-bold tracking-[-0.02em] text-[#1A1A16]">
            {trip.dropoff}
          </p>
          <p className="num shrink-0 text-[15px] font-bold text-accent">
            {formatNaira(trip.feeNgn)}
          </p>
        </div>
        <p className="mt-0.5 text-[13px] text-[#8A8780]">
          <span className="font-display font-medium">{tripHeadline(trip)}</span>
          {" · "}
          {formatDateTime(trip.createdAt)}
        </p>
      </div>
    </article>
  );
}
