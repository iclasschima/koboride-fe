"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { getAdminToken } from "@/lib/api/client";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const token = Boolean(getAdminToken());
    setAuthed(token);
    setReady(true);
    if (!token && !isLogin) router.replace("/admin/login");
    if (token && isLogin) router.replace("/admin");
  }, [isLogin, pathname, router]);

  if (!ready) {
    return <div className="min-h-dvh bg-[#F4F2EC]" />;
  }

  if (isLogin) {
    return (
      <div data-ptr-root className="min-h-dvh bg-[#F4F2EC]">
        <PullToRefresh className="min-h-dvh">{children}</PullToRefresh>
      </div>
    );
  }

  if (!authed) {
    return <div className="min-h-dvh bg-[#F4F2EC]" />;
  }

  return (
    <div data-ptr-root className="flex h-full min-h-0 flex-col bg-[#F4F2EC] md:flex-row">
      <AdminSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col pb-[calc(3.75rem+env(safe-area-inset-bottom))] md:pb-0">
        <header className="hidden h-14 shrink-0 items-center justify-between border-b border-black/6 bg-white px-6 md:flex">
          <p className="text-[13px] font-medium text-[#8A8780]">
            Yaba · live operations
          </p>
          <p className="text-[12px] text-[#8A8780]">Ops console</p>
        </header>
        <PullToRefresh className="min-h-0 flex-1 px-4 py-4 md:p-6">
          {children}
        </PullToRefresh>
      </div>
    </div>
  );
}
