"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

interface FormFieldErrorProps {
  id?: string;
  error?: string | null;
  className?: string;
}

export function FormFieldError({ id, error, className = "" }: FormFieldErrorProps) {
  if (!error) return null;

  return (
    <div
      id={id}
      role="alert"
      aria-live="polite"
      className={`flex items-center gap-1.5 text-xs text-rose-400 font-medium mt-1.5 animate-fadeIn ${className}`}
    >
      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
      <span>{error}</span>
    </div>
  );
}
