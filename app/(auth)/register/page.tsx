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
  Building2,
  TrendingUp,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { PasswordStrengthMeter, getPasswordStrength } from "@/components/ui/PasswordStrengthMeter";
import { useLocale } from "@/components/providers/LocaleProvider";
import { LocaleSelector } from "@/components/ui/LocaleSelector";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { ReCaptcha } from "@/components/auth/ReCaptcha";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

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
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    const strength = getPasswordStrength(password);
    if (!strength.isAcceptable) {
      setError("Password is too weak. Please meet all security requirements: minimum 8 characters with uppercase, lowercase, numbers, and symbols.");
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please ensure both password fields match.");
      return;
    }

    if (!agreeTerms) {
      setError("Please check the box to agree to the Terms of Service and Privacy Policy.");
      return;
    }

    if (!captchaToken) {
      setError("Please complete the reCAPTCHA security verification to continue.");
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
        setError(data.error || "Registration failed. Please try again.");
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

      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row font-sans selection:bg-brand-blue/30 selection:text-blue-200">
      {/* ============================================================ */}
      {/* 1. LEFT BRANDING & VALUE SHOWCASE HERO (Split Screen)        */}
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
                Institutional Due-Diligence
              </span>
            </div>
          </Link>

          <div className="space-y-3 pt-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Zero-Trust Cadastral Verification</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold font-heading text-white tracking-tight leading-tight">
              Protect your land capital before signing or transferring funds.
            </h1>
            <p className="text-sm text-slate-200 leading-relaxed max-w-lg">
              Join thousands of diaspora and institutional investors verifying survey beacons, detecting root-of-title defects, and securing land across global jurisdictions.
            </p>
          </div>

          {/* Interactive Live Verification Card Simulation */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 backdrop-blur-sm max-w-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
              <span className="flex items-center gap-2 font-mono text-slate-200 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Parcel #CAD-METRO-0928</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px] font-bold">
                LOW RISK (12/100)
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Survey Beacons Match Deed</span>
                </span>
                <span className="font-mono text-emerald-400 text-[11px]">100% Match</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Statutory Consent Validated</span>
                </span>
                <span className="font-mono text-emerald-400 text-[11px]">Statutory Approved</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Government Acquisition Check</span>
                </span>
                <span className="font-mono text-emerald-400 text-[11px]">Clear / Unencumbered</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Badges & Social Proof Footer */}
        <div className="relative z-10 pt-8 border-t border-slate-800/80 space-y-5">
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xl font-black text-white font-heading">$3.2M+</div>
              <div className="text-[11px] text-slate-300 font-medium">Property Vetted</div>
            </div>
            <div>
              <div className="text-xl font-black text-white font-heading">Multi-Zone</div>
              <div className="text-[11px] text-slate-300 font-medium">Cadastral Coverage</div>
            </div>
            <div>
              <div className="text-xl font-black text-emerald-400 font-heading">100%</div>
              <div className="text-[11px] text-slate-300 font-medium">Defensible Findings</div>
            </div>
          </div>

          {/* Social Proof Testimonial */}
          <div className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-slate-200 italic leading-relaxed">
              &ldquo;LandIntel uncovered a 3-meter boundary overlap and missing consent on a high-growth parcel before I wired funds from overseas. Saved my family from a nightmare.&rdquo;
            </p>
            <div className="text-[11px] text-slate-400 font-semibold">
              — Dr. B. Olawale • Healthcare Executive & Diaspora Buyer
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-300" />
              <span>AES-256 Encrypted Vault</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
              <span>Zero Document Training</span>
            </span>
          </div>
        </div>
      </aside>

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
            <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
              Create your investor account
            </h2>
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-brand-blue hover:underline">
                Sign in &rarr;
              </Link>
            </p>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="space-y-2">
              <ErrorAlert
                title="Registration Interrupted"
                message={error}
                code="REG_400"
                severity="error"
                onDismiss={() => setError("")}
              />
              {error.includes("already exists") && (
                <div className="flex items-center justify-between text-xs font-bold pt-1">
                  <Link
                    href={`/login?email=${encodeURIComponent(email)}`}
                    className="text-brand-blue hover:underline inline-flex items-center gap-1"
                  >
                    <span>Sign in with {email}</span>
                    <span>&rarr;</span>
                  </Link>
                  <Link
                    href={`/forgot-password?email=${encodeURIComponent(email)}`}
                    className="text-slate-500 hover:text-slate-700 text-[11px]"
                  >
                    {t("forgotPassword") || "Forgot password?"}
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Google One-Click Registration */}
          <div className="space-y-4">
            <GoogleAuthButton mode="signup" />

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                Or register with verified email
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
              label={t("emailAddress") || "Personal or Corporate Email"}
              type="email"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div>
              <Input
                label={t("password") || "Security Passcode"}
                type={showPassword ? "text" : "password"}
                placeholder="Minimum 8 characters"
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
              <PasswordStrengthMeter password={password} />
            </div>

            <Input
              label={t("confirmPassword") || "Confirm Passcode"}
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter passcode"
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
              {loading ? (t("creatingAccount") || "Provisioning Investor Account...") : "Create Free Investor Account"}
            </Button>
          </form>

          {/* Institutional Trust Indicators */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Free Cadastral Scan Included</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-blue-600" />
              <span>Statutory Property Law Grounded</span>
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
