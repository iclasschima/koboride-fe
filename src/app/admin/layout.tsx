"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
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
    return <div className="min-h-dvh bg-[#F4F2EC]">{children}</div>;
  }

  if (!authed) {
    return <div className="min-h-dvh bg-[#F4F2EC]" />;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#F4F2EC] md:flex-row">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="hidden h-14 items-center justify-between border-b border-black/6 bg-white px-6 md:flex">
          <p className="text-[13px] font-medium text-[#8A8780]">
            Yaba · live operations
          </p>
          <p className="text-[12px] text-[#8A8780]">Ops console</p>
        </header>
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </div>
    </div>
  );
}
