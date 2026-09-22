import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { GoogleTranslateIntegration } from "@/components/providers/GoogleTranslateIntegration";
import { CookieConsent } from "@/components/ui/CookieConsent";
import { ConnectionStatus } from "@/components/ui/ConnectionStatus";

const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-urbanist",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "LandIntel | Global Property Due-Diligence & Cadastral Intelligence",
  description:
    "Institutional property due-diligence, cadastral boundary verification, and title search certification for global real-estate investors, diaspora buyers, and institutions.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://land-intel-omega.vercel.app"),
  openGraph: {
    title: "LandIntel — Global Property Intelligence",
    description:
      "Institutional property due-diligence and cadastral risk intelligence.",
    url: "https://land-intel-omega.vercel.app",
    siteName: "LandIntel",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LandIntel | Global Property Due-Diligence",
    description: "Institutional property due-diligence and cadastral verification.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://translate.google.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://translate.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://translate.google.com" />
        <link rel="dns-prefetch" href="https://translate.googleapis.com" />
      </head>
      <body className={`${urbanist.variable} min-h-screen bg-brand-background text-brand-textPrimary font-sans antialiased selection:bg-blue-100 selection:text-blue-900`}>
        <LocaleProvider>
          <GoogleTranslateIntegration />
          <ConnectionStatus />
          <ToastProvider>
            {children}
            <CookieConsent />
          </ToastProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
