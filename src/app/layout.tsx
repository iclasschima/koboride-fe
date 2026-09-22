import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Clarity } from "@/components/analytics/Clarity";
import { Contentsquare } from "@/components/analytics/Contentsquare";
import { Providers } from "@/components/Providers";
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
  metadataBase: new URL("https://www.koboride.ng"),
  alternates: {
    canonical: "https://www.koboride.ng",
  },
  title: {
    default: "KoboRide — Errands on a bike",
    template: "%s · KoboRide",
  },
  description:
    "KoboRide is a bicycle courier in Lagos. Book a rider to pick up a package and deliver it. Pay cash or card.",
  applicationName: "KoboRide",
  appleWebApp: {
    capable: true,
    title: "KoboRide",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "KoboRide",
    title: "KoboRide — Errands on a bike",
    description:
      "KoboRide is a bicycle courier in Lagos. Book a rider to pick up a package and deliver it. Pay cash or card.",
    url: "https://www.koboride.ng",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "KoboRide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KoboRide — Errands on a bike",
    description:
      "KoboRide is a bicycle courier in Lagos. Book a rider to pick up a package and deliver it. Pay cash or card.",
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
