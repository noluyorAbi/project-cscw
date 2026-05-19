import { ImageResponse } from "next/og";

export const alt = "Emotion-Aware Chat — MMI2 SS26 PoC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          backgroundImage:
            "radial-gradient(circle at 88% 12%, #f4f4f5 0%, #ffffff 55%)",
          padding: 80,
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#09090b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 30,
                height: 24,
                borderRadius: 8,
                background: "#fff",
              }}
            />
          </div>
          <div
            style={{
              fontSize: 22,
              letterSpacing: 6,
              color: "#71717a",
            }}
          >
            MMI2 · CSCW · LMU MUNICH
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 88,
              fontWeight: 800,
              color: "#09090b",
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            Emotion-Aware Chat
          </div>
          <div style={{ fontSize: 30, color: "#52525b", maxWidth: 900 }}>
            Every message carries the sender&apos;s facial expression and heart
            rate — a working PoC.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 12, fontSize: 22 }}>
            {["happy", "calm", "neutral", "tense", "sad"].map((e) => (
              <div
                key={e}
                style={{
                  border: "1px solid #d4d4d8",
                  borderRadius: 999,
                  padding: "8px 16px",
                  color: "#3f3f46",
                }}
              >
                {e}
              </div>
            ))}
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#a1a1aa",
              letterSpacing: 2,
            }}
          >
            face-api · rPPG · on-device
          </div>
        </div>
      </div>
    ),
    size,
  );
}
