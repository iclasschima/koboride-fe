"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bike,
  ClipboardList,
  LayoutDashboard,
  Smartphone,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList, exact: false },
  { href: "/admin/users", label: "Riders", icon: Users, exact: false },
] as const;

function isActive(pathname: string, href: string, exact: boolean) {
  return exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden w-60 shrink-0 flex-col bg-brand text-[#FAFAF7] md:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="font-display text-[20px] font-semibold tracking-[-0.03em]">
            KoboRide
          </p>
          <p className="mt-0.5 text-[12px] font-medium tracking-[0.08em] text-white/55 uppercase">
            Operations
          </p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[14px] font-medium",
                  active
                    ? "bg-white/12 text-white"
                    : "text-white/70 hover:bg-white/8 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-white/10 px-3 py-4">
          <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.08em] text-white/40 uppercase">
            Apps
          </p>
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-white/65 hover:bg-white/8 hover:text-white"
          >
            <Smartphone className="h-4 w-4" />
            Customer
          </Link>
          <Link
            href="/rider"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-white/65 hover:bg-white/8 hover:text-white"
          >
            <Bike className="h-4 w-4" />
            Rider
          </Link>
        </div>
      </aside>

      <div className="border-b border-black/6 bg-brand text-[#FAFAF7] md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="font-display text-[16px] font-semibold">KoboRide Ops</p>
          <div className="flex gap-3 text-[12px]">
            <Link href="/" className="text-white/70">
              Customer
            </Link>
            <Link href="/rider" className="text-white/70">
              Rider
            </Link>
          </div>
        </div>
        <nav className="flex">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex-1 py-2.5 text-center text-[13px] font-semibold",
                  active
                    ? "border-b-2 border-accent text-white"
                    : "text-white/60",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
