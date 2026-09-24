"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bike,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { logoutAdmin } from "@/lib/api/client";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

const GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Operate",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/admin/orders", label: "Orders", icon: ClipboardList },
    ],
  },
  {
    label: "Manage",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/riders", label: "Riders", icon: Bike },
    ],
  },
  {
    label: "Workspace",
    items: [{ href: "/admin/settings", label: "Settings", icon: Settings }],
  },
];

const FLAT_NAV = GROUPS.flatMap((group) => group.items);

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function signOut() {
    logoutAdmin();
    router.replace("/admin/login");
  }

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

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {GROUPS.map((group) => (
            <div key={group.label} className="pt-3 first:pt-0">
              <p className="px-3 pb-1.5 text-[11px] font-medium tracking-[0.08em] text-white/45 uppercase">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
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
              </div>
            </div>
          ))}
        </nav>

        <div className="space-y-1 border-t border-white/10 px-3 py-4">
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-white/65 hover:bg-white/8 hover:text-white"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="sticky top-0 z-30 shrink-0 border-b border-white/10 bg-brand text-[#FAFAF7] md:hidden">
        <div className="flex items-center justify-between px-4 pt-[max(0.65rem,env(safe-area-inset-top))] pb-3">
          <p className="font-display text-[16px] font-semibold">KoboRide Ops</p>
          <button
            type="button"
            className="text-[13px] font-medium text-white/75"
            onClick={signOut}
          >
            Sign out
          </button>
        </div>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-black/8 bg-white pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1 md:hidden"
        aria-label="Ops"
      >
        <ul className="grid grid-cols-5">
          {FLAT_NAV.map((item) => {
            const active = isActive(pathname, item.href, item.exact);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-1 py-1.5 text-[10px] font-semibold",
                    active ? "text-[#1A1A16]" : "text-[#8A8780]",
                  )}
                >
                  <Icon
                    className="h-5 w-5"
                    strokeWidth={active ? 2.4 : 1.75}
                    aria-hidden
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
