"use client";

import React, { useState, useEffect, useRef } from "react";
import { RECAPTCHA_SITE_KEY } from "@/lib/security/credentials";

interface ReCaptchaProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  className?: string;
}

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      render: (
        container: string | HTMLElement,
        params: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark";
          size?: "normal" | "compact";
        }
      ) => number;
      reset: (widgetId?: number) => void;
    };
    onRecaptchaLoadedCallback?: () => void;
  }
}

export const ReCaptcha: React.FC<ReCaptchaProps> = ({
  onVerify,
  onExpire,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const siteKey = RECAPTCHA_SITE_KEY;

  useEffect(() => {
    if (!siteKey || typeof window === "undefined") {
      return;
    }

    let isMounted = true;

    const renderGoogleWidget = () => {
      if (
        !containerRef.current ||
        !window.grecaptcha?.render ||
        widgetIdRef.current !== null
      ) {
        return;
      }

      try {
        containerRef.current.innerHTML = "";
        const id = window.grecaptcha.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            if (isMounted) {
              onVerify(token);
            }
          },
          "expired-callback": () => {
            if (isMounted) {
              onExpire?.();
            }
          },
          "error-callback": () => {
            console.warn("[RECAPTCHA] Google widget encountered an error");
            if (isMounted) {
              setLoadError(true);
            }
          },
          theme: "light",
          size: "normal",
        });

        widgetIdRef.current = id;
        if (isMounted) {
          setIsRendered(true);
        }
      } catch (err) {
        console.warn("[RECAPTCHA] Render error:", err);
      }
    };

    // If script is already in window
    if (window.grecaptcha?.render) {
      renderGoogleWidget();
      return;
    }

    // Set global callback
    window.onRecaptchaLoadedCallback = () => {
      if (isMounted) {
        renderGoogleWidget();
      }
    };

    const scriptId = "google-recaptcha-v2-script";
    const existingScript = document.getElementById(scriptId);

    if (!existingScript) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src =
        "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoadedCallback&render=explicit";
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        if (isMounted) {
          setLoadError(true);
        }
      };
      document.head.appendChild(script);
    }

    return () => {
      isMounted = false;
    };
  }, [siteKey, onVerify, onExpire]);

  return (
    <div className={`recaptcha-container my-3 ${className}`}>
      {/* Official Google reCAPTCHA v2 mount point */}
      <div
        ref={containerRef}
        className="min-h-[78px] min-w-[304px] flex items-center justify-start overflow-hidden rounded-[3px]"
      />

      {/* Loading state before Google script executes render */}
      {!isRendered && !loadError && (
        <div className="h-[78px] w-[304px] bg-slate-50 border border-slate-200 rounded-[3px] flex items-center justify-center gap-2 text-xs text-slate-500 shadow-xs">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-brand-blue rounded-full animate-spin" />
          <span>Loading Google reCAPTCHA verification...</span>
        </div>
      )}

      {/* Domain or Network Warning Notice if Google script failed */}
      {loadError && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 max-w-[320px]">
          Unable to connect to Google reCAPTCHA. Please ensure your browser allows Google scripts or check your connection.
        </div>
      )}
    </div>
  );
};
