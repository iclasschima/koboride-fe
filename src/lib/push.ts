import { api } from "@/lib/api/client";

export type PushAppRole = "customer" | "rider" | "admin";

function authOpts(role: PushAppRole) {
  if (role === "rider") return { rider: true as const };
  if (role === "admin") return { admin: true as const };
  return {};
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

function vapidKey(): Uint8Array {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!key) throw new Error("Push is not configured");
  return urlBase64ToUint8Array(key);
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function registerPushWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!pushSupported()) return null;
  return navigator.serviceWorker.register("/sw.js");
}

export async function getPushSubscription(): Promise<PushSubscription | null> {
  const registration = await registerPushWorker();
  if (!registration) return null;
  await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function subscribeToPush(role: PushAppRole): Promise<void> {
  if (!pushSupported()) {
    throw new Error("Notifications are not supported in this browser");
  }

  if (Notification.permission === "denied") {
    throw new Error("Notifications were not allowed");
  }

  if (Notification.permission !== "granted") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("Notifications were not allowed");
    }
  }

  const registration = await registerPushWorker();
  if (!registration) throw new Error("Could not start notifications");
  await navigator.serviceWorker.ready;

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKey() as BufferSource,
    }));

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error("Could not subscribe to notifications");
  }

  await api.post(
    "/api/push/subscribe",
    {
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      expirationTime: json.expirationTime ?? null,
    },
    authOpts(role),
  );
}

export function primePushPermission(): void {
  if (!pushSupported()) return;
  if (Notification.permission !== "default") return;
  void Notification.requestPermission();
}

export async function activatePush(role: PushAppRole): Promise<boolean> {
  try {
    await subscribeToPush(role);
    return true;
  } catch {
    return false;
  }
}

export async function unsubscribeFromPush(role: PushAppRole): Promise<void> {
  const subscription = await getPushSubscription();
  if (!subscription) return;
  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  try {
    await api.post("/api/push/unsubscribe", { endpoint }, authOpts(role));
  } catch {
    /* local unsubscribe still succeeded */
  }
}
