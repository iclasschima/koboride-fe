"use client";

import { cn } from "@/lib/cn";

export function ActiveToggle({
  active,
  pending,
  onToggle,
}: {
  active: boolean;
  pending?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      disabled={pending}
      className={cn(
        "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        active ? "bg-[#DCEEE4] text-success" : "bg-[#F8D4D4] text-danger",
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
    >
      {active ? "Active" : "Inactive"}
    </button>
  );
}
