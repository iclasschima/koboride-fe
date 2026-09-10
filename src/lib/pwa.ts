export const A2HS_DISMISS_KEY = "koboride.a2hs.dismissed";
export const A2HS_INSTALLED_KEY = "koboride.a2hs.installed";

export function isStandaloneApp(): boolean {
  if (typeof window === "undefined") return false;
  const modes = ["standalone", "fullscreen", "minimal-ui", "window-controls-overlay"];
  const displayMode = modes.some((mode) => window.matchMedia(`(display-mode: ${mode})`).matches);
  const ios = "standalone" in window.navigator && Boolean((window.navigator as { standalone?: boolean }).standalone);
  return displayMode || ios;
}

export function markA2hsInstalled(): void {
  try {
    window.localStorage.setItem(A2HS_INSTALLED_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function a2hsAlreadyInstalled(): boolean {
  if (typeof window === "undefined") return false;
  if (isStandaloneApp()) {
    markA2hsInstalled();
    return true;
  }
  try {
    return window.localStorage.getItem(A2HS_INSTALLED_KEY) === "1";
  } catch {
    return false;
  }
}

export function isIosDevice(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const iPhone = /iPad|iPhone|iPod/.test(ua);
  const iPadOs = window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1;
  return iPhone || iPadOs;
}

export function a2hsDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(A2HS_DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissA2hs(): void {
  try {
    window.localStorage.setItem(A2HS_DISMISS_KEY, "1");
  } catch {
    /* private mode */
  }
}
