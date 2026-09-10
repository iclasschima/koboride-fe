"use client";

import { Share, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { usePwaInstall } from "@/components/pwa/PwaInstallProvider";

export function AddToHomeScreenCard() {
  const { ready, installed, ios, canPrompt, install } = usePwaInstall();
  if (!ready || installed) return null;
  if (!ios && !canPrompt) return null;

  return (
    <section className="mt-6 rounded-2xl bg-white p-4 ring-1 ring-black/6">
      <h2 className="font-display text-[18px] font-semibold">Add to Home Screen</h2>
      <p className="mt-1 text-[14px] text-[#8A8780]">
        Install KoboRide like an app. Alerts work more reliably that way — especially
        on iPhone.
      </p>
      <InstallActions canPrompt={canPrompt} install={install} />
    </section>
  );
}

export function AddToHomeScreenBanner() {
  const { showBanner, ios, canPrompt, install, dismiss } = usePwaInstall();
  if (!showBanner) return null;

  return (
    <div className="pointer-events-auto relative z-30 mx-3 mb-2 rounded-2xl bg-[#0F3D2E] px-3 py-3 text-[#FAFAF7] shadow-[0_10px_28px_rgba(15,61,46,0.28)]">
      <button
        type="button"
        className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full text-[#FAFAF7]/70"
        aria-label="Dismiss"
        onClick={dismiss}
      >
        <X className="h-4 w-4" />
      </button>
      <p className="pr-8 font-display text-[15px] font-semibold">Add KoboRide to Home Screen</p>
      <p className="mt-0.5 pr-8 text-[12px] text-[#FAFAF7]/75">
        {ios
          ? "Safari: tap Share, then Add to Home Screen."
          : "Install the app for faster access and background alerts."}
      </p>
      {canPrompt ? (
        <button
          type="button"
          className="mt-2 h-9 rounded-full bg-accent px-3 text-[13px] font-semibold text-[#1A1A16]"
          onClick={() => void install()}
        >
          Add to Home Screen
        </button>
      ) : null}
    </div>
  );
}

function InstallActions({
  canPrompt,
  install,
}: {
  canPrompt: boolean;
  install: () => Promise<boolean>;
}) {
  if (canPrompt) {
    return (
      <Button className="mt-3 w-full" onClick={() => void install()}>
        Add to Home Screen
      </Button>
    );
  }

  return (
    <ol className="mt-3 space-y-2 text-[14px] text-[#1A1A16]">
      <li className="flex gap-2">
        <Share className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
        Tap the Share button in Safari
      </li>
      <li className="flex gap-2">
        <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
        Scroll and tap Add to Home Screen
      </li>
    </ol>
  );
}
