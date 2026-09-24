import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "LandIntel | Global Property Due-Diligence & Cadastral Verification";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 80px",
          backgroundColor: "#070D18",
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(16, 185, 129, 0.18) 0%, transparent 45%), radial-gradient(circle at 85% 80%, rgba(14, 165, 233, 0.18) 0%, transparent 45%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle grid pattern overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Top Header / Brand */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                backgroundColor: "#10B981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 24px rgba(16, 185, 129, 0.5)",
              }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "36px", fontWeight: "900", letterSpacing: "-0.5px", color: "#ffffff" }}>
                Land<span style={{ color: "#34D399" }}>Intel</span>
              </span>
              <span style={{ fontSize: "14px", color: "#94A3B8", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                Global Cadastral Intelligence
              </span>
            </div>
          </div>

          <div
            style={{
              padding: "10px 20px",
              borderRadius: "9999px",
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(52, 211, 153, 0.4)",
              color: "#34D399",
              fontSize: "14px",
              fontWeight: "700",
              letterSpacing: "0.5px",
            }}
          >
            Institutional Land Verification
          </div>
        </div>

        {/* Center Main Message */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px", zIndex: 10, maxWidth: "1000px" }}>
          <h1
            style={{
              fontSize: "56px",
              fontWeight: "900",
              lineHeight: 1.15,
              letterSpacing: "-1.5px",
              margin: 0,
              background: "linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 50%, #94A3B8 100%)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Verify Property Titles &amp; Avoid Land Scams Before You Pay.
          </h1>
          <p style={{ fontSize: "22px", color: "#94A3B8", lineHeight: 1.45, margin: 0 }}>
            Automated cadastral audits, beacon coordinate charting, and title certification for real estate investors and diaspora buyers.
          </p>
        </div>

        {/* Bottom Feature Badges & URL */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            paddingTop: "24px",
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", gap: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#F1F5F9", fontSize: "15px", fontWeight: "600" }}>
              <span style={{ color: "#10B981", fontSize: "18px" }}>✓</span> 15-Section Cadastral Audit
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#F1F5F9", fontSize: "15px", fontWeight: "600" }}>
              <span style={{ color: "#10B981", fontSize: "18px" }}>✓</span> Beacon Coordinate Recovery
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#F1F5F9", fontSize: "15px", fontWeight: "600" }}>
              <span style={{ color: "#10B981", fontSize: "18px" }}>✓</span> Lands Registry &amp; C of O Search
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#F1F5F9", fontSize: "15px", fontWeight: "600" }}>
              <span style={{ color: "#10B981", fontSize: "18px" }}>✓</span> AI Legal Counsel
            </div>
          </div>

          <div
            style={{
              fontSize: "16px",
              fontWeight: "700",
              color: "#38BDF8",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            land-intel-omega.vercel.app
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
