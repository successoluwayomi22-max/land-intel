"use client";

import React from "react";
import Link from "next/link";

interface LandIntelLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  variant?: "dark" | "light" | "glass";
  iconOnly?: boolean;
  href?: string;
}

export const LandIntelLogo: React.FC<LandIntelLogoProps> = ({
  className = "",
  size = "md",
  showText = true,
  variant = "light",
  iconOnly = false,
  href,
}) => {
  const rawId = React.useId();
  const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
  const leftEmeraldId = `liPinLeft-${safeId}`;
  const rightGoldId = `liPinRight-${safeId}`;
  const centerSphereId = `liSphere-${safeId}`;

  // Responsive size dimensions tailored for mobile and desktop screens
  const sizeMap = {
    sm: {
      iconClass: "w-7 h-7 min-w-[28px] min-h-[28px]",
      text: "text-sm sm:text-base",
      subText: "text-[7px]",
      gap: "gap-2",
    },
    md: {
      iconClass: "w-[34px] h-[34px] min-w-[34px] min-h-[34px] sm:w-10 sm:h-10 sm:min-w-[40px] sm:min-h-[40px]",
      text: "text-[15px] sm:text-lg",
      subText: "text-[8px]",
      gap: "gap-2 sm:gap-2.5",
    },
    lg: {
      iconClass: "w-11 h-11 min-w-[44px] min-h-[44px] sm:w-12 sm:h-12 sm:min-w-[48px] sm:min-h-[48px]",
      text: "text-lg sm:text-xl",
      subText: "text-[9px]",
      gap: "gap-2.5 sm:gap-3",
    },
    xl: {
      iconClass: "w-12 h-12 min-w-[48px] min-h-[48px] sm:w-14 sm:h-14 sm:min-w-[56px] sm:min-h-[56px]",
      text: "text-xl sm:text-2xl",
      subText: "text-[10px]",
      gap: "gap-3 sm:gap-4",
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Variant color definitions
  const isDark = variant === "dark" || variant === "glass";
  const mainTextColor = isDark ? "text-white" : "text-slate-900";
  const accentTextColor = isDark ? "text-emerald-400" : "text-emerald-700";
  const subTextColor = isDark ? "text-slate-400" : "text-slate-500";
  const gridStroke = isDark ? "#475569" : "#334155";
  const gridFill = isDark ? "#0F172A" : "#F8FAFC";

  const content = (
    <div className={`inline-flex items-center shrink-0 ${currentSize.gap} group select-none ${href ? "" : className}`}>
      {/* ── Brand Architectural Pin & Cadastral Grid SVG Icon (Concept 5) ── */}
      <div
        className={`relative shrink-0 transition-transform duration-300 group-hover:scale-105 ${currentSize.iconClass}`}
      >
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm overflow-visible shrink-0"
        >
          <defs>
            <linearGradient id={leftEmeraldId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#047857" />
              <stop offset="60%" stopColor="#059669" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>

            <linearGradient id={rightGoldId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>

            <radialGradient id={centerSphereId} cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="40%" stopColor="#059669" />
              <stop offset="100%" stopColor="#064E3B" />
            </radialGradient>
          </defs>

          {/* Architectural Cadastral Wireframe Grid */}
          <g strokeLinecap="round" strokeLinejoin="round">
            <path
              d="M32 37L55 47L32 57L9 47Z"
              fill={gridFill}
              fillOpacity={isDark ? "0.6" : "0.5"}
              stroke={gridStroke}
              strokeWidth="1.3"
            />
            <path d="M32 37V57" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
            <path d="M20.5 42L43.5 52" stroke={gridStroke} strokeWidth="1.1" />
            <path d="M43.5 42L20.5 52" stroke={gridStroke} strokeWidth="1.1" />
            <path d="M14.5 44.5L26 49.5" stroke="#94A3B8" strokeWidth="0.8" />
            <path d="M49.5 44.5L38 49.5" stroke="#94A3B8" strokeWidth="0.8" />

            {/* Cadastral Crosshairs */}
            <path d="M9 44V50M6 47H12" stroke="#059669" strokeWidth="1.2" />
            <path d="M55 44V50M52 47H58" stroke="#D97706" strokeWidth="1.2" />
            <path d="M32 54V60M29 57H35" stroke="#059669" strokeWidth="1.2" />
          </g>

          {/* Ground Contact Target Shadow */}
          <ellipse cx="32" cy="46" rx="4.5" ry="2" fill="#0F172A" fillOpacity="0.32" />

          {/* 3D Dual-Tone Pin: Always rendered cleanly with fallback fills */}
          <g>
            {/* Left Half (Emerald Green) */}
            <path
              d="M32 7C24.268 7 18 13.268 18 21C18 28.5 28.5 38.5 32 42V7Z"
              fill={`url(#${leftEmeraldId}) #059669`}
            />

            {/* Right Half (Champagne Gold) */}
            <path
              d="M32 7V42C35.5 38.5 46 28.5 46 21C46 13.268 39.732 7 32 7Z"
              fill={`url(#${rightGoldId}) #D97706`}
            />

            {/* Center Outer Rim */}
            <circle cx="32" cy="21" r="7.5" fill="#FFFFFF" />

            {/* Central Floating Sphere */}
            <circle cx="32" cy="21" r="4.8" fill={`url(#${centerSphereId}) #059669`} />
            <circle cx="30.5" cy="19.5" r="1.3" fill="#FFFFFF" fillOpacity="0.85" />
          </g>
        </svg>
      </div>

      {/* ── Brand Typography ── */}
      {showText && !iconOnly && (
        <span
          className={`font-heading font-black tracking-tight whitespace-nowrap ${currentSize.text} ${mainTextColor} transition-colors group-hover:text-emerald-600`}
        >
          LAND <span className={accentTextColor}>INTEL</span>
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label={showText && !iconOnly ? undefined : "LAND INTEL Home"}
        className={`inline-flex items-center shrink-0 focus:outline-none ${className}`}
      >
        {content}
      </Link>
    );
  }

  return content;
};

export default LandIntelLogo;
