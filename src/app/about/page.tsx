import type { Metadata } from "next";
import Link from "next/link";
import {
  COMPANY_ADDRESS,
  COMPANY_EMAIL,
  COMPANY_NAME,
  COMPANY_PHONE_DISPLAY,
  COMPANY_PHONE_TEL,
  COMPANY_SERVICES,
  COMPANY_SITE,
  companyAddressText,
} from "@/lib/company";

export const metadata: Metadata = {
  title: "About",
  description:
    "KoboRide is a bicycle courier in Lagos. We pick up packages and deliver them on a bike. Pay cash or card.",
  alternates: { canonical: `${COMPANY_SITE}/about` },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: COMPANY_NAME,
  description:
    "Bicycle courier service in Lagos. Package pickup and drop-off. Cash or card.",
  url: COMPANY_SITE,
  email: COMPANY_EMAIL,
  telephone: COMPANY_PHONE_DISPLAY,
  address: {
    "@type": "PostalAddress",
    streetAddress: COMPANY_ADDRESS.line1,
    addressLocality: COMPANY_ADDRESS.city,
    addressCountry: "NG",
  },
  areaServed: "Lagos, Nigeria",
};

export default function AboutPage() {
  return (
    <div className="min-h-full bg-[#FAFAF7] px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <p className="text-[12px] font-semibold tracking-[0.06em] text-brand uppercase">
        {COMPANY_NAME}
      </p>
      <h1 className="mt-1 font-display text-[28px] leading-tight font-bold tracking-[-0.04em] text-[#1A1A16]">
        Bicycle courier in Lagos
      </h1>
      <p className="mt-3 text-[16px] leading-relaxed text-[#5C5A54]">
        KoboRide picks up packages and delivers them on a bike. You book a
        rider, we collect from one address, and we drop off at another. Cash or
        card.
      </p>

      <h2 className="mt-8 font-display text-[18px] font-semibold tracking-[-0.02em]">
        What we offer
      </h2>
      <ul className="mt-3 space-y-3">
        {COMPANY_SERVICES.map((service) => (
          <li
            key={service.title}
            className="rounded-2xl bg-white px-4 py-3.5 ring-1 ring-black/6"
          >
            <p className="font-display text-[16px] font-semibold text-[#1A1A16]">
              {service.title}
            </p>
            <p className="mt-1 text-[14px] leading-snug text-[#5C5A54]">
              {service.body}
            </p>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 font-display text-[18px] font-semibold tracking-[-0.02em]">
        Contact
      </h2>
      <dl className="mt-3 space-y-3 text-[15px]">
        <div>
          <dt className="text-[12px] font-medium text-[#8A8780]">Email</dt>
          <dd className="mt-0.5">
            <a href={`mailto:${COMPANY_EMAIL}`} className="font-medium text-brand">
              {COMPANY_EMAIL}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-[12px] font-medium text-[#8A8780]">Phone</dt>
          <dd className="mt-0.5">
            <a href={COMPANY_PHONE_TEL} className="font-medium text-brand">
              {COMPANY_PHONE_DISPLAY}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-[12px] font-medium text-[#8A8780]">Address</dt>
          <dd className="mt-0.5 font-medium text-[#1A1A16]">
            {companyAddressText()}
          </dd>
        </div>
      </dl>

      <Link
        href="/"
        className="mt-8 inline-flex text-[14px] font-semibold text-brand"
      >
        Book a delivery
      </Link>
    </div>
  );
}
