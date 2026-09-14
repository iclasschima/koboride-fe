const NONCE_KEY = "koboride.refreshNonce";
export const CLIENT_REFRESH_HEADER = "x-kobo-refresh";

function readNonce(): string | null {
  try {
    return localStorage.getItem(NONCE_KEY);
  } catch {
    return null;
  }
}

function writeNonce(nonce: string) {
  try {
    localStorage.setItem(NONCE_KEY, nonce);
  } catch {
    /* private mode */
  }
}

export function applyClientRefreshNonce(nonce: string | null) {
  if (!nonce || typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/admin")) return;

  const seen = readNonce();
  if (seen == null) {
    writeNonce(nonce);
    return;
  }
  if (seen === nonce) return;
  writeNonce(nonce);
  window.location.reload();
}
