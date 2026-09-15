"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";

const TAG_ID = process.env.NEXT_PUBLIC_CONTENTSQUARE_TAG_ID ?? "a17728d1fb778";

declare global {
  interface Window {
    _uxa?: unknown[];
    CS_CONF?: unknown;
  }
}

function pagePath() {
  return window.location.pathname + window.location.hash.replace("#", "?__");
}

export function Contentsquare() {
  const pathname = usePathname();
  const loadedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!TAG_ID) return;
    window._uxa = window._uxa || [];
    const path = pagePath();
    if (loadedPath.current === null) {
      loadedPath.current = path;
      return;
    }
    if (loadedPath.current === path) return;
    loadedPath.current = path;
    if (typeof window.CS_CONF === "undefined") return;
    window._uxa.push(["trackPageview", path]);
  }, [pathname]);

  if (!TAG_ID) return null;

  return (
    <Script id="contentsquare-tag" strategy="afterInteractive">
      {`
        (function () {
          window._uxa = window._uxa || [];
          if (typeof CS_CONF === "undefined") {
            window._uxa.push(["setPath", window.location.pathname + window.location.hash.replace("#","?__")]);
            var mt = document.createElement("script");
            mt.type = "text/javascript";
            mt.async = true;
            mt.src = "//t.contentsquare.net/uxa/${TAG_ID}.js";
            document.getElementsByTagName("head")[0].appendChild(mt);
          } else {
            window._uxa.push(["trackPageview", window.location.pathname + window.location.hash.replace("#","?__")]);
          }
        })();
      `}
    </Script>
  );
}
