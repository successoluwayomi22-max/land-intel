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
  Sparkles,
  MapPin,
  FileCheck2,
  Scale,
  Star,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useLocale } from "@/components/providers/LocaleProvider";
import { LocaleSelector } from "@/components/ui/LocaleSelector";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { ReCaptcha } from "@/components/auth/ReCaptcha";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-populate email from query string if supplied (e.g. from register duplicate link)
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const emailParam = urlParams.get("email");
      if (emailParam) {
        setEmail(emailParam);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!captchaToken) {
      setError("Please complete the reCAPTCHA security verification to continue.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          captchaToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed. Check your credentials.");
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
      setError("An unexpected network error occurred. Please retry.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row font-sans selection:bg-brand-blue/30 selection:text-blue-200">
      {/* ============================================================ */}
      {/* 1. LEFT BRANDING & SECURITY SHOWCASE (Split Screen)          */}
      {/* ============================================================ */}
      <aside className="hidden lg:flex lg:w-1/2 xl:w-5/12 bg-gradient-to-br from-[#060C1B] via-[#091326] to-[#0A1832] border-r border-slate-800/80 p-10 xl:p-14 flex-col justify-between relative overflow-hidden text-slate-100">
        {/* Glow Effects */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-blue/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 space-y-6">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20 text-lg">
              L
            </div>
            <div>
              <span className="font-heading font-extrabold text-2xl tracking-tight text-white block">
                LandIntel
              </span>
              <span className="text-[10px] tracking-widest text-emerald-400 font-mono font-bold uppercase block">
                Investor Portal Access
              </span>
            </div>
          </Link>

          <div className="space-y-3 pt-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Institutional Due-Diligence Cockpit</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold font-heading text-white tracking-tight leading-tight">
              Welcome back to your land due-diligence workspace.
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed max-w-lg">
              Access your active cadastral property cases, certified 15-section title reports, and beacon coordinate radar.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-3.5 backdrop-blur-sm max-w-md">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
              <span className="font-mono text-slate-300 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Encrypted Session Vault</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold">
                TLS 1.3 SECURE
              </span>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span>Active Title Audits</span>
                <span className="font-mono font-bold text-white">Live Monitoring</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Certified PDF Reports</span>
                <span className="font-mono font-bold text-emerald-400">Cryptographically Sealed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Metrics */}
        <div className="relative z-10 pt-8 border-t border-slate-800/80 space-y-4">
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Private Document Isolation</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-slate-400" />
              <span>Nigerian Land Law Grounded</span>
            </span>
          </div>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* 2. RIGHT LOGIN FORM (Clean, High Contrast)                   */}
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
            <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
              Sign in to your account
            </h2>
            <p className="text-sm text-slate-600">
              Or{" "}
              <Link href="/register" className="font-bold text-brand-blue hover:underline">
                create a free investor account &rarr;
              </Link>
            </p>
          </div>

          {error && (
            <div className="space-y-2">
              <ErrorAlert
                title="Authentication Failed"
                message={error}
                code="AUTH_401"
                severity="error"
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

            {/* reCAPTCHA Bot Protection */}
            <div className="pt-1 flex justify-center">
              <ReCaptcha onVerify={(token) => setCaptchaToken(token)} />
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

          {/* Institutional Trust Badges */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Certified Title Vault</span>
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
