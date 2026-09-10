"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  a2hsAlreadyInstalled,
  a2hsDismissed,
  dismissA2hs,
  isIosDevice,
  isStandaloneApp,
  markA2hsInstalled,
} from "@/lib/pwa";
import { activatePush } from "@/lib/push";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type PwaInstallContextValue = {
  ready: boolean;
  installed: boolean;
  ios: boolean;
  canPrompt: boolean;
  install: () => Promise<boolean>;
  dismiss: () => void;
  showBanner: boolean;
};

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null);

export function PwaInstallProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setInstalled(a2hsAlreadyInstalled());
    setIos(isIosDevice());
    setDismissed(a2hsDismissed());
    setReady(true);

    const markInstalled = () => {
      markA2hsInstalled();
      setInstalled(true);
      setDeferred(null);
    };
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const media = window.matchMedia("(display-mode: standalone)");
    const onDisplayMode = () => {
      if (isStandaloneApp()) markInstalled();
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", markInstalled);
    media.addEventListener("change", onDisplayMode);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", markInstalled);
      media.removeEventListener("change", onDisplayMode);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    if (choice.outcome === "accepted") {
      void activatePush(window.location.pathname.startsWith("/rider") ? "rider" : "customer");
    }
    return choice.outcome === "accepted";
  }, [deferred]);

  const dismiss = useCallback(() => {
    dismissA2hs();
    setDismissed(true);
  }, []);

  const value = useMemo<PwaInstallContextValue>(
    () => ({
      ready,
      installed,
      ios,
      canPrompt: Boolean(deferred),
      install,
      dismiss,
      showBanner: ready && !installed && !dismissed && (ios || Boolean(deferred)),
    }),
    [deferred, dismissed, install, installed, ios, ready],
  );

  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>;
}

export function usePwaInstall() {
  const ctx = useContext(PwaInstallContext);
  if (!ctx) throw new Error("usePwaInstall must be used within PwaInstallProvider");
  return ctx;
}
