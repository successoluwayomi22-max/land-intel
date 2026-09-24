"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  FileCheck2,
  Scale,
  Building2,
  ArrowRight,
  FileText,
  BadgeCheck,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useLocale } from "@/components/providers/LocaleProvider";
import { LocaleSelector } from "@/components/ui/LocaleSelector";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { AuthBrandingSide } from "@/components/auth/AuthBrandingSide";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState("");

  // Auto-populate email or error from query string if supplied
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const emailParam = urlParams.get("email");
      if (emailParam) {
        setEmail(emailParam);
      }
      const errorParam = urlParams.get("error");
      if (errorParam) {
        setError(errorParam);
      }
    }
  }, []);

  // If already authenticated, redirect immediately
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("logged_out")) {
      localStorage.removeItem("landintel_user");
      localStorage.removeItem("landintel_token");
      localStorage.removeItem("diasporaland_user");
      localStorage.removeItem("diasporaland_token");
      return;
    }

    const savedUserStr = typeof window !== "undefined" ? localStorage.getItem("landintel_user") : null;
    if (savedUserStr) {
      try {
        const u = JSON.parse(savedUserStr);
        if (u && u.id) {
          router.replace(u.role === "ADMIN" || u.role === "SUPER_ADMIN" ? "/admin" : "/dashboard");
          return;
        }
      } catch {}
    }

    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.user) {
          router.replace(data.user.role === "ADMIN" || data.user.role === "SUPER_ADMIN" ? "/admin" : "/dashboard");
        }
      })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          mfaCode: requiresMfa ? mfaCode.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (data.requiresMfa && !data.token) {
        setRequiresMfa(true);
        setLoading(false);
        toast(data.message || "Please enter your 2FA code to continue.", "info");
        return;
      }

      if (!res.ok) {
        if (data.requiresVerification) {
          toast("Please verify your email address to continue.", "info");
          router.push(`/verify-email?email=${encodeURIComponent(data.email || email.trim().toLowerCase())}`);
          return;
        }
        setError(data.error || "Authentication failed. Please check your credentials.");
        setLoading(false);
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        return;
      }

      if (typeof window !== "undefined") {
        if (data.token) {
          localStorage.setItem("landintel_token", data.token);
        }
        if (data.user) {
          localStorage.setItem("landintel_user", JSON.stringify(data.user));
        }
      }

      toast("Signed in successfully", "success");

      if (data.user?.role === "ADMIN" || data.user?.role === "SUPER_ADMIN") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/dashboard";
      }
    } catch {
      setError("An unexpected network error occurred. Please verify your connection.");
      setLoading(false);
    }
  };

  const fillCredentials = (userEmail: string, userPass: string): void => {
    setEmail(userEmail);
    setPassword(userPass);
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row font-sans selection:bg-brand-blue/30 selection:text-blue-200">
      <AuthBrandingSide />

      {/* ============================================================ */}
      {/* 2. RIGHT LOGIN FORM (High Contrast & Clear)                  */}
      {/* ============================================================ */}
      <main className="w-full lg:w-1/2 xl:w-7/12 bg-white flex flex-col justify-center py-12 px-6 sm:px-12 xl:px-20 relative">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
          <LocaleSelector variant="light" compact />
        </div>

        <div className="max-w-md w-full mx-auto space-y-6">
          {/* Mobile Header */}
          <div className="lg:hidden text-center space-y-2 pb-2">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-brand-blue flex items-center justify-center font-black text-white text-base">
                L
              </div>
              <span className="font-heading font-extrabold text-xl text-brand-darkNavy">
                LandIntel
              </span>
            </Link>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
              Sign in to your account
            </h1>
            <p className="text-sm text-slate-600">
              New to LandIntel?{" "}
              <Link href={`/register${email ? `?email=${encodeURIComponent(email)}` : ""}`} className="font-bold text-brand-blue hover:underline">
                Create an account &rarr;
              </Link>
            </p>
          </div>


          {error && (
            <div className="space-y-2">
              <ErrorAlert
                title="Sign-in Notice"
                message={error}
                severity="error"
                actionLabel={error.includes("No account") ? "Create account with this email" : undefined}
                onAction={
                  error.includes("No account")
                    ? () => router.push(`/register?email=${encodeURIComponent(email)}`)
                    : undefined
                }
                onDismiss={() => setError("")}
              />
              {(error.includes("password") || error.includes("credentials")) && (
                <div className="text-right">
                  <Link
                    href={`/forgot-password?email=${encodeURIComponent(email)}`}
                    className="text-xs font-bold text-brand-blue hover:underline inline-flex items-center gap-1"
                  >
                    <span>{t("resetYourPassword") || "Reset your password"}</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {requiresMfa ? (
            /* 2FA TOTP & Recovery Code Challenge Form */
            <form onSubmit={handleSubmit} className="space-y-5 p-6 bg-slate-50 border border-brand-border rounded-xl">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 font-heading">
                    Two-Factor Authentication
                  </h2>
                  <p className="text-xs text-slate-500">
                    Signing in as <strong>{email}</strong>
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Enter the 6-digit TOTP code generated by your authenticator app (Google Authenticator, Microsoft Authenticator, etc.) or enter an 8-character backup recovery code.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Authenticator Code or Backup Code
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder="000000 or BACKUP-CODE"
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-center font-mono font-bold tracking-widest text-base focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all text-slate-900 placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal placeholder:text-xs"
                />
              </div>

              <div className="space-y-2 pt-1">
                <Button
                  variant="primary"
                  size="lg"
                  type="submit"
                  isLoading={loading}
                  disabled={!mfaCode.trim()}
                  className="w-full shadow-md font-extrabold text-sm py-3"
                >
                  {loading ? "Verifying..." : "Verify & Sign In"}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setRequiresMfa(false);
                    setMfaCode("");
                    setError("");
                  }}
                  className="w-full text-xs text-slate-500 hover:text-slate-800 font-semibold py-1.5 text-center cursor-pointer transition-colors"
                >
                  &larr; Back to password sign-in
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Google One-Click Login */}
              <div className="space-y-4">
                <GoogleAuthButton mode="login" />

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                    Or sign in with email
                  </span>
                  <div className="border-t border-slate-200 w-full" />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label={t("emailAddress") || "Email Address"}
                  type="email"
                  placeholder="you@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <Input
                  label={t("password") || "Password"}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="p-1 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none flex items-center justify-center cursor-pointer"
                      title={showPassword ? "Hide password" : "Show password"}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-brand-blue" />
                    <span>{t("rememberSession") || "Remember session"}</span>
                  </label>
                  <Link href="/forgot-password" className="text-brand-blue font-semibold hover:underline">
                    {t("forgotPassword") || "Forgot password?"}
                  </Link>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  type="submit"
                  isLoading={loading}
                  className="w-full shadow-md font-extrabold text-sm py-3"
                >
                  {loading ? (t("signingIn") || "Signing in...") : "Sign In to Workspace"}
                </Button>
              </form>
            </>
          )}

          {/* Institutional Trust Badges */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Certified Title Registry</span>
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Encrypted Session</span>
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
