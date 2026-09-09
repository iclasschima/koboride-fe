"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock3, House, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/", label: "Home", icon: House },
  { href: "/trips", label: "Orders", icon: Clock3 },
  { href: "/profile", label: "Account", icon: UserRound },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="relative z-20 w-full shrink-0 border-t border-black/5 bg-[#FAFAF7] px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1"
      aria-label="Main"
    >
      <ul className="grid grid-cols-3">
        {TABS.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-1 py-1.5 text-[10px] font-semibold tracking-[-0.01em] transition-colors touch-manipulation",
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
