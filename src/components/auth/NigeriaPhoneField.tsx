"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { sanitizeNgLocalInput } from "@/lib/phone";

const fieldClass =
  "h-12 rounded-2xl bg-[#EEEDE8] text-[15px] text-[#1A1A16] outline-none";

export function NigeriaPhoneField({
  value,
  onChange,
  disabled,
  id,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <div className="relative shrink-0">
        <select
          aria-label="Country code"
          value="+234"
          disabled
          className={cn(
            fieldClass,
            "appearance-none py-0 pr-8 pl-3.5 font-medium text-[#1A1A16] disabled:cursor-not-allowed disabled:opacity-100",
          )}
        >
          <option value="+234">NG +234</option>
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-[#8A8780]"
          aria-hidden
        />
      </div>
      <input
        id={id}
        className={cn(fieldClass, "min-w-0 flex-1 px-3.5 placeholder:text-[#8A8780]")}
        placeholder="801 234 5678"
        inputMode="numeric"
        autoComplete="tel-national"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(sanitizeNgLocalInput(e.target.value))}
        required
        disabled={disabled}
        aria-label="Phone number"
      />
    </div>
  );
}
