"use client";

import React, { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
    __landintel_sync_translate?: (lang: string) => void;
  }
}

/**
 * GoogleTranslateIntegration
 * 
 * Invisible widget that powers real page translation via Google Translate.
 * The visible UI is the custom LocaleSelector; this component handles
 * the actual DOM translation by managing the hidden Google Translate widget.
 * 
 * Key behaviors:
 * 1. Pre-sets the googtrans cookie from localStorage BEFORE the script loads.
 * 2. Initializes the widget into a hidden container.
 * 3. Exposes window.__landintel_sync_translate for the LocaleProvider to call.
 * 4. Uses MutationObserver + polling to ensure the combo select is populated.
 * 5. Aggressively hides all injected Google Translate UI artifacts.
 */
export function GoogleTranslateIntegration() {
  // Pre-set cookies before the translate script loads
  useEffect(() => {
    try {
      const savedLang =
        localStorage.getItem("landintel_lang") ||
        localStorage.getItem("diasporaland_lang") ||
        "en";
      
      if (savedLang && savedLang !== "en") {
        // Map our codes to Google's codes
        const GOOGLE_MAP: Record<string, string> = {
          zh: "zh-CN", pcm: "en",
        };
        const googleCode = GOOGLE_MAP[savedLang] || savedLang;
        const transVal = `/en/${googleCode}`;
        
        // Set cookie immediately so the script picks it up on load
        document.cookie = `googtrans=${transVal}; path=/; max-age=31536000; SameSite=Lax;`;
        const hostname = window.location.hostname;
        if (hostname !== "localhost" && hostname !== "127.0.0.1") {
          document.cookie = `googtrans=${transVal}; path=/; domain=.${hostname}; max-age=31536000; SameSite=Lax;`;
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    const initWidget = () => {
      try {
        if (window.google?.translate?.TranslateElement) {
          const container = document.getElementById("google_translate_element");
          if (!container) return;
          // Avoid re-initialization if already mounted
          if (container.querySelector(".goog-te-combo")) return;

          new window.google.translate.TranslateElement(
            {
              pageLanguage: "en",
              autoDisplay: false,
            },
            "google_translate_element"
          );

          // After widget initializes, sync saved language
          const savedLang =
            localStorage.getItem("landintel_lang") ||
            localStorage.getItem("diasporaland_lang") ||
            "en";
          if (savedLang && savedLang !== "en" && window.__landintel_sync_translate) {
            // Give the widget time to populate options
            setTimeout(() => {
              window.__landintel_sync_translate?.(savedLang);
            }, 300);
          }
        }
      } catch {}
    };

    window.googleTranslateElementInit = initWidget;

    // In case script already loaded before useEffect
    if (window.google?.translate?.TranslateElement) {
      initWidget();
    }

    // MutationObserver: sync as soon as the combo select is in DOM and populated
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
          observer?.disconnect();
        }

        // Also continuously hide injected artifacts
        hideTranslateArtifacts();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    // Polling fallback: check every 500ms for 10s in case MutationObserver misses it
    let pollCount = 0;
    const pollInterval = setInterval(() => {
      pollCount++;
      hideTranslateArtifacts();
      if (pollCount >= 20) {
        clearInterval(pollInterval);
      }
    }, 500);

    return () => {
      observer?.disconnect();
      clearInterval(pollInterval);
    };
  }, []);

  return (
    <>
      <div
        id="google_translate_element"
        style={{ display: "none" }}
      />
      <Script
        id="google-translate-script"
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
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
    // Neutralizes any focusable children injected into aria-hidden containers by external scripts
    document.querySelectorAll('[aria-hidden="true"]').forEach((hiddenEl) => {
      const focusables = hiddenEl.querySelectorAll(
        'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );
      focusables.forEach((f) => {
        f.setAttribute("tabindex", "-1");
        f.setAttribute("aria-hidden", "true");
      });
    });
  } catch {}
}
