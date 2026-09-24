"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
  Clock,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { useLocale } from "@/components/providers/LocaleProvider";
import { LocaleSelector } from "@/components/ui/LocaleSelector";
import { PasswordStrengthMeter, getPasswordStrength } from "@/components/ui/PasswordStrengthMeter";
import { useToast } from "@/components/ui/Toast";

const INITIAL_EXPIRY_SECONDS = 300; // 5 minutes

export default function ForgotPasswordPage() {
  const { t } = useLocale();
  const router = useRouter();
  const { toast } = useToast();

  // Wizard state: 1 = Email, 2 = OTP, 3 = New Password, 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Email
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 2: OTP
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
  const [deliveryNotice, setDeliveryNotice] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [expiryCountdown, setExpiryCountdown] = useState(INITIAL_EXPIRY_SECONDS);
  const [resending, setResending] = useState(false);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Step 3: Password
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Cooldown timer for resending OTP (60s)
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Expiry countdown timer (10 mins)
  useEffect(() => {
    if (step !== 2) return;
    if (expiryCountdown > 0) {
      const timer = setTimeout(() => setExpiryCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, expiryCountdown]);

  // Focus first OTP input when arriving at Step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // -------------------------------------------------------------
  // Step 1: Submit Email to Request OTP
  // -------------------------------------------------------------
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to process request. Please try again.");
        setLoading(false);
        return;
      }

      if (data.devOtpCode) {
        setDevOtpCode(data.devOtpCode);
      }
      if (data.deliveryNotice) {
        setDeliveryNotice(data.deliveryNotice);
      }
      setExpiryCountdown(INITIAL_EXPIRY_SECONDS);
      setResendCooldown(60);
      setStep(2);
      toast(data.message || "Verification code dispatched!", "success");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Step 2: OTP Input Helpers & Verification
  // -------------------------------------------------------------
  const handleOtpChange = (index: number, val: string) => {
    // Only accept numbers
    const clean = val.replace(/\D/g, "");
    if (!clean && val !== "") return;

    // Handle mobile keyboard autofill (e.g. iOS/Android one-time-code suggestion) or multi-digit paste
    if (clean.length > 1) {
      const pasted = clean.slice(0, 6);
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || "";
      }
      setOtpDigits(newDigits);
      setError("");

      const nextIndex = Math.min(pasted.length, 5);
      otpInputsRef.current[nextIndex]?.focus();

      if (pasted.length === 6) {
        handleVerifyOtp(pasted);
      }
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = clean.slice(-1);
    setOtpDigits(newDigits);
    setError("");

    // Auto advance
    if (clean && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Auto submit if all 6 filled
    if (newDigits.every((d) => d !== "") && newDigits.join("").length === 6) {
      handleVerifyOtp(newDigits.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || "";
    }
    setOtpDigits(newDigits);
    setError("");

    const nextIndex = Math.min(pasted.length, 5);
    otpInputsRef.current[nextIndex]?.focus();

    if (pasted.length === 6) {
      handleVerifyOtp(pasted);
    }
  };

  const handleAutoFillDevCode = () => {
    if (!devOtpCode) return;
    const digits = devOtpCode.split("").slice(0, 6);
    setOtpDigits(digits);
    setError("");
    handleVerifyOtp(devOtpCode);
  };

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const fullCode = codeToVerify || otpDigits.join("");
    if (fullCode.length !== 6) {
      setError("Please enter all 6 digits of the verification code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: fullCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid verification code.");
        setLoading(false);
        return;
      }

      setStep(3);
      toast("Code verified! Set your new password.", "success");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to resend code.");
        return;
      }

      if (data.devOtpCode) {
        setDevOtpCode(data.devOtpCode);
      }
      if (data.deliveryNotice) {
        setDeliveryNotice(data.deliveryNotice);
      }
      setExpiryCountdown(INITIAL_EXPIRY_SECONDS);
      setResendCooldown(60);
      setOtpDigits(["", "", "", "", "", ""]);
      setTimeout(() => otpInputsRef.current[0]?.focus(), 50);
      toast("Fresh code sent! Only your latest code is valid.", "success");
    } catch {
      setError("Could not resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  // -------------------------------------------------------------
  // Step 3: Set New Password
  // -------------------------------------------------------------
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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
          email: email.trim().toLowerCase(),
          code: otpDigits.join(""),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to reset password.");
        setLoading(false);
        return;
      }

      setStep(4);
      toast("Password successfully reset! You can now sign in.", "success");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative selection:bg-brand-blue/20">
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

        {step === 1 && (
          <>
            <h2 className="text-xl font-bold font-heading text-brand-textPrimary">
              {t("resetYourPassword") || "Reset your password"}
            </h2>
            <p className="text-xs text-brand-textSecondary max-w-sm mx-auto">
              Enter your account email to receive a secure 6-digit verification code.
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-xl font-bold font-heading text-brand-textPrimary">
              Enter Verification Code
            </h2>
            <p className="text-xs text-brand-textSecondary max-w-sm mx-auto">
              We sent a 6-digit security code to <strong className="text-brand-textPrimary">{email}</strong>
            </p>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-xl font-bold font-heading text-brand-textPrimary">
              Create New Password
            </h2>
            <p className="text-xs text-brand-textSecondary max-w-sm mx-auto">
              Choose a strong, secure password for your LandIntel account.
            </p>
          </>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-5 sm:p-8 shadow-card space-y-5">
          {error && (
            <ErrorAlert
              title="Notice"
              message={error}
              severity="error"
              onDismiss={() => setError("")}
            />
          )}

          {/* ======================================================== */}
          {/* STEP 1: Enter Email                                      */}
          {/* ======================================================== */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <Input
                label={t("emailAddress") || "Email Address"}
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />

              <Button
                variant="primary"
                size="md"
                type="submit"
                isLoading={loading}
                className="w-full"
              >
                Send Verification Code
              </Button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="text-xs text-brand-textSecondary hover:text-brand-textPrimary flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>{t("backToLogin") || "Return to login"}</span>
                </Link>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* STEP 2: Enter 6-digit OTP                                */}
          {/* ======================================================== */}
          {step === 2 && (
            <div className="space-y-5 text-center">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-brand-blue flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>

              {/* 6 Input Boxes - responsive across all devices (phones down to 320px, tablets, laptops) */}
              <div className="flex justify-center gap-1.5 sm:gap-2.5 max-w-full">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpInputsRef.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    pattern="[0-9]*"
                    maxLength={index === 0 ? 6 : 1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-2xl font-black rounded-lg border-2 border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all text-brand-darkNavy bg-white shadow-xs"
                    aria-label={`Digit ${index + 1}`}
                  />
                ))}
              </div>

              {/* Countdown & Expiry */}
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Code expires in:</span>
                <span className={`font-mono font-bold ${expiryCountdown < 60 ? "text-red-600 animate-pulse" : "text-brand-darkNavy"}`}>
                  {formatTime(expiryCountdown)}
                </span>
              </div>

              {/* Local Dev Sandbox Helper */}
              {devOtpCode && (
                <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-lg text-left space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-blue-600" />
                      Testing Sandbox Code
                    </span>
                    <span className="font-mono font-bold text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      {devOtpCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoFillDevCode}
                    className="text-[11px] text-blue-700 hover:text-blue-950 font-semibold underline cursor-pointer"
                  >
                    Click to auto-fill sandbox code &rarr;
                  </button>
                  {deliveryNotice && (
                    <p className="text-[10px] text-blue-900/80 pt-1 border-t border-blue-200/60 leading-tight">
                      <strong>Delivery Notice:</strong> Resend is using test domain (<code>onboarding@resend.dev</code>), which restricts live dispatch to non-owner inboxes until custom domain is verified. Use the code above to test.
                    </p>
                  )}
                </div>
              )}

              <Button
                variant="primary"
                size="md"
                type="button"
                onClick={() => handleVerifyOtp()}
                isLoading={loading}
                disabled={otpDigits.some((d) => d === "")}
                className="w-full"
              >
                Verify Code
              </Button>

              {/* Resend and Edit Email */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError("");
                  }}
                  className="text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Change email
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || resending}
                  className={`inline-flex items-center gap-1 font-semibold ${
                    resendCooldown > 0
                      ? "text-slate-400 cursor-not-allowed"
                      : "text-brand-blue hover:text-brand-darkNavy cursor-pointer"
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${resending ? "animate-spin" : ""}`} />
                  <span>{resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend code"}</span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 3: Set New Password                                 */}
          {/* ======================================================== */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <Input
                  label="New Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
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
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs text-brand-textSecondary hover:text-brand-textPrimary inline-flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Back to verification code</span>
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* STEP 4: Success Screen                                   */}
          {/* ======================================================== */}
          {step === 4 && (
            <div className="text-center space-y-4 py-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-brand-textPrimary">
                Password Successfully Reset
              </h3>
              <p className="text-xs text-brand-textSecondary leading-relaxed">
                Your credentials have been updated. Any previously active sessions have been revoked for your security.
              </p>
              <div className="pt-2">
                <Link href="/login" className="w-full inline-block">
                  <Button variant="primary" size="md" className="w-full">
                    Proceed to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
