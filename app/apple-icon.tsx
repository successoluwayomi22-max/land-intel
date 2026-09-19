import { ImageResponse } from "next/og";

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
          fontSize: 108,
          background: "linear-gradient(135deg, #0B1220 0%, #059669 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          borderRadius: "36px",
          fontWeight: 900,
          fontFamily: "sans-serif",
        }}
      >
        L
      </div>
    ),
    {
      ...size,
    }
  );
}
