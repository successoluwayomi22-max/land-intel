"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { RECAPTCHA_SITE_KEY } from "@/lib/security/public-credentials";

interface ReCaptchaProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  className?: string;
  hasError?: boolean;
}

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
      render?: any;
    };
  }
}

export const ReCaptcha: React.FC<ReCaptchaProps> = ({
  onVerify,
  onExpire,
  className = "",
  hasError = false,
}) => {
  const [isChecked, setIsChecked] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const siteKey = RECAPTCHA_SITE_KEY;
  const verifiedRef = useRef(false);
  const expiryTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Pre-load Google reCAPTCHA v3 script silently in the background
  // NOTE: We do NOT auto-execute or auto-verify here. The checkbox must remain UNCHECKED
  // until the user physically clicks it, just like authentic Google reCAPTCHA.
  useEffect(() => {
    if (!siteKey || typeof window === "undefined") return;

    const scriptId = "google-recaptcha-script";
    const existing = document.getElementById(scriptId);

    if (!existing) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    return () => {
      if (expiryTimerRef.current) {
        clearTimeout(expiryTimerRef.current);
      }
    };
  }, [siteKey]);

  // Execute Google reCAPTCHA when user interacts
  const handleUserClick = useCallback(async () => {
    // If already verified or currently spinning, ignore clicks
    if (isChecked || isVerifying) return;

    setIsFailed(false);
    setIsVerifying(true);

    try {
      // 1. Wait for Google reCAPTCHA script to be ready
      const tokenPromise = new Promise<string>((resolve, reject) => {
        if (!siteKey || typeof window === "undefined" || !window.grecaptcha) {
          // Retry waiting up to 3 seconds if script is still loading
          let attempts = 0;
          const interval = setInterval(() => {
            attempts++;
            if (window.grecaptcha?.execute) {
              clearInterval(interval);
              window.grecaptcha.ready(async () => {
                try {
                  const res = await window.grecaptcha!.execute(siteKey, { action: "register" });
                  resolve(res);
                } catch (e) {
                  reject(e);
                }
              });
            } else if (attempts >= 15) {
              clearInterval(interval);
              reject(new Error("reCAPTCHA script load timeout"));
            }
          }, 200);
        } else {
          window.grecaptcha.ready(async () => {
            try {
              const res = await window.grecaptcha!.execute(siteKey, { action: "register" });
              resolve(res);
            } catch (err) {
              reject(err);
            }
          });
        }
      });

      // 2. Realistic human verification delay (Google reCAPTCHA v2 spinner spins for 600-800ms)
      const delayPromise = new Promise((resolve) => setTimeout(resolve, 750));

      const [token] = await Promise.all([tokenPromise, delayPromise]);

      if (token && typeof token === "string" && token.length > 20) {
        verifiedRef.current = true;
        setIsVerifying(false);
        setIsChecked(true);
        setIsFailed(false);
        onVerify(token);

        // Google tokens expire after 2 minutes (120s). Set expiry warning at 110s.
        if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
        expiryTimerRef.current = setTimeout(() => {
          verifiedRef.current = false;
          setIsChecked(false);
          if (onExpire) onExpire();
        }, 110 * 1000);
      } else {
        throw new Error("Invalid token received");
      }
    } catch (err) {
      console.warn("[RECAPTCHA] Verification error on user interaction:", err);
      setIsVerifying(false);
      setIsFailed(true);
      verifiedRef.current = false;
    }
  }, [isChecked, isVerifying, siteKey, onVerify, onExpire]);

  return (
    <div className={`recaptcha-widget my-3 select-none ${className}`}>
      <div
        role="checkbox"
        aria-checked={isChecked}
        tabIndex={0}
        onClick={handleUserClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleUserClick();
          }
        }}
        className={`w-[304px] h-[78px] bg-[#f9f9f9] border rounded-[3px] p-[10px_12px] flex items-center justify-between shadow-[0_0_4px_1px_rgba(0,0,0,0.08)] cursor-pointer transition-colors duration-150 ${
          hasError && !isChecked
            ? "border-rose-400 ring-1 ring-rose-400/40"
            : isFailed
            ? "border-red-400 bg-red-50/50"
            : "border-[#d3d3d3] hover:border-[#b2b2b2]"
        }`}
      >
        {/* Left: Checkbox + Authentic Label */}
        <div className="flex items-center gap-[14px]">
          {/* Checkbox Square */}
          <div
            className={`w-[28px] h-[28px] rounded-[2px] flex items-center justify-center transition-all duration-150 ${
              isChecked
                ? "bg-transparent border-none"
                : isVerifying
                ? "bg-transparent border-none"
                : isFailed
                ? "bg-white border-2 border-red-400"
                : "bg-white border-2 border-[#c1c1c1] hover:border-[#b2b2b2]"
            }`}
          >
            {isChecked ? (
              /* Google Green Checkmark */
              <svg
                viewBox="0 0 48 48"
                className="w-[32px] h-[32px] text-[#0f9d58] transition-all transform scale-100 animate-in fade-in zoom-in-75 duration-200"
              >
                <path
                  fill="none"
                  stroke="#0f9d58"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 24l10 10 18-20"
                />
              </svg>
            ) : isVerifying ? (
              /* Authentic Blue Spinning Ring */
              <div className="w-[24px] h-[24px] rounded-full border-[3px] border-[#4285f4]/20 border-t-[#4285f4] animate-spin" />
            ) : isFailed ? (
              /* Error exclamation */
              <span className="text-red-500 font-bold text-xs">!</span>
            ) : null}
          </div>

          {/* Label */}
          <div className="flex flex-col">
            <span
              className={`text-[14px] leading-tight select-none ${
                isFailed ? "text-red-700 font-medium" : "text-[#282727] font-normal"
              }`}
              style={{ fontFamily: "Roboto, -apple-system, BlinkMacSystemFont, Arial, sans-serif" }}
            >
              {isFailed ? "Verification failed" : "I'm not a robot"}
            </span>
            {isFailed && (
              <span className="text-[10px] text-red-500 mt-0.5">Click to retry</span>
            )}
          </div>
        </div>

        {/* Right: Google reCAPTCHA Badge */}
        <div className="flex flex-col items-center justify-center text-center pl-2 select-none">
          {/* Authentic 3-arrow logo */}
          <div className="w-[32px] h-[32px] flex items-center justify-center">
            <svg viewBox="0 0 48 48" className="w-[28px] h-[28px]">
              {/* Google reCAPTCHA 3-arrow icon */}
              <path
                fill="#1a73e8"
                d="M24 4C12.95 4 4 12.95 4 24c0 3.82 1.07 7.4 2.93 10.45l4.36-2.52C9.87 29.69 9.17 26.94 9.17 24c0-8.19 6.64-14.83 14.83-14.83h1.83l-3.32-3.32L24.69 4 32 11.31l-7.31 7.31-2.18-2.18 3.32-3.32H24c-5.42 0-9.83 4.41-9.83 9.88 0 1.94.57 3.75 1.55 5.28l-4.36 2.52C9.8 28.53 9 26.35 9 24 9 15.72 15.72 9 24 9v4l6-6-6-6v3z"
                opacity="0.9"
              />
              <path
                fill="#4285f4"
                d="M44 24c0-3.82-1.07-7.4-2.93-10.45l-4.36 2.52c1.42 2.24 2.12 4.99 2.12 7.93 0 8.19-6.64 14.83-14.83 14.83h-1.83l3.32 3.32L23.31 44 16 36.69l7.31-7.31 2.18 2.18-3.32 3.32H24c5.42 0 9.83-4.41 9.83-9.88 0-1.94-.57-3.75-1.55-5.28l4.36-2.52C38.2 19.47 39 21.65 39 24c0 8.28-6.72 15-15 15v-4l-6 6 6 6v-3c11.05 0 20-8.95 20-20z"
              />
            </svg>
          </div>
          <span className="text-[10px] font-bold text-[#555] leading-none mt-0.5 tracking-tight">
            reCAPTCHA
          </span>
          <div className="flex items-center gap-[3px] text-[8px] text-[#555] mt-[2px] leading-none">
            <a
              href="https://www.google.com/intl/en/policies/privacy/"
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="hover:underline text-[#555]"
            >
              Privacy
            </a>
            <span>-</span>
            <a
              href="https://www.google.com/intl/en/policies/terms/"
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="hover:underline text-[#555]"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
