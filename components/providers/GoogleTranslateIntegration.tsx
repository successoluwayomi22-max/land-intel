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

export function GoogleTranslateIntegration() {
  useEffect(() => {
    window.googleTranslateElementInit = () => {
      try {
        if (window.google?.translate?.TranslateElement) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: "en",
              includedLanguages: "en,zh-CN,es,hi,ar,fr,bn,pt,ru,ur,id,de,ja,sw,tr,it,nl,ko,vi,pl,pcm,yo,ig,ha",
              autoDisplay: false,
            },
            "google_translate_element"
          );

          // Fast trigger: apply saved language immediately (defaulting to en)
          const savedLang =
            localStorage.getItem("landintel_lang") || localStorage.getItem("diasporaland_lang") || "en";
          if (window.__landintel_sync_translate) {
            window.__landintel_sync_translate(savedLang);
          }
        }
      } catch {
        // Safe failover if external script has restrictive network
      }
    };

    // Fast MutationObserver: as soon as .goog-te-combo is inserted into DOM, sync immediately in 0ms
    const container = document.getElementById("google_translate_element");
    if (container && typeof window !== "undefined" && window.MutationObserver) {
      const observer = new MutationObserver(() => {
        const combo = document.querySelector(".goog-te-combo");
        if (combo && window.__landintel_sync_translate) {
          const savedLang =
            localStorage.getItem("landintel_lang") || localStorage.getItem("diasporaland_lang") || "en";
          window.__landintel_sync_translate(savedLang);
          observer.disconnect();
        }
      });
      observer.observe(container, { childList: true, subtree: true });
      return () => observer.disconnect();
    }
  }, []);

  return (
    <>
      <div
        id="google_translate_element"
        className="notranslate"
        style={{ display: "none", position: "absolute", top: -9999, left: -9999, pointerEvents: "none" }}
        aria-hidden="true"
      />
      <Script
        id="google-translate-script"
        src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
    </>
  );
}
