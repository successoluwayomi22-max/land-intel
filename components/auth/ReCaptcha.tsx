"use client";

import React, { useState, useEffect } from "react";

interface ReCaptchaProps {
  onVerify: (token: string) => void;
  className?: string;
}

export const ReCaptcha: React.FC<ReCaptchaProps> = ({ onVerify, className = "" }) => {
  const [isChecked, setIsChecked] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleCheckboxClick = () => {
    if (isChecked || isVerifying) return;

    setIsVerifying(true);
    // Simulate real anti-bot token negotiation
    setTimeout(() => {
      setIsVerifying(false);
      setIsChecked(true);
      const token = `recaptcha_verified_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      onVerify(token);
    }, 650);
  };

  return (
    <div
      className={`inline-flex items-center justify-between bg-[#f9f9f9] border border-[#d3d3d3] rounded-[3px] p-3 w-full max-w-[304px] select-none shadow-[0_0_4px_1px_rgba(0,0,0,0.08)] ${className}`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleCheckboxClick}
          disabled={isChecked || isVerifying}
          className={`w-7 h-7 rounded-[2px] border-2 flex items-center justify-center transition-all cursor-pointer ${
            isChecked
              ? "border-[#009688] bg-[#009688] text-white"
              : isVerifying
              ? "border-[#4285f4] bg-white"
              : "border-[#c1c1c1] bg-white hover:border-[#b2b2b2]"
          }`}
          aria-label="I am not a robot verification checkbox"
        >
          {isVerifying && (
            <div className="w-4 h-4 border-2 border-[#4285f4] border-t-transparent rounded-full animate-spin" />
          )}
          {isChecked && (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        <span
          onClick={handleCheckboxClick}
          className="text-xs font-medium text-[#282727] cursor-pointer"
        >
          I&apos;m not a robot
        </span>
      </div>

      <div className="flex flex-col items-center justify-center pl-2">
        <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none">
          <path
            d="M24 4C12.95 4 4 12.95 4 24C4 35.05 12.95 44 24 44C35.05 44 44 35.05 44 24C44 12.95 35.05 4 24 4Z"
            fill="#1A73E8"
          />
          <path
            d="M34 24C34 18.48 29.52 14 24 14C18.48 14 14 18.48 14 24C14 29.52 18.48 34 24 34C29.52 34 34 29.52 34 24Z"
            fill="white"
          />
          <path
            d="M24 18C20.69 18 18 20.69 18 24C18 27.31 20.69 30 24 30C27.31 30 30 27.31 30 24C30 20.69 27.31 18 24 18Z"
            fill="#1A73E8"
          />
        </svg>
        <span className="text-[9px] text-[#555] font-semibold tracking-tight">reCAPTCHA</span>
        <div className="text-[7px] text-[#555] space-x-1">
          <a
            href="https://www.google.com/intl/en/policies/privacy/"
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
          >
            Privacy
          </a>
          <span>-</span>
          <a
            href="https://www.google.com/intl/en/policies/terms/"
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
          >
            Terms
          </a>
        </div>
      </div>
    </div>
  );
};
