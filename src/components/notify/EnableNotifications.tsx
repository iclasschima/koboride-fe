"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  getPushSubscription,
  pushSupported,
  subscribeToPush,
  unsubscribeFromPush,
  type PushAppRole,
} from "@/lib/push";
import { usePwaInstall } from "@/components/pwa/PwaInstallProvider";
import { Share, Smartphone } from "lucide-react";

export function EnableNotifications({ role }: { role: PushAppRole }) {
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

  async function disable() {
    setBusy(true);
    setError("");
    try {
      await unsubscribeFromPush(role);
      setEnabled(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not disable notifications");
    } finally {
      setBusy(false);
    }
  }

  if (!ready || !pwaReady) return null;

  if (ios && !installed) {
    return (
      <div className="mt-3 rounded-2xl bg-[#EEEDE8] px-3.5 py-3">
        <p className="text-[13px] font-medium text-[#1A1A16]">
          Add KoboRide to your Home Screen first, then turn on alerts from here.
        </p>
        <ol className="mt-2 space-y-1.5 text-[13px] text-[#5C5A54]">
          <li className="flex gap-2">
            <Share className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            Tap Share in Safari
          </li>
          <li className="flex gap-2">
            <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            Tap Add to Home Screen, open the app, then come back here
          </li>
        </ol>
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
      {enabled ? (
        <Button
          type="button"
          className="w-full"
          variant="secondary"
          disabled={busy}
          onClick={() => void disable()}
        >
          {busy ? "Saving…" : "Disable notifications"}
        </Button>
      ) : (
        <Button type="button" className="w-full" disabled={busy} onClick={() => void enable()}>
          {busy ? "Enabling…" : "Turn on alerts"}
        </Button>
      )}
    </div>
  );
}
