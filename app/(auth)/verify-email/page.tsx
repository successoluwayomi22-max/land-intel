"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Mail, RefreshCw, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

const INITIAL_OTP_EXPIRY_SECONDS = 600; // 10 minutes

export default function VerifyEmailPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [expiryCountdown, setExpiryCountdown] = useState(INITIAL_OTP_EXPIRY_SECONDS);
  const [email, setEmail] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Get email and optional devCode from query params or localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const emailParam = urlParams.get("email");
      if (emailParam) {
        setEmail(emailParam);
      } else {
        try {
          const savedUser = localStorage.getItem("landintel_user");
          if (savedUser) {
            const user = JSON.parse(savedUser);
            if (user.email) setEmail(user.email);
          }
        } catch {}
      }

      const devCodeParam = urlParams.get("devCode") || urlParams.get("code");
      if (devCodeParam && devCodeParam.trim().length === 6) {
        setDevCode(devCodeParam.trim());
      }
    }
  }, []);

  // Cooldown timer for resend (60s)
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Live OTP Expiry countdown timer (10 minutes)
  useEffect(() => {
    if (success) return;

    if (expiryCountdown > 0) {
      const timer = setTimeout(() => setExpiryCountdown(expiryCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (expiryCountdown === 0 && !isExpired) {
      setIsExpired(true);
      setError("Your verification code has expired (10-minute limit). Please request a new code below.");
    }
  }, [expiryCountdown, isExpired, success]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // digits only

    const newCode = [...code];
    newCode[index] = value.slice(-1); // only last digit
    setCode(newCode);
    setError("");

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits filled
    if (newCode.every((d) => d !== "") && newCode.join("").length === 6) {
      handleVerify(newCode.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split("");
      setCode(newCode);
      inputRefs.current[5]?.focus();
      handleVerify(pasted);
    }
  };

  const handleVerify = async (otpCode: string) => {
    if (!email) {
      setError("Email address is missing. Please register again.");
      return;
    }
    if (isExpired || expiryCountdown <= 0) {
      setError("This code has expired. Please click 'Resend Code' to receive a fresh code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otpCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 410 || data.expired || data.code === "OTP_EXPIRED") {
          setIsExpired(true);
          setExpiryCountdown(0);
          setError("This verification code has expired. Please click 'Resend Code' to receive a new one.");
        } else {
          setError(data.error || "Verification failed. Please check your code.");
        }
        setLoading(false);
        return;
      }

      setSuccess(true);
      toast("Email verified successfully! Welcome to LandIntel.", "success");

      // Update local storage
      if (data.token) {
        localStorage.setItem("landintel_token", data.token);
      }
      if (data.user) {
        localStorage.setItem("landintel_user", JSON.stringify(data.user));
      }

      // Redirect to dashboard after brief pause
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch {
      setError("Network communication error. Please verify your connection.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    setResending(true);
    setError("");

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not send verification code.");
      } else {
        toast("New 6-digit code sent to your email!", "success");
        if (data.devOtpCode) {
          setDevCode(data.devOtpCode);
        }
        setResendCooldown(60); // 60 second cooldown
        setExpiryCountdown(INITIAL_OTP_EXPIRY_SECONDS); // Reset 10m countdown
        setIsExpired(false);
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.06)_0,transparent_60%)] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-8 py-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-blue/20 border border-brand-blue/30 flex items-center justify-center mx-auto mb-4">
              {success ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              ) : (
                <Mail className="w-7 h-7 text-brand-blue" />
              )}
            </div>
            <h1 className="text-xl font-extrabold font-heading text-white tracking-tight">
              {success ? "Email Verified!" : "Verify Your Email"}
            </h1>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              {success
                ? "Your account is now active. Redirecting..."
                : email
                ? (
                    <>
                      We sent a 6-digit verification code to{" "}
                      <span className="text-white font-semibold">{email}</span>
                    </>
                  )
                : "Enter the 6-digit code sent to your email"}
            </p>
          </div>

          {/* Body */}
          <div className="px-8 py-8">
            {success ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-sm text-slate-600 font-medium">
                  Redirecting to your dashboard...
                </p>
              </div>
            ) : (
              <>
                {/* Expiry Badge Timer */}
                <div className="flex items-center justify-center mb-5">
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                      isExpired
                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                        : expiryCountdown < 120
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-blue-50 text-brand-blue border border-blue-100"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {isExpired ? (
                      <span>Code Expired</span>
                    ) : (
                      <span>Expires in {formatTime(expiryCountdown)}</span>
                    )}
                  </div>
                </div>

                {/* Sandbox Assistance for unverified Resend domain */}
                {devCode && (
                  <div className="mb-5 p-3 rounded-xl bg-blue-50 border border-blue-200 text-left space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[10px] text-blue-900 uppercase tracking-wider">
                        Direct Testing Sandbox Assistance
                      </span>
                      <span className="font-mono font-bold text-xs text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                        {devCode}
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-800 leading-normal">
                      Resend free-tier sandbox relays to brand admin. Click below to verify immediately without checking external email:
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const digits = devCode.split("");
                        setCode(digits);
                        handleVerify(devCode);
                      }}
                      className="w-full text-xs font-bold text-white bg-brand-blue hover:bg-blue-700 py-1.5 px-3 rounded-lg transition-colors cursor-pointer text-center"
                    >
                      Auto-Fill Code ({devCode}) & Verify Now &rarr;
                    </button>
                  </div>
                )}

                {/* OTP Input */}
                <div className="flex justify-center gap-2 sm:gap-3 mb-6">
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        inputRefs.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      onPaste={i === 0 ? handlePaste : undefined}
                      className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-xl border-2 transition-all outline-none
                        ${digit ? "border-brand-blue bg-blue-50/50 text-slate-900" : "border-slate-200 bg-slate-50 text-slate-400"}
                        focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10
                        ${isExpired ? "border-rose-300 bg-rose-50/30 opacity-70" : ""}
                        ${error ? "border-red-300 bg-red-50/30" : ""}
                      `}
                      disabled={loading || isExpired}
                      aria-label={`Digit ${i + 1}`}
                    />
                  ))}
                </div>

                {/* Error / Expiry Notice */}
                {error && (
                  <div className={`mb-4 p-3 rounded-lg border text-center ${
                    isExpired ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-red-50 border-red-200 text-red-700"
                  }`}>
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      {isExpired ? <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" /> : null}
                      <p className="text-sm font-semibold">{error}</p>
                    </div>
                  </div>
                )}

                {/* Verify Button */}
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full font-extrabold text-sm py-3 mb-4"
                  isLoading={loading}
                  onClick={() => handleVerify(code.join(""))}
                  disabled={code.some((d) => !d) || loading || isExpired}
                >
                  {loading ? "Verifying..." : "Verify Email"}
                </Button>

                {/* Resend Actions */}
                <div className="text-center space-y-3">
                  <p className="text-xs text-slate-500">
                    {isExpired ? "Need a fresh verification code?" : "Didn't receive the code?"}
                  </p>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || resending}
                    className={`inline-flex items-center gap-1.5 text-sm font-bold transition-colors cursor-pointer ${
                      isExpired
                        ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-lg border border-emerald-200"
                        : "text-brand-blue hover:text-blue-700 disabled:text-slate-400 disabled:cursor-not-allowed"
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
                    {resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : resending
                      ? "Sending code..."
                      : isExpired
                      ? "Request New 10-Minute Code"
                      : "Resend Code"}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Wrong email?{" "}
              <Link
                href="/register"
                className="font-semibold text-brand-blue hover:underline"
              >
                Register again
              </Link>{" "}
              or{" "}
              <Link
                href="/login"
                className="font-semibold text-brand-blue hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Trust badge */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Encrypted verification · 10-minute security window · LandIntel Title Intelligence</span>
        </div>
      </div>
    </div>
  );
}
