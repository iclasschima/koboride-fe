"use client";

import { useEffect, useState } from "react";
import { ensureNotifyPermission, notificationPermission } from "@/lib/notify";

export function NotifyPrompt() {
  const [permission, setPermission] = useState<ReturnType<typeof notificationPermission>>(
    "unsupported",
  );

  useEffect(() => {
    setPermission(notificationPermission());
  }, []);

  if (permission !== "default") return null;

  return (
    <button
      type="button"
      className="mt-3 w-full text-center text-[13px] font-medium text-brand"
      onClick={() => {
        void ensureNotifyPermission().then((granted) => {
          setPermission(granted ? "granted" : notificationPermission());
        });
      }}
    >
      Turn on alerts for this order
    </button>
  );
}
