import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFFFFF",
          borderRadius: "8px",
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 32 32"
          fill="none"
        >
          {/* Wireframe Grid Base */}
          <path d="M16 19L27 24L16 29L5 24Z" fill="#F1F5F9" stroke="#334155" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M16 19V29" stroke="#64748B" strokeWidth="0.9" strokeDasharray="1.5 1.5" />
          <path d="M10 21.5L22 26.5" stroke="#475569" strokeWidth="0.9" />
          <path d="M22 21.5L10 26.5" stroke="#475569" strokeWidth="0.9" />

          {/* Dual-tone 3D Pin */}
          <path d="M16 3C11.5 3 8 6.5 8 11C8 15.5 14 21 16 23V3Z" fill="#059669" />
          <path d="M16 3V23C18 21 24 15.5 24 11C24 6.5 20.5 3 16 3Z" fill="#D97706" />

          {/* Center Core */}
          <circle cx="16" cy="11" r="4.2" fill="#FFFFFF" />
          <circle cx="16" cy="11" r="2.8" fill="#047857" />
          <circle cx="15.2" cy="10.2" r="0.8" fill="#FFFFFF" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
