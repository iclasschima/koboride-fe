"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  getPushSubscription,
  pushSupported,
  subscribeToPush,
  type PushAppRole,
} from "@/lib/push";
import { usePwaInstall } from "@/components/pwa/PwaInstallProvider";
import { InstallAppButton } from "@/components/pwa/AddToHomeScreen";

export function EnableNotifications({
  role,
  framed,
}: {
  role: PushAppRole;
  framed?: boolean;
}) {
  const [ready, setReady] = useState(false);
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { ready: pwaReady, ios, installed } = usePwaInstall();

  useEffect(() => {
    const ok = pushSupported();
    setSupported(ok);
    if (!ok) {
      setReady(true);
      return;
    }
    void getPushSubscription()
      .then((sub) => setEnabled(Boolean(sub) && Notification.permission === "granted"))
      .catch(() => setEnabled(false))
      .finally(() => setReady(true));
  }, []);

  async function enable() {
    setBusy(true);
    setError("");
    try {
      await subscribeToPush(role);
      setEnabled(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not enable notifications");
    } finally {
      setBusy(false);
    }
  }

  if (!ready || !pwaReady) return null;
  if (enabled) return null;

  const body = (() => {
    if (ios && !installed) {
      return (
        <div className="mt-3 rounded-2xl bg-[#EEEDE8] px-3.5 py-3">
          <p className="text-[13px] font-medium text-[#1A1A16]">
            Add KoboRide to your Home Screen first, then turn on alerts from here.
          </p>
          <InstallAppButton className="mt-2.5 w-full" size="md" />
        </div>
      );
    }

    if (!supported) {
      return (
        <p className="mt-2 text-[13px] text-[#8A8780]">
          Notifications are not supported in this browser.
        </p>
      );
    }

    if (Notification.permission === "denied") {
      return (
        <p className="mt-2 text-[13px] text-[#8A8780]">
          Notifications are blocked. Allow them in your browser settings to get order
          alerts.
        </p>
      );
    }

    return (
      <div className="mt-3">
        {error ? <p className="mb-2 text-[13px] font-medium text-danger">{error}</p> : null}
        <Button type="button" className="w-full" disabled={busy} onClick={() => void enable()}>
          {busy ? "Enabling…" : "Turn on alerts"}
        </Button>
      </div>
    );
  })();

  if (!framed) return body;

  return (
    <section className="mt-6 rounded-xl border border-black/6 bg-white px-4 py-3">
      <h2 className="font-display text-[16px] font-semibold">Alerts</h2>
      <p className="mt-1 text-[13px] text-[#8A8780]">
        Get a push when a customer signs up, a new order lands, or an order status
        changes.
      </p>
      {body}
    </section>
  );
}
