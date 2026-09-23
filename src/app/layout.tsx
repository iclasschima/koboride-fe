import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Clarity } from "@/components/analytics/Clarity";
import { Contentsquare } from "@/components/analytics/Contentsquare";
import { Providers } from "@/components/Providers";
import {
  COMPANY_DESCRIPTION,
  COMPANY_NAME,
  COMPANY_SITE,
  COMPANY_TAGLINE,
} from "@/lib/company";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(COMPANY_SITE),
  alternates: {
    canonical: COMPANY_SITE,
  },
  title: {
    default: `${COMPANY_NAME} — ${COMPANY_TAGLINE}`,
    template: `%s · ${COMPANY_NAME}`,
  },
  description: COMPANY_DESCRIPTION,
  applicationName: COMPANY_NAME,
  appleWebApp: {
    capable: true,
    title: COMPANY_NAME,
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: COMPANY_NAME,
    title: `${COMPANY_NAME} — ${COMPANY_TAGLINE}`,
    description: COMPANY_DESCRIPTION,
    url: COMPANY_SITE,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: COMPANY_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${COMPANY_NAME} — ${COMPANY_TAGLINE}`,
    description: COMPANY_DESCRIPTION,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0F3D2E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable}`}
    >
      <body className={`${inter.className} antialiased`}>
        <Clarity />
        <Contentsquare />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
