"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2, ArrowRight, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { useLocale } from "@/components/providers/LocaleProvider";
import { LocaleSelector } from "@/components/ui/LocaleSelector";

export default function ForgotPasswordPage() {
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [simulatedUrl, setSimulatedUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to process request");
        setLoading(false);
        return;
      }

      setSubmitted(true);
      if (data.simulatedResetUrl) {
        setSimulatedUrl(data.simulatedResetUrl);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
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
          {t("resetYourPassword") || "Reset your password"}
        </h2>
        <p className="text-xs text-brand-textSecondary">
          Enter your account email to receive secure recovery credentials.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-8 shadow-card space-y-5">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-brand-textPrimary">Instructions Dispatched</h3>
              <p className="text-xs text-brand-textSecondary leading-relaxed">
                If an account exists for <strong>{email}</strong>, a secure password recovery token has been generated.
              </p>

              {simulatedUrl && (
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-left space-y-2">
                  <div className="flex items-center gap-1.5 text-blue-900 font-bold text-[11px] uppercase tracking-wider">
                    <span>Direct Testing Sandbox</span>
                  </div>
                  <p className="text-[11px] text-blue-800 leading-normal">
                    Since you are running locally without an external mail provider, you can open the reset link immediately:
                  </p>
                  <Link
                    href={simulatedUrl}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 underline"
                  >
                    <span>Click Here to Reset Password Now</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}

              <div className="pt-2 flex flex-col gap-2">
                <Link href="/login">
                  <Button variant="outline" size="sm" className="w-full">
                    {t("backToLogin") || "Back to Sign In"}
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <ErrorAlert
                  title="Password Recovery Error"
                  message={error}
                  code="RECOVERY_ERR"
                  severity="error"
                  onDismiss={() => setError("")}
                />
              )}

              <Input
                label={t("emailAddress") || "Email Address"}
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button variant="primary" size="md" type="submit" isLoading={loading} className="w-full">
                {t("sendResetLink") || "Send Password Reset Link"}
              </Button>

              <div className="text-center pt-2">
                <Link href="/login" className="text-xs text-brand-textSecondary hover:text-brand-textPrimary flex items-center justify-center gap-1">
                  <ArrowLeft className="w-3 h-3" />
                  <span>{t("backToLogin") || "Return to login"}</span>
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
