"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { GOOGLE_CLIENT_ID } from "@/lib/security/public-credentials";

interface GoogleAuthButtonProps {
  mode?: "login" | "signup";
  className?: string;
}

declare global {
  interface Window {
    google?: any;
  }
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  mode = "login",
  className = "",
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [gsiLoaded, setGsiLoaded] = useState(false);
  const [buttonRendered, setButtonRendered] = useState(false);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);
  const codeClientRef = useRef<any>(null);

  const clientId = GOOGLE_CLIENT_ID;

  // Complete session login from server response
  const completeAuth = useCallback(
    (data: any) => {
      if (typeof window !== "undefined") {
        if (data.token) {
          localStorage.setItem("landintel_token", data.token);
        }
        if (data.user) {
          localStorage.setItem("landintel_user", JSON.stringify(data.user));
        }
      }

      toast(
        data.isNewUser
          ? "Google account registered successfully!"
          : `Signed in as ${data.user?.email || "Google user"}.`,
        "success"
      );

      const target =
        data.user?.role === "ADMIN" || data.user?.role === "SUPER_ADMIN"
          ? "/admin"
          : "/dashboard";

      window.location.href = target;
    },
    [toast]
  );

  // Handle the Google Identity Services credential response (from One-Tap or GSI button)
  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      setLoading(true);
      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast(data.error || "Google authentication failed.", "error");
          setLoading(false);
          return;
        }

        completeAuth(data);
      } catch (err: any) {
        toast(err.message || "Failed to reach Google authentication.", "error");
        setLoading(false);
      }
    },
    [toast, completeAuth]
  );

  // Handle Google OAuth2 authorization code (from popup code client)
  const handleAuthCode = useCallback(
    async (code: string) => {
      setLoading(true);
      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, redirect_uri: "postmessage" }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast(data.error || "Google authentication failed.", "error");
          setLoading(false);
          return;
        }

        completeAuth(data);
      } catch (err: any) {
        toast(err.message || "Failed to complete Google authentication.", "error");
        setLoading(false);
      }
    },
    [toast, completeAuth]
  );

  // Load Google Identity Services script
  useEffect(() => {
    if (!clientId) return;

    if (window.google?.accounts?.id || window.google?.accounts?.oauth2) {
      setGsiLoaded(true);
      return;
    }

    const existingScript = document.getElementById("google-gsi-script") as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("load", () => setGsiLoaded(true));
      // In case it already loaded
      if (window.google?.accounts?.id) {
        setGsiLoaded(true);
      }
      return;
    }

    const script = document.createElement("script");
    script.id = "google-gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setGsiLoaded(true);
    document.head.appendChild(script);
  }, [clientId]);

  // Initialize GSI, popup code client, render button, and prompt One-Tap
  useEffect(() => {
    if (!gsiLoaded || !clientId || !window.google?.accounts) return;

    try {
      // 1. Initialize Google Identity Services (ID token & One-Tap)
      if (window.google.accounts.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Render official Google button into visible container
        if (googleBtnContainerRef.current) {
          googleBtnContainerRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: "outline",
            size: "large",
            type: "standard",
            text: mode === "signup" ? "signup_with" : "continue_with",
            shape: "rectangular",
            logo_alignment: "left",
            width: 340,
          });
          setButtonRendered(true);
        }

        // Also prompt Google One-Tap
        window.google.accounts.id.prompt();
      }

      // 2. Initialize Google OAuth2 Popup Code Client (for explicit button clicks)
      if (window.google.accounts.oauth2) {
        codeClientRef.current = window.google.accounts.oauth2.initCodeClient({
          client_id: clientId,
          scope: "openid email profile",
          ux_mode: "popup",
          callback: (response: any) => {
            if (response.code) {
              handleAuthCode(response.code);
            } else if (response.error) {
              console.warn("[GOOGLE_AUTH] Popup response error:", response.error);
              setLoading(false);
            }
          },
          error_callback: (err: any) => {
            console.warn("[GOOGLE_AUTH] Popup dismissed or error:", err);
            setLoading(false);
          },
        });
      }
    } catch (e) {
      console.warn("[GSI] Init warning:", e);
    }
  }, [gsiLoaded, clientId, handleCredentialResponse, handleAuthCode, mode]);

  // Explicit user click on custom button
  const handleClick = () => {
    // 1. Prefer native popup code client (avoids redirect_uri_mismatch entirely)
    if (codeClientRef.current) {
      setLoading(true);
      codeClientRef.current.requestCode();
      return;
    }

    // 2. Next, try triggering Google One-Tap prompt
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }

    // 3. Fallback to server-side Google OAuth endpoint
    setLoading(true);
    if (typeof window !== "undefined") {
      window.location.href = "/api/auth/google";
    }
  };

  return (
    <div className={`w-full flex flex-col items-center justify-center min-h-[44px] relative ${className}`}>
      {/* Container for Google's native popup button (kept in DOM with geometry for proper iframe rendering) */}
      <div
        ref={googleBtnContainerRef}
        className={`w-full flex justify-center transition-opacity duration-200 ${
          buttonRendered ? "opacity-100" : "opacity-0 absolute pointer-events-none"
        }`}
      />

      {/* Styled fallback button displayed when GSI is initializing */}
      {!buttonRendered && (
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>
            {loading
              ? "Connecting to Google..."
              : mode === "signup"
              ? "Sign up with Google"
              : "Continue with Google"}
          </span>
        </button>
      )}
    </div>
  );
};
