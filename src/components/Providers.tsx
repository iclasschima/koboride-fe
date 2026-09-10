"use client";

import { AuthProvider } from "@/lib/auth/AuthProvider";
import { RiderAuthProvider } from "@/lib/auth/RiderAuthProvider";
import { QueryProvider } from "@/lib/query/QueryProvider";
import { AuthModal } from "@/components/auth/AuthModal";
import { MobileShell } from "@/components/layout/MobileShell";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <RiderAuthProvider>
          <MobileShell>{children}</MobileShell>
          <AuthModal />
        </RiderAuthProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
