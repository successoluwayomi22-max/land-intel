"use client";

import React from "react";
import { Check, X, Shield, ShieldAlert, ShieldCheck } from "lucide-react";

export interface PasswordRule {
  id: string;
  label: string;
  test: (pw: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (pw) => pw.length >= 8,
  },
  {
    id: "lowercase",
    label: "Contains lowercase letter (a-z)",
    test: (pw) => /[a-z]/.test(pw),
  },
  {
    id: "uppercase",
    label: "Contains uppercase letter (A-Z)",
    test: (pw) => /[A-Z]/.test(pw),
  },
  {
    id: "number",
    label: "Contains a number (0-9)",
    test: (pw) => /[0-9]/.test(pw),
  },
  {
    id: "special",
    label: "Contains special character (!@#$%^&*...)",
    test: (pw) => /[^A-Za-z0-9]/.test(pw),
  },
];

export function getPasswordStrength(password: string): {
  score: number; // 0 to 5
  status: "very-weak" | "weak" | "medium" | "strong" | "very-strong";
  passedCount: number;
  totalCount: number;
  isAcceptable: boolean;
} {
  if (!password) {
    return {
      score: 0,
      status: "very-weak",
      passedCount: 0,
      totalCount: PASSWORD_RULES.length,
      isAcceptable: false,
    };
  }

  const passedCount = PASSWORD_RULES.filter((r) => r.test(password)).length;
  let status: "very-weak" | "weak" | "medium" | "strong" | "very-strong" = "very-weak";

  if (passedCount <= 1) status = "very-weak";
  else if (passedCount === 2) status = "weak";
  else if (passedCount === 3) status = "medium";
  else if (passedCount === 4) status = "strong";
  else status = "very-strong";

  return {
    score: passedCount,
    status,
    passedCount,
    totalCount: PASSWORD_RULES.length,
    isAcceptable: passedCount >= 4 && password.length >= 8,
  };
}

interface PasswordStrengthMeterProps {
  password: string;
  showRules?: boolean;
  className?: string;
}

export function PasswordStrengthMeter({
  password,
  showRules = true,
  className = "",
}: PasswordStrengthMeterProps) {
  if (!password) return null;

  const { score, status, passedCount, totalCount, isAcceptable } = getPasswordStrength(password);

  const getBarColor = (index: number) => {
    if (index >= score) return "bg-slate-200";
    if (score <= 1) return "bg-rose-500";
    if (score === 2) return "bg-amber-500";
    if (score === 3) return "bg-yellow-500";
    if (score === 4) return "bg-emerald-500";
    return "bg-emerald-600";
  };

  const getLabelText = () => {
    switch (status) {
      case "very-weak":
        return { text: "Very Weak", color: "text-rose-600" };
      case "weak":
        return { text: "Weak", color: "text-amber-600" };
      case "medium":
        return { text: "Moderate", color: "text-yellow-600" };
      case "strong":
        return { text: "Strong", color: "text-emerald-600" };
      case "very-strong":
        return { text: "Bank-Grade Security", color: "text-emerald-700" };
    }
  };

  const label = getLabelText();

  return (
    <div className={`space-y-2 pt-1.5 ${className}`}>
      {/* Visual meter bar */}
      <div className="flex items-center justify-between text-[11px] font-semibold">
        <span className="text-slate-500">Password Strength:</span>
        <span className={`font-bold flex items-center gap-1 ${label.color}`}>
          {isAcceptable ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
          )}
          <span>{label.text}</span>
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5 h-1.5 w-full">
        {[0, 1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            className={`h-full rounded-full transition-all duration-300 ${getBarColor(idx)}`}
          />
        ))}
      </div>

      {/* Rules Checklist */}
      {showRules && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1 text-[11px]">
          {PASSWORD_RULES.map((rule) => {
            const passed = rule.test(password);
            return (
              <div
                key={rule.id}
                className={`flex items-center gap-1.5 transition-colors ${
                  passed ? "text-emerald-700 font-medium" : "text-slate-400"
                }`}
              >
                {passed ? (
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-0.5 shrink-0" />
                )}
                <span>{rule.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
