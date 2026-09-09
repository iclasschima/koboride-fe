"use client";

import { useEffect, useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
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
