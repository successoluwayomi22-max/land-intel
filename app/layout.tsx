import type { Metadata, Viewport } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { GoogleTranslateIntegration } from "@/components/providers/GoogleTranslateIntegration";
import { PlatformContactProvider } from "@/components/providers/PlatformContactProvider";
import { CookieConsent } from "@/components/ui/CookieConsent";
import { ConnectionStatus } from "@/components/ui/ConnectionStatus";

const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-urbanist",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0B1220",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

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
  verification: {
    google: "d610769079a4ec09",
  },
  other: {
    "google-site-verification": "googled610769079a4ec09.html",
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

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://land-intel-omega.vercel.app/#organization",
      name: "LandIntel",
      url: "https://land-intel-omega.vercel.app",
      logo: "https://land-intel-omega.vercel.app/icon",
      description: "Institutional property due-diligence, cadastral boundary verification, and title search certification.",
    },
    {
      "@type": "WebSite",
      "@id": "https://land-intel-omega.vercel.app/#website",
      url: "https://land-intel-omega.vercel.app",
      name: "LandIntel",
      description: "Global Land Intelligence & Cadastral Verification Platform",
      publisher: {
        "@id": "https://land-intel-omega.vercel.app/#organization",
      },
    },
    {
      "@type": "WebApplication",
      "@id": "https://land-intel-omega.vercel.app/#webapp",
      name: "LandIntel Cadastral Risk Engine",
      applicationCategory: "BusinessApplication",
      operatingSystem: "All",
      offers: {
        "@type": "Offer",
        price: "50.00",
        priceCurrency: "USD",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="dns-prefetch" href="https://translate.google.com" />
        <link rel="dns-prefetch" href="https://translate.googleapis.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${urbanist.variable} font-urbanist min-h-screen bg-brand-background text-brand-textPrimary antialiased selection:bg-blue-100 selection:text-blue-900`}>
        <LocaleProvider>
          <PlatformContactProvider>
            <GoogleTranslateIntegration />
            <ConnectionStatus />
            <ToastProvider>
              {children}
              <CookieConsent />
            </ToastProvider>
          </PlatformContactProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
