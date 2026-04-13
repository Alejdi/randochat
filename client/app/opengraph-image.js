import { ImageResponse } from "next/og";

export const alt = "RandoChat — random 1-on-1 video chat with strangers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Next 15 auto-wires this as <meta property="og:image"> and (via the
// `twitter: { card: "summary_large_image" }` metadata) Twitter falls back to
// the same asset. Satori-compatible JSX only — every element has an explicit
// display:flex, no CSS variables, no emoji.
export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0f0d0c",
          color: "#f2e9d8",
        }}
      >
        {/* tiny kicker */}
        <div
          style={{
            display: "flex",
            fontSize: 28,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            opacity: 0.55,
            marginBottom: 16,
          }}
        >
          random video chat · 2026
        </div>

        {/* wordmark */}
        <div
          style={{
            display: "flex",
            fontSize: 200,
            fontWeight: 900,
            fontStyle: "italic",
            lineHeight: 0.95,
            letterSpacing: "-0.04em",
          }}
        >
          Rando<span style={{ color: "#ff4d1a" }}>Chat</span>
        </div>

        {/* tagline */}
        <div
          style={{
            display: "flex",
            fontSize: 44,
            marginTop: 28,
            opacity: 0.75,
            fontStyle: "italic",
          }}
        >
          talk to strangers. one tap away.
        </div>

        {/* chunky fake buttons */}
        <div
          style={{
            display: "flex",
            marginTop: 70,
            gap: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "20px 44px",
              background: "#ff4d1a",
              color: "#f2e9d8",
              border: "5px solid #000",
              borderRadius: 10,
              fontSize: 56,
              fontWeight: 700,
              boxShadow: "12px 12px 0 0 #000",
            }}
          >
            start →
          </div>
          <div
            style={{
              display: "flex",
              padding: "20px 44px",
              background: "#f2e9d8",
              color: "#0f0d0c",
              border: "5px solid #000",
              borderRadius: 10,
              fontSize: 56,
              fontWeight: 700,
              boxShadow: "12px 12px 0 0 #000",
            }}
          >
            global
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
