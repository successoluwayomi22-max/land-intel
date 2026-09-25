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
  // Size dimensions
  const sizeMap = {
    sm: { icon: 30, text: "text-base", subText: "text-[7.5px]", gap: "gap-2.5" },
    md: { icon: 40, text: "text-lg", subText: "text-[8.5px]", gap: "gap-3" },
    lg: { icon: 48, text: "text-xl", subText: "text-[9.5px]", gap: "gap-3.5" },
    xl: { icon: 60, text: "text-2xl", subText: "text-[11px]", gap: "gap-4" },
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
    <div className={`inline-flex items-center ${currentSize.gap} group select-none ${href ? "" : className}`}>
      {/* ── Brand Architectural Pin & Cadastral Grid SVG Icon (Concept 5) ── */}
      <div
        className="relative shrink-0 transition-transform duration-300 group-hover:scale-105"
        style={{ width: currentSize.icon, height: currentSize.icon }}
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          <defs>
            <linearGradient id="liPinLeftEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#047857" />
              <stop offset="60%" stopColor="#059669" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>

            <linearGradient id="liPinRightGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>

            <radialGradient id="liCenterSphere" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="40%" stopColor="#059669" />
              <stop offset="100%" stopColor="#064E3B" />
            </radialGradient>

            <filter id="liShadowFilter" x="-20%" y="-10%" width="140%" height="150%">
              <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#0F172A" floodOpacity="0.22" />
            </filter>
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
          <ellipse cx="32" cy="46" rx="4" ry="1.8" fill="#0F172A" fillOpacity="0.3" />

          {/* 3D Dual-Tone Pin */}
          <g filter="url(#liShadowFilter)">
            {/* Left Half (Emerald Green) */}
            <path
              d="M32 7C24.268 7 18 13.268 18 21C18 28.5 28.5 38.5 32 42V7Z"
              fill="url(#liPinLeftEmerald)"
            />

            {/* Right Half (Champagne Gold) */}
            <path
              d="M32 7V42C35.5 38.5 46 28.5 46 21C46 13.268 39.732 7 32 7Z"
              fill="url(#liPinRightGold)"
            />

            {/* Center Outer Rim */}
            <circle cx="32" cy="21" r="7.5" fill="#FFFFFF" />

            {/* Central Floating Sphere */}
            <circle cx="32" cy="21" r="4.8" fill="url(#liCenterSphere)" />
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
        className={`inline-flex items-center shrink-0 min-w-0 focus:outline-none ${className}`}
      >
        {content}
      </Link>
    );
  }

  return content;
};

export default LandIntelLogo;
