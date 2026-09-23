import type { ReactNode } from "react";
import Link from "next/link";
import { Info, MessageCircle } from "lucide-react";
import { orderReportWhatsAppUrl, SUPPORT_WHATSAPP_URL } from "@/lib/support";
import { cn } from "@/lib/cn";

function AccountLinkCard({
  href,
  icon,
  title,
  subtitle,
  className,
  external,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
  className?: string;
  external?: boolean;
}) {
  const classNames = cn(
    "flex w-full items-center gap-2.5 rounded-2xl bg-white px-3.5 py-2 text-left ring-1 ring-black/6",
    className,
  );
  const body = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#DCEEE4] text-brand">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[15px] font-semibold tracking-[-0.02em] text-[#1A1A16]">
          {title}
        </span>
        <span className="mt-px block text-[12px] text-[#8A8780]">{subtitle}</span>
      </span>
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classNames}
      >
        {body}
      </a>
    );
  }

  return (
    <Link href={href} className={classNames}>
      {body}
    </Link>
  );
}

export function AboutKoboRide({ className }: { className?: string }) {
  return (
    <AccountLinkCard
      href="/about"
      className={className}
      icon={<Info className="h-4 w-4" strokeWidth={2.2} />}
      title="About KoboRide"
      subtitle="What we do and how to reach us"
    />
  );
}

export function WhatsAppSupport({ className }: { className?: string }) {
  return (
    <AccountLinkCard
      href={SUPPORT_WHATSAPP_URL}
      className={className}
      external
      icon={<MessageCircle className="h-4 w-4" strokeWidth={2.2} />}
      title="Support"
      subtitle="Chat with us on WhatsApp"
    />
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
