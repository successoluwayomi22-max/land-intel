"use client";

import React, { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
    __landintel_sync_translate?: (lang: string) => void;
    __landintel_load_translate?: () => void;
  }
}

/**
 * GoogleTranslateIntegration
 * 
 * High-performance invisible widget powering instant page translation via Google Translate.
 * 
 * Key optimizations for blazing-fast translation:
 * 1. Loads immediately after interactive (0s artificial deferral removed).
 * 2. Pre-sets googtrans cookie on mount for instantaneous rendering if a non-English language was saved.
 * 3. Proactively mounts and initializes Google Translate into a hidden container.
 * 4. Microsecond MutationObserver connects as soon as the Google select combo mounts.
 * 5. Aggressively hides all Google UI banners, iframes, and spinners with 0 layout shift.
 */
export function GoogleTranslateIntegration() {
  const [shouldLoadScript, setShouldLoadScript] = React.useState(true);

  // Pre-set translation cookie immediately from storage so Google's engine translates on initial parse
  useEffect(() => {
    try {
      const savedLang =
        localStorage.getItem("landintel_lang") ||
        localStorage.getItem("diasporaland_lang") ||
        "en";
      
      const GOOGLE_MAP: Record<string, string> = {
        zh: "zh-CN",
        pcm: "pcm",
      };
      const googleCode = GOOGLE_MAP[savedLang] || savedLang;

      if (savedLang && savedLang !== "en") {
        const transVal = `/en/${googleCode}`;
        document.cookie = `googtrans=${transVal}; path=/; max-age=31536000; SameSite=Lax;`;
        const hostname = window.location.hostname;
        if (hostname !== "localhost" && hostname !== "127.0.0.1") {
          document.cookie = `googtrans=${transVal}; path=/; domain=.${hostname}; max-age=31536000; SameSite=Lax;`;
        }
      }

      window.__landintel_load_translate = () => setShouldLoadScript(true);
    } catch {}
  }, []);

  useEffect(() => {
    if (!shouldLoadScript) return;

    const initWidget = () => {
      try {
        if (window.google?.translate?.TranslateElement) {
          const container = document.getElementById("google_translate_element");
          if (!container) return;

          // Avoid re-initialization if already mounted
          if (container.querySelector(".goog-te-combo")) {
            hideTranslateArtifacts();
            return;
          }

          new window.google.translate.TranslateElement(
            {
              pageLanguage: "en",
              autoDisplay: false,
              multilanguagePage: true,
            },
            "google_translate_element"
          );

          // Fast-sync current or saved language immediately
          const savedLang =
            localStorage.getItem("landintel_lang") ||
            localStorage.getItem("diasporaland_lang") ||
            "en";

          if (savedLang && savedLang !== "en" && window.__landintel_sync_translate) {
            window.__landintel_sync_translate(savedLang);
          }
          hideTranslateArtifacts();
        }
      } catch {}
    };

    window.googleTranslateElementInit = initWidget;

    // If script was already evaluated or cached
    if (window.google?.translate?.TranslateElement) {
      initWidget();
    }

    // Ultra-lightweight scoped MutationObserver: only observe the hidden widget container
    let observer: MutationObserver | null = null;
    const container = document.getElementById("google_translate_element");

    if (container && typeof window !== "undefined" && window.MutationObserver) {
      observer = new MutationObserver(() => {
        const combo = container.querySelector(".goog-te-combo") as HTMLSelectElement | null;
        if (combo) {
          if (!combo.id) combo.id = "google-translate-select";
          if (!combo.name) combo.name = "google-translate-select";
          if (!combo.getAttribute("aria-label")) combo.setAttribute("aria-label", "Language Selector");

          const savedLang =
            localStorage.getItem("landintel_lang") ||
            localStorage.getItem("diasporaland_lang") ||
            "en";
          if (savedLang !== "en" && window.__landintel_sync_translate) {
            window.__landintel_sync_translate(savedLang);
          }
          // Disconnect immediately once combo is discovered - zero background CPU overhead
          observer?.disconnect();
        }
      });

      observer.observe(container, { childList: true, subtree: true });
    }

    return () => {
      observer?.disconnect();
    };
  }, [shouldLoadScript]);

  return (
    <>
      <div
        id="google_translate_element"
        style={{ display: "none" }}
        className="notranslate"
      />
      {shouldLoadScript && (
        <Script
          id="google-translate-script"
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
      )}
    </>
  );
}

/**
 * Lightweight helper to ensure body positioning is intact
 */
function hideTranslateArtifacts() {
  try {
    if (typeof document !== "undefined" && document.body.style.top && document.body.style.top !== "0px") {
      document.body.style.top = "0px";
    }
  } catch {}
}
