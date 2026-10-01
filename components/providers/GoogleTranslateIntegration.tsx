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

    // High-speed MutationObserver: instantly detect when .goog-te-combo is inserted
    let observer: MutationObserver | null = null;
    if (typeof window !== "undefined" && window.MutationObserver) {
      observer = new MutationObserver(() => {
        const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
        if (combo && combo.options.length > 1 && window.__landintel_sync_translate) {
          const savedLang =
            localStorage.getItem("landintel_lang") ||
            localStorage.getItem("diasporaland_lang") ||
            "en";
          if (savedLang !== "en") {
            window.__landintel_sync_translate(savedLang);
          }
        }

        // Continuously hide injected artifacts and fix form fields
        hideTranslateArtifacts();
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }

    // Fast initial polling pulse (every 40ms for 2 seconds) to guarantee instant activation
    let pollCount = 0;
    const fastPoll = setInterval(() => {
      pollCount++;
      hideTranslateArtifacts();
      const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
      if (combo && combo.options.length > 1) {
        const savedLang =
          localStorage.getItem("landintel_lang") ||
          localStorage.getItem("diasporaland_lang") ||
          "en";
        if (savedLang !== "en" && window.__landintel_sync_translate) {
          window.__landintel_sync_translate(savedLang);
        }
      }
      if (pollCount >= 50) {
        clearInterval(fastPoll);
      }
    }, 40);

    return () => {
      observer?.disconnect();
      clearInterval(fastPoll);
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
 * Aggressively hides Google Translate injected DOM elements
 * that cause layout shifts (banners, spinners, iframes).
 */
function hideTranslateArtifacts() {
  try {
    // Force body.top = 0 (Google Translate pushes body down for its banner)
    if (document.body.style.top && document.body.style.top !== "0px") {
      document.body.style.top = "0px";
    }

    // Hide the banner iframe
    const bannerFrame = document.querySelector(".goog-te-banner-frame") as HTMLElement | null;
    if (bannerFrame) {
      bannerFrame.style.display = "none";
      bannerFrame.style.height = "0";
    }

    // Hide the spinner/loading overlay
    const selectors = [
      ".VIpgJd-ZVi9od-aZ2wEe-wOHMyf",
      "[class*='VIpgJd-ZVi9od']",
      ".goog-te-spinner-pos",
    ];
    for (const sel of selectors) {
      const els = document.querySelectorAll(sel);
      els.forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.display = "none";
        htmlEl.style.height = "0";
        htmlEl.style.width = "0";
        htmlEl.style.overflow = "hidden";
        htmlEl.style.position = "absolute";
      });
    }

    // Hide top-level skiptranslate divs (but not our hidden widget container)
    document.querySelectorAll("body > .skiptranslate").forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.id !== "google_translate_element") {
        htmlEl.style.display = "none";
        htmlEl.style.height = "0";
        htmlEl.style.overflow = "hidden";
      }
    });

    // Fix Lighthouse: "[aria-hidden="true"] elements contain focusable descendants"
    document.querySelectorAll('[aria-hidden="true"]').forEach((hiddenEl) => {
      const focusables = hiddenEl.querySelectorAll(
        'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );
      focusables.forEach((f) => {
        f.setAttribute("tabindex", "-1");
        f.setAttribute("aria-hidden", "true");
      });
    });

    // Fix Lighthouse / DevTools: "A form field element should have an id or name attribute"
    const combos = document.querySelectorAll<HTMLSelectElement>('.goog-te-combo, select:not([id]):not([name])');
    combos.forEach((el) => {
      if (!el.id) el.id = 'google-translate-select';
      if (!el.name) el.name = 'google-translate-select';
      if (!el.getAttribute('autocomplete')) el.setAttribute('autocomplete', 'off');
      if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', 'Language Selector');
    });

    document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      'input:not([id]):not([name]), textarea:not([id]):not([name])'
    ).forEach((el, idx) => {
      if (!el.id) el.id = `form-field-${idx}`;
      if (!el.name) el.name = `form-field-${idx}`;
    });
  } catch {}
}
