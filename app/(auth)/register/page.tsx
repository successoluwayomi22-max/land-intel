"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/Card";
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
    <div className="min-h-screen bg-brand-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <LocaleSelector variant="light" compact />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-brand-blue flex items-center justify-center font-black text-white shadow-subtle text-base">
            L
          </div>
          <div className="text-left">
            <span className="font-heading font-extrabold text-xl tracking-tight text-brand-darkNavy block">
              LandIntel
            </span>
          </div>
        </Link>
        <h2 className="text-xl font-bold font-heading text-brand-textPrimary">
          {t("createFreeInvestorAccount") || "Create your free investor account"}
        </h2>
        <p className="text-xs text-brand-textSecondary">
          {t("alreadyHaveAccount") || "Already have an account?"}{" "}
          <Link href="/login" className="font-semibold text-brand-blue hover:underline">
            {t("logIn") || "Sign in"}
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-8 shadow-card space-y-5">
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
                Or register with email
              </span>
              <div className="border-t border-slate-200 w-full" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t("fullName") || "Full Name"}
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
                placeholder="Create a strong password"
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
              label={t("confirmPassword") || "Confirm Password"}
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Repeat password"
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

            <label className="flex items-start gap-2 text-xs text-brand-textSecondary cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-brand-blue"
              />
              <span>
                I agree to the{" "}
                <Link href="/terms" target="_blank" className="text-brand-blue hover:underline">
                  {t("termsOfService") || "Terms of Service"}
                </Link>{" "}
                and acknowledge the{" "}
                <Link href="/privacy" target="_blank" className="text-brand-blue hover:underline">
                  {t("privacyPolicy") || "Privacy Policy"}
                </Link>.
              </span>
            </label>

            {/* reCAPTCHA Bot Protection */}
            <div className="pt-1 flex justify-center">
              <ReCaptcha onVerify={(token) => setCaptchaToken(token)} />
            </div>

            <Button variant="primary" size="md" type="submit" isLoading={loading} className="w-full">
              {loading ? (t("creatingAccount") || "Creating account...") : (t("register") || "Create Account")}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
