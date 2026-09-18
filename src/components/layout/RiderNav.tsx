"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bike, ClipboardList, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/rider", label: "Home", icon: Bike },
  { href: "/rider/earnings", label: "Jobs", icon: ClipboardList },
  { href: "/rider/profile", label: "Profile", icon: UserRound },
] as const;

export function RiderNav() {
  const pathname = usePathname();

  return (
    <nav
      className="pointer-events-none absolute inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      aria-label="Rider"
    >
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[var(--kb-nav)] bg-[#FAFAF7]"
        aria-hidden
      />
      <ul className="pointer-events-auto grid grid-cols-3 rounded-[28px] bg-[#FAFAF7]/92 px-1.5 py-1.5 shadow-[0_12px_40px_rgba(15,61,46,0.18)] ring-1 ring-black/6 backdrop-blur-xl">
        {TABS.map((tab) => {
          const active =
            tab.href === "/rider"
              ? pathname === "/rider"
              : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-[22px] px-1 py-2 text-[10px] font-semibold tracking-[-0.01em] transition-colors touch-manipulation",
                  active
                    ? "bg-[#EEEDE8] text-brand"
                    : "text-[#8A8780] active:bg-[#EEEDE8]/70",
                )}
              >
                <Icon
                  className="h-[22px] w-[22px]"
                  strokeWidth={active ? 2.4 : 1.75}
                  aria-hidden
                />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
