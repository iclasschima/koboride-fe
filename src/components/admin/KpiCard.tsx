import { cn } from "@/lib/cn";

export function KpiCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "amber" | "danger";
}) {
  return (
    <div className="rounded-xl border border-black/6 bg-white px-4 py-4">
      <p className="text-[11px] font-semibold tracking-[0.07em] text-[#8A8780] uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 num text-[22px] leading-none font-semibold tracking-[-0.03em] sm:text-[28px]",
          tone === "amber" && "text-accent",
          tone === "danger" && "text-danger",
          tone === "default" && "text-[#1A1A16]",
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-2 text-[12px] text-[#8A8780]">{hint}</p>
      ) : null}
    </div>
  );
}
