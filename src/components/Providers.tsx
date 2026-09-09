"use client";

import { AuthProvider } from "@/lib/auth/AuthProvider";
import { QueryProvider } from "@/lib/query/QueryProvider";
import { AuthModal } from "@/components/auth/AuthModal";
import { MobileShell } from "@/components/layout/MobileShell";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <MobileShell>{children}</MobileShell>
        <AuthModal />
      </AuthProvider>
    </QueryProvider>
  );
}
