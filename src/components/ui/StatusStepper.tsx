import { cn } from "@/lib/cn";
import { TRACK_STEPS, trackStepIndex, type Trip } from "@/types/request";

export function StatusStepper({
  trip,
  compact = false,
}: {
  trip: Trip;
  compact?: boolean;
}) {
  const active = trackStepIndex(trip);

  return (
    <ol className="flex items-center gap-0" aria-label="Order progress">
      {TRACK_STEPS.map((step, index) => {
        const done = index <= active;
        const current = index === active;
        return (
          <li key={step.id} className="flex min-w-0 flex-1 items-center">
            <div className="flex min-w-0 flex-1 flex-col items-center">
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition-[background-color,transform] duration-500",
                  done ? "bg-success" : "bg-[#D9D6CE]",
                  current && "scale-125 bg-accent",
                )}
              />
                  {compact ? null : (
                <span
                  className={cn(
                    "font-display mt-1.5 max-w-full px-0.5 text-center text-[9px] leading-tight font-medium sm:text-[10px]",
                    current ? "text-[#1A1A16]" : "text-[#8A8780]",
                  )}
                >
                  {step.label}
                </span>
              )}
            </div>
            {index < TRACK_STEPS.length - 1 ? (
              <span
                className={cn(
                  "h-px flex-1 transition-colors duration-500",
                  !compact && "mb-4",
                  index < active ? "bg-success" : "bg-[#E6E3DC]",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
