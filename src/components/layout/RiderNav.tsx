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
      className="relative z-20 w-full shrink-0 border-t border-black/5 bg-[#FAFAF7] px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1"
      aria-label="Rider"
    >
      <ul className="grid grid-cols-3">
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
                  "flex flex-col items-center gap-0.5 px-1 py-1.5 text-[10px] font-semibold tracking-[-0.01em]",
                  active ? "text-[#1A1A16]" : "text-[#8A8780]",
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
