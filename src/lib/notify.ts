export function canUseNotifications() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (!canUseNotifications()) return "unsupported";
  return Notification.permission;
}

export async function ensureNotifyPermission(): Promise<boolean> {
  if (!canUseNotifications()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    const result = await Notification.requestPermission();
    return result === "granted";
  } catch {
    return false;
  }
}

export function showOrderNotification(input: {
  title: string;
  body: string;
  url: string;
  tag: string;
}) {
  if (!canUseNotifications() || Notification.permission !== "granted") return;
  try {
    const notice = new Notification(input.title, {
      body: input.body,
      tag: input.tag,
      icon: "/icon.svg",
    });
    notice.onclick = () => {
      notice.close();
      window.focus();
      if (`${window.location.pathname}${window.location.search}` !== input.url) {
        window.location.assign(input.url);
      }
    };
  } catch {
    /* private mode / unsupported */
  }
}
