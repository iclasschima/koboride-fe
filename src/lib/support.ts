import { shortId } from "@/lib/format";

export const SUPPORT_WHATSAPP_PHONE = "2349031861100";
export const SUPPORT_TEL_URL = `tel:+${SUPPORT_WHATSAPP_PHONE}`;

const HELP_TEXT = "Hi, I need help with a KoboRide pickup.";

export const SUPPORT_WHATSAPP_URL = `https://wa.me/${SUPPORT_WHATSAPP_PHONE}?text=${encodeURIComponent(HELP_TEXT)}`;

export function orderReportWhatsAppUrl(orderId: string) {
  const text = `Hi, I need to report a problem with KoboRide order ${shortId(orderId)}.`;
  return `https://wa.me/${SUPPORT_WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`;
}
