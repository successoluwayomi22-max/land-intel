"use client";

import React, { useEffect, useState } from "react";
import Script from "next/script";

// Configurable GA4 Measurement ID
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-RZ0EZ94GXP";

/**
 * Global helper to track custom events in Google Analytics 4 (GA4)
 * Usage: trackGAEvent("checkout_completed", { package: "STANDARD_AUDIT", amount: 48375 })
 */
export function trackGAEvent(eventName: string, eventParams: Record<string, any> = {}) {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", eventName, eventParams);
  }
}

export const GoogleAnalytics: React.FC = () => {
  const [shouldLoad, setShouldLoad] = useState(false);

  // Check user cookie preferences for GDPR/NDPR compliance
  useEffect(() => {
    try {
      const consentStr = localStorage.getItem("landintel_cookie_consent");
      if (consentStr) {
        const consent = JSON.parse(consentStr);
        if (typeof window !== "undefined" && (window as any).gtag) {
          (window as any).gtag("consent", "update", {
            analytics_storage: consent.analytics !== false ? "granted" : "denied",
          });
        }
      }
    } catch {
      // LocalStorage unavailable
    }

    // Load GA on real user interaction or deferred idle fallback
    const triggerLoad = () => {
      setShouldLoad(true);
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener("scroll", triggerLoad);
      window.removeEventListener("pointerdown", triggerLoad);
      window.removeEventListener("touchstart", triggerLoad);
      window.removeEventListener("keydown", triggerLoad);
    };

    window.addEventListener("scroll", triggerLoad, { passive: true, once: true });
    window.addEventListener("pointerdown", triggerLoad, { passive: true, once: true });
    window.addEventListener("touchstart", triggerLoad, { passive: true, once: true });
    window.addEventListener("keydown", triggerLoad, { passive: true, once: true });

    const timer = setTimeout(triggerLoad, 10000);

    return () => {
      cleanup();
      clearTimeout(timer);
    };
  }, []);

  if (!GA_MEASUREMENT_ID || !shouldLoad) return null;

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
              send_page_view: true,
              cookie_flags: 'SameSite=None;Secure'
            });
          `,
        }}
      />
    </>
  );
};
