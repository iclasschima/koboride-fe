"use client";

import { useEffect, useState } from "react";

type PushBannerState = { title: string; body: string; url: string };

export function PushBanner() {
  const [banner, setBanner] = useState<PushBannerState | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; title?: string; body?: string; url?: string };
      if (data?.type !== "KOBORIDE_PUSH") return;
      setBanner({
        title: data.title || "KoboRide",
        body: data.body || "",
        url: data.url || "/",
      });
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);

  if (!banner) return null;

  return (
    <button
      type="button"
      className="fixed top-3 right-3 z-[80] max-w-sm rounded-2xl border border-black/10 bg-white px-4 py-3 text-left shadow-[0_12px_40px_rgba(27,42,74,0.18)]"
      onClick={() => {
        const url = banner.url;
        setBanner(null);
        if (url && `${window.location.pathname}${window.location.search}` !== url) {
          window.location.assign(url);
        }
      }}
    >
      <p className="text-[11px] font-semibold tracking-[0.06em] text-[#8A8780] uppercase">
        Notification
      </p>
      <p className="mt-1 font-display text-[16px] font-semibold">{banner.title}</p>
      {banner.body ? <p className="mt-0.5 text-[13px] text-[#5C5A54]">{banner.body}</p> : null}
    </button>
  );
}
