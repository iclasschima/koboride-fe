"use client";

import { AuthProvider } from "@/lib/auth/AuthProvider";
import { RiderAuthProvider } from "@/lib/auth/RiderAuthProvider";
import { QueryProvider } from "@/lib/query/QueryProvider";
import { AuthModal } from "@/components/auth/AuthModal";
import { MobileShell } from "@/components/layout/MobileShell";
import { AutoActivatePush } from "@/components/notify/AutoActivatePush";
import { OrderNotifications } from "@/components/notify/OrderNotifications";
import { PushBanner } from "@/components/notify/PushBanner";
import { PwaInstallProvider } from "@/components/pwa/PwaInstallProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <RiderAuthProvider>
          <PwaInstallProvider>
            <MobileShell>{children}</MobileShell>
            <AutoActivatePush />
            <PushBanner />
            <OrderNotifications />
            <AuthModal />
          </PwaInstallProvider>
        </RiderAuthProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
