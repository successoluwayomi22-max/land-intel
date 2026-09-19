"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/Card";
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
      // User explicitly requested logout: clean any lingering storage and stay on login
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
    <div className="min-h-screen bg-brand-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <LocaleSelector variant="light" compact />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2.5 justify-center mb-2">
          <div className="w-10 h-10 rounded-xl bg-brand-darkNavy flex items-center justify-center font-bold text-white shadow-subtle">
            L
          </div>
          <div className="text-left">
            <span className="font-heading font-extrabold text-xl tracking-tight text-brand-darkNavy block">
              LandIntel
            </span>
          </div>
        </Link>
        <h2 className="text-xl font-bold font-heading text-brand-textPrimary">
          {t("logInToAccount") || "Log in to your account"}
        </h2>
        <p className="text-xs text-brand-textSecondary">
          Or{" "}
          <Link href="/register" className="font-semibold text-brand-blue hover:underline">
            {t("createFreeInvestorAccount") || "create a free investor account"}
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-8 shadow-card space-y-6">
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
              <label className="flex items-center gap-2 text-brand-textSecondary cursor-pointer">
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

            <Button variant="primary" size="md" type="submit" isLoading={loading} className="w-full">
              {loading ? (t("signingIn") || "Signing in...") : (t("logIn") || "Sign In")}
            </Button>
          </form>

          {/* Seed demo quick links for instant testing */}
          <div className="pt-4 border-t border-brand-border text-center space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Quick Demo Logins
            </span>
            <div className="flex flex-col gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  setEmail("investor@diasporaland.ai");
                  setPassword("UserPass123!");
                  setCaptchaToken("recaptcha_demo_verified_investor");
                }}
                className="text-brand-blue hover:underline text-[11px]"
              >
                Free User: investor@diasporaland.ai
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@diasporaland.ai");
                  setPassword("AdminPass123!");
                  setCaptchaToken("recaptcha_demo_verified_admin");
                }}
                className="text-amber-600 hover:underline text-[11px]"
              >
                Admin User: admin@diasporaland.ai
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
