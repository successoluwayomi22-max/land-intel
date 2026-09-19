"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowLeft, CheckCircle2, ShieldCheck, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { PasswordStrengthMeter, getPasswordStrength } from "@/components/ui/PasswordStrengthMeter";
import { useLocale } from "@/components/providers/LocaleProvider";
import { LocaleSelector } from "@/components/ui/LocaleSelector";
import { ErrorAlert } from "@/components/ui/ErrorAlert";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { t } = useLocale();

  const tokenParam = searchParams?.get("token") || "";
  const emailParam = searchParams?.get("email") || "";

  const [token, setToken] = useState(tokenParam);
  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Reset token is missing. Please click the link in your reset email.");
      return;
    }
    if (!email) {
      setError("Email address is required.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const strength = getPasswordStrength(password);
    if (!strength.isAcceptable) {
      setError("Please choose a stronger password matching the criteria below.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Password reset failed");
        setLoading(false);
        return;
      }

      setSuccess(true);
      toast("Password reset successful! You can now log in.", "success");
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
          {t("resetYourPassword") || "Set New Password"}
        </h2>
        <p className="text-xs text-brand-textSecondary">
          Enter a strong, bank-grade password to secure your property intelligence account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-8 shadow-card space-y-5">
          {success ? (
            <div className="text-center space-y-4 py-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-brand-textPrimary">Password Successfully Reset</h3>
              <p className="text-xs text-brand-textSecondary leading-relaxed">
                Your credentials have been updated. Any previously active sessions have been revoked for your protection.
              </p>
              <div className="pt-2">
                <Link href="/login" className="w-full inline-block">
                  <Button variant="primary" size="md" className="w-full">
                    Proceed to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <ErrorAlert
                  message={error}
                  severity="error"
                  code="AUTH_RESET_FAILED"
                  actionLabel="Request New Link"
                  onAction={() => router.push("/forgot-password")}
                  onDismiss={() => setError("")}
                />
              )}

              {/* Email */}
              <Input
                label="Account Email"
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              {/* Token (if not present in URL) */}
              {!tokenParam && (
                <Input
                  label="Reset Token"
                  placeholder="Paste your 64-character reset token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />
              )}

              {/* New Password */}
              <div>
                <Input
                  label="New Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
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

              {/* Confirm Password */}
              <Input
                label="Confirm New Password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••••••"
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

              <Button
                variant="primary"
                size="md"
                type="submit"
                isLoading={loading}
                className="w-full mt-2"
              >
                Update Password
              </Button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="text-xs text-brand-textSecondary hover:text-brand-textPrimary flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Cancel and return to login</span>
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-background flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-brand-blue border-t-transparent animate-spin" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
