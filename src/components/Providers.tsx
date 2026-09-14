"use client";

import { AuthProvider } from "@/lib/auth/AuthProvider";
import { RiderAuthProvider } from "@/lib/auth/RiderAuthProvider";
import { QueryProvider } from "@/lib/query/QueryProvider";
import { AuthModal } from "@/components/auth/AuthModal";
import { MobileShell } from "@/components/layout/MobileShell";
import { AutoActivatePush } from "@/components/notify/AutoActivatePush";
import { OrderNotifications } from "@/components/notify/OrderNotifications";
import { PushBanner } from "@/components/notify/PushBanner";
import { RiderAutoSwitch } from "@/components/layout/RiderAutoSwitch";
import { ForceAppReload } from "@/components/ForceAppReload";
import { PwaInstallProvider } from "@/components/pwa/PwaInstallProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <RiderAuthProvider>
          <PwaInstallProvider>
            <ForceAppReload />
            <MobileShell>{children}</MobileShell>
            <RiderAutoSwitch />
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
