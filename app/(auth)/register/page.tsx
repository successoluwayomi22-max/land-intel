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
import { ReCaptcha } from "@/components/auth/ReCaptcha";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { AuthBrandingSide } from "@/components/auth/AuthBrandingSide";
import { PasswordStrengthMeter, getPasswordStrength } from "@/components/ui/PasswordStrengthMeter";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLocale();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill email or error from query string if available
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

    if (!name.trim()) {
      setError("Please enter your full legal name.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    const strength = getPasswordStrength(password);
    if (!strength.isAcceptable) {
      setError("Please choose a stronger password (must be at least 8 characters with letters and numbers).");
      return;
    }

    const lower = password.toLowerCase();
    if (/^(.)\1+$/.test(password)) {
      setError("Password contains duplicate repeating characters. Please choose a varied combination of letters and numbers.");
      return;
    }

    const emailPrefix = email.split("@")[0].toLowerCase();
    if (emailPrefix.length >= 3 && lower.includes(emailPrefix)) {
      setError("Password cannot contain parts of your email address for account security.");
      return;
    }

    if (password.trim() !== confirmPassword.trim()) {
      setError("Passwords do not match. Please ensure both password fields match.");
      return;
    }

    if (!captchaToken) {
      setError("Please complete the reCAPTCHA 'I am not a robot' security check below.");
      return;
    }

    if (!agreeTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy to create your account.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          captchaToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration could not be completed. Please try again.");
        setLoading(false);
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        return;
      }

      toast("Account registered successfully! Welcome to LandIntel.", "success");
      if (typeof window !== "undefined") {
        if (data.token) {
          localStorage.setItem("landintel_token", data.token);
        }
        if (data.user) {
          localStorage.setItem("landintel_user", JSON.stringify(data.user));
        }
      }

      // If email verification is required, redirect to OTP page
      if (data.requiresVerification) {
        const devParam = data.devOtpCode ? `&devCode=${encodeURIComponent(data.devOtpCode)}` : "";
        router.push(`/verify-email?email=${encodeURIComponent(email)}${devParam}`);
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Network error. Please check your internet connection and try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row font-sans selection:bg-brand-blue/30 selection:text-blue-200">
      <AuthBrandingSide
        quote={{
          text: "LandIntel uncovered a 3-meter boundary overlap and missing statutory consent on a high-growth parcel before I wired funds from overseas. Saved our family from a catastrophic loss.",
          author: "Dr. Funke Adeyemi",
          role: "Diaspora Property Portfolio Owner (Toronto, Canada)",
        }}
      />

      {/* ============================================================ */}
      {/* 2. RIGHT FORM SECTION (Accessible & Clean)                   */}
      {/* ============================================================ */}
      <main className="w-full lg:w-1/2 xl:w-7/12 bg-white flex flex-col justify-center py-12 px-6 sm:px-12 xl:px-20 relative">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
          <LocaleSelector variant="light" compact />
        </div>

        <div className="max-w-md w-full mx-auto space-y-6">
          {/* Mobile Brand Header */}
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
              Create your investor account
            </h1>
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link href={`/login${email ? `?email=${encodeURIComponent(email)}` : ""}`} className="font-bold text-brand-blue hover:underline">
                Sign in &rarr;
              </Link>
            </p>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="space-y-2">
              <ErrorAlert
                title="Registration Notice"
                message={error}
                severity="error"
                actionLabel={error.includes("already exists") ? "Sign in with this email" : undefined}
                onAction={
                  error.includes("already exists")
                    ? () => router.push(`/login?email=${encodeURIComponent(email)}`)
                    : undefined
                }
                onDismiss={() => setError("")}
              />
            </div>
          )}

          {/* Google One-Click Registration */}
          <div className="space-y-4">
            <GoogleAuthButton mode="signup" />

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0">
                Or register with email
              </span>
              <div className="border-t border-slate-200 w-full" />
            </div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t("fullName") || "Full Legal Name"}
              placeholder="e.g. Oluwaseun Adeleke"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label={t("emailAddress") || "Email Address"}
              type="email"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div>
              <Input
                label={t("password") || "Password"}
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
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
              <PasswordStrengthMeter password={password} showRules={true} />
            </div>

            <div>
              <Input
                label={t("confirmPassword") || "Confirm Password"}
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="p-1 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none flex items-center justify-center cursor-pointer"
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
              {confirmPassword.length > 0 && (
                <p
                  className={`text-[11px] font-semibold mt-1 pl-1 flex items-center gap-1 ${
                    password.trim() === confirmPassword.trim()
                      ? "text-emerald-600"
                      : "text-amber-600"
                  }`}
                >
                  {password.trim() === confirmPassword.trim() ? (
                    <span>✓ Passwords match</span>
                  ) : (
                    <span>Passwords do not match yet</span>
                  )}
                </p>
              )}
            </div>

            <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer pt-1 leading-normal">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
              />
              <span>
                I agree to the{" "}
                <Link href="/terms" target="_blank" className="font-semibold text-brand-blue hover:underline">
                  Terms of Service
                </Link>{" "}
                and acknowledge the{" "}
                <Link href="/privacy" target="_blank" className="font-semibold text-brand-blue hover:underline">
                  Privacy Policy
                </Link>.
              </span>
            </label>

            <div className="pt-1 flex justify-center">
              <ReCaptcha
                onVerify={(token) => {
                  setCaptchaToken(token);
                  setError("");
                }}
                onExpire={() => setCaptchaToken("")}
              />
            </div>

            <Button
              variant="primary"
              size="lg"
              type="submit"
              isLoading={loading}
              className="w-full shadow-md font-extrabold text-sm py-3"
            >
              {loading ? (t("creatingAccount") || "Creating account...") : "Create Free Account"}
            </Button>
          </form>

          {/* Institutional Trust Indicators */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Free Initial Scan Included</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-blue-600" />
              <span>Statutory Compliance Checks</span>
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
