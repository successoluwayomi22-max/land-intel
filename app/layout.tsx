import type { Metadata, Viewport } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { GoogleTranslateIntegration } from "@/components/providers/GoogleTranslateIntegration";
import { PlatformContactProvider } from "@/components/providers/PlatformContactProvider";
import { CookieConsent } from "@/components/ui/CookieConsent";
import { ConnectionStatus } from "@/components/ui/ConnectionStatus";
import { GoogleAnalytics } from "@/components/providers/GoogleAnalytics";

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
  title: {
    default: "LandIntel | Global Property Due-Diligence & Cadastral Intelligence",
    template: "%s | LandIntel",
  },
  description:
    "Institutional property due-diligence, cadastral boundary verification, survey plan charting, and land title certification for global real estate investors, diaspora buyers, and financial institutions.",
  keywords: [
    "land verification nigeria",
    "property due diligence",
    "cadastral intelligence",
    "lagos land title search",
    "certificate of occupancy verification",
    "nigeria real estate due diligence",
    "diaspora land purchase",
    "survey plan verification",
    "omonile fraud prevention",
    "governor consent verification",
    "land registry search abuja",
    "property scam check nigeria",
    "gis land charting",
    "title verification platform",
    "landintel",
  ],
  authors: [{ name: "LandIntel Global Intelligence Team", url: "https://land-intel-omega.vercel.app" }],
  creator: "LandIntel Technologies",
  publisher: "LandIntel Technologies",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://land-intel-omega.vercel.app"),
  alternates: {
    canonical: "https://land-intel-omega.vercel.app",
  },
  openGraph: {
    title: "LandIntel — Global Property Intelligence & Due-Diligence",
    description:
      "Institutional property due-diligence, cadastral boundary verification, and title search certification for global real-estate investors and diaspora buyers.",
    url: "https://land-intel-omega.vercel.app",
    siteName: "LandIntel",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://land-intel-omega.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "LandIntel Cadastral Intelligence & Property Due-Diligence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LandIntel — Global Property Intelligence & Due-Diligence",
    description: "Institutional property due-diligence, cadastral verification, and title certification.",
    images: ["https://land-intel-omega.vercel.app/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
  verification: {
    google: "googlef8411a63fb4c6533",
    other: {
      "msvalidate.01": "E22B9F42F613757DAE52A7F1DC618D30",
    },
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
      email: "support@landintel.ai",
      contactPoint: [
        {
          "@type": "ContactPoint",
          email: "support@landintel.ai",
          contactType: "customer service",
          areaServed: ["NG", "US", "GB", "CA", "Worldwide"],
          availableLanguage: ["en"],
        },
      ],
      sameAs: [
        "https://twitter.com/LandIntelGlobal",
        "https://www.linkedin.com/company/landintel",
      ],
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
      potentialAction: {
        "@type": "SearchAction",
        target: "https://land-intel-omega.vercel.app/properties?q={search_term_string}",
        "query-input": "required name=search_term_string",
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
        price: "48375.00",
        priceCurrency: "NGN",
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
        <meta name="google-site-verification" content="googlef8411a63fb4c6533" />
        <meta name="google-site-verification" content="googlef8411a63fb4c6533.html" />
        <meta name="google-site-verification" content="googled610769079a4ec09" />
        <meta name="google-site-verification" content="googled610769079a4ec09.html" />
        <meta name="msvalidate.01" content="E22B9F42F613757DAE52A7F1DC618D30" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${urbanist.variable} font-urbanist min-h-screen bg-brand-background text-brand-textPrimary antialiased selection:bg-blue-100 selection:text-blue-900`}>
        <GoogleAnalytics />
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
