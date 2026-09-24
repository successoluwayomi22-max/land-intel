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
 * Invisible widget that powers real page translation via Google Translate.
 * The visible UI is the custom LocaleSelector; this component handles
 * the actual DOM translation by managing the hidden Google Translate widget.
 * 
 * Key behaviors:
 * 1. Pre-sets the googtrans cookie from localStorage BEFORE the script loads.
 * 2. Defers loading for default English visitors until interaction or idle, saving CPU & eliminating cookie warnings.
 * 3. Initializes the widget into a hidden container.
 * 4. Ensures all injected form elements have valid id, name, and aria-labels.
 * 5. Uses MutationObserver + polling to ensure the combo select is populated.
 * 6. Aggressively hides all injected Google Translate UI artifacts.
 */
export function GoogleTranslateIntegration() {
  const [shouldLoadScript, setShouldLoadScript] = React.useState(false);

  // Check if translation is needed immediately or can be deferred
  useEffect(() => {
    try {
      const savedLang =
        localStorage.getItem("landintel_lang") ||
        localStorage.getItem("diasporaland_lang") ||
        "en";
      
      if (savedLang && savedLang !== "en") {
        setShouldLoadScript(true);
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
      } else {
        // For default English users, register prefetch hook and delay load
        window.__landintel_load_translate = () => setShouldLoadScript(true);

        // Defer until browser is completely idle (4 seconds)
        const timer = setTimeout(() => {
          setShouldLoadScript(true);
        }, 4000);

        return () => clearTimeout(timer);
      }
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
          hideTranslateArtifacts();
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

        // Continuously hide injected artifacts and fix form fields
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
  }, [shouldLoadScript]);

  return (
    <>
      <div
        id="google_translate_element"
        style={{ display: "none" }}
      />
      {shouldLoadScript && (
        <Script
          id="google-translate-script"
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="lazyOnload"
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
