import { MessageCircle } from "lucide-react";
import { orderReportWhatsAppUrl, SUPPORT_WHATSAPP_URL } from "@/lib/support";
import { cn } from "@/lib/cn";

export function WhatsAppSupport({ className }: { className?: string }) {
  return (
    <a
      href={SUPPORT_WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-left ring-1 ring-black/6",
        className,
      )}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#DCEEE4] text-brand">
        <MessageCircle className="h-5 w-5" strokeWidth={2.2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[16px] font-semibold tracking-[-0.02em] text-[#1A1A16]">
          Support
        </span>
        <span className="mt-0.5 block text-[13px] text-[#8A8780]">
          Chat with us on WhatsApp
        </span>
      </span>
    </a>
  );
}

export function ReportOrderButton({
  orderId,
  className,
}: {
  orderId: string;
  className?: string;
}) {
  return (
    <a
      href={orderReportWhatsAppUrl(orderId)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex h-10 shrink-0 items-center rounded-full bg-[#FAFAF7] px-3.5 text-[13px] font-semibold text-[#1A1A16] shadow-[0_8px_24px_rgba(15,61,46,0.12)]",
        className,
      )}
    >
      Report
    </a>
  );
}
