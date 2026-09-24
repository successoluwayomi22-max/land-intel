import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0B132B 0%, #070D18 100%)",
          borderRadius: "38px",
          border: "2px solid rgba(255,255,255,0.1)",
        }}
      >
        <svg
          width="130"
          height="130"
          viewBox="0 0 64 64"
          fill="none"
        >
          {/* Architectural Cadastral Wireframe Grid */}
          <path
            d="M32 37L55 47L32 57L9 47Z"
            fill="#0F172A"
            stroke="#475569"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M32 37V57" stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
          <path d="M20.5 42L43.5 52" stroke="#475569" strokeWidth="1.2" />
          <path d="M43.5 42L20.5 52" stroke="#475569" strokeWidth="1.2" />

          {/* Crosshairs */}
          <path d="M9 44V50M6 47H12" stroke="#10B981" strokeWidth="1.5" />
          <path d="M55 44V50M52 47H58" stroke="#F59E0B" strokeWidth="1.5" />
          <path d="M32 54V60M29 57H35" stroke="#10B981" strokeWidth="1.5" />

          {/* Dual-Tone 3D Pin */}
          {/* Left (Emerald) */}
          <path
            d="M32 7C24.268 7 18 13.268 18 21C18 28.5 28.5 38.5 32 42V7Z"
            fill="#059669"
          />
          {/* Right (Gold) */}
          <path
            d="M32 7V42C35.5 38.5 46 28.5 46 21C46 13.268 39.732 7 32 7Z"
            fill="#D97706"
          />

          {/* Center core */}
          <circle cx="32" cy="21" r="7.5" fill="#FFFFFF" />
          <circle cx="32" cy="21" r="4.8" fill="#047857" />
          <circle cx="30.5" cy="19.5" r="1.3" fill="#FFFFFF" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
