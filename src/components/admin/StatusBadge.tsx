import { cn } from "@/lib/cn";
import { STATUS_LABEL, type TripStatus } from "@/types/request";

const TONE: Record<TripStatus, string> = {
  dispatching: "bg-[#F8E7C4] text-[#8A5A00]",
  in_progress: "bg-[#DCEEE4] text-brand",
  completed: "bg-[#DCEEE4] text-success",
  cancelled: "bg-[#F8D4D4] text-danger",
};

export function StatusBadge({ status }: { status: TripStatus }) {
  return (
    <span
      className={cn(
        "font-display inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-[0.02em] whitespace-nowrap",
        TONE[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
