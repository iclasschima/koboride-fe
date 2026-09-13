import type { Trip, TripStatus } from "@/types/request";

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
    return (await Notification.requestPermission()) === "granted";
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

export function tripSig(trip: Pick<Trip, "status" | "riderPhase">): string {
  return `${trip.status}:${trip.riderPhase ?? ""}`;
}

export function customerOrderAlert(
  prevSig: string,
  trip: Trip,
): { title: string; body: string } | null {
  const [prevStatus, prevPhase = ""] = prevSig.split(":") as [TripStatus, string];
  const phase = trip.riderPhase ?? "";
  const route = `${trip.pickup} → ${trip.dropoff}`;

  if (prevStatus !== "cancelled" && trip.status === "cancelled") {
    return { title: "Order cancelled", body: route };
  }
  if (prevStatus !== "completed" && trip.status === "completed") {
    return { title: "Package delivered", body: `Your package reached ${trip.dropoff}` };
  }
  if (
    trip.status === "in_progress" &&
    (phase === "collected" || phase === "en_route_dropoff") &&
    prevPhase !== "collected" &&
    prevPhase !== "en_route_dropoff" &&
    prevPhase !== "delivered"
  ) {
    return { title: "Package picked up", body: `On the way to ${trip.dropoff}` };
  }
  if (prevStatus === "dispatching" && trip.status === "in_progress") {
    const name = trip.riderName?.trim() || "A rider";
    return { title: "Rider accepted", body: `${name} is heading to ${trip.pickup}` };
  }
  return null;
}
