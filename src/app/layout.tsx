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
  title: {
    default: "KoboRide — Errands on a bike",
    template: "%s · KoboRide",
  },
  description:
    "Send a package across Yaba on a bike. Pay cash or card.",
  applicationName: "KoboRide",
  appleWebApp: {
    capable: true,
    title: "KoboRide",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/apple-touch-icon.png",
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
