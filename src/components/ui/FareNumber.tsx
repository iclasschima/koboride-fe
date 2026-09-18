import { cn } from "@/lib/cn";
import { formatNaira } from "@/lib/format";

export function FareNumber({
  amount,
  className,
}: {
  amount: number;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "num text-[40px] leading-none font-bold tracking-[-0.04em] text-[#1A1A16]",
        className,
      )}
    >
      {formatNaira(amount)}
    </p>
  );
}
