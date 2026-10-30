import { ImageResponse } from "next/og";

export const alt = "Devis Agent, sourced quotes from a one-line request";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TRACE = [
  { label: "Nemotron · plan", text: "Decides what to look up" },
  { label: "Tavily · web search", text: "\"automation freelancer hourly rate France 2026\"" },
  { label: "Nemotron · draft", text: "Scope written, sources cited" },
  { label: "Pricing", text: "Hours times rate, computed in code" },
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f5f1e8",
          color: "#1d1b16",
          padding: "64px 72px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 600 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 34, fontWeight: 700 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: "#a8461f",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 30,
              }}
            >
              D
            </div>
            Devis Agent
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontSize: 60, lineHeight: 1.05, letterSpacing: -1.5 }}>
              From a one-line request to a sourced, priced quote.
            </div>
            <div style={{ fontSize: 24, color: "#57524a", fontFamily: "sans-serif" }}>
              NVIDIA Nemotron on Nebius Token Factory, live research by Tavily.
            </div>
          </div>
        </div>
        <div
          style={{
            marginLeft: 56,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 22,
            padding: "36px 32px",
            borderRadius: 24,
            background: "#fffdf8",
            border: "2px solid #e2dacb",
            fontFamily: "sans-serif",
          }}
        >
          {TRACE.map((step) => (
            <div key={step.label} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ width: 20, height: 20, marginTop: 4, borderRadius: 10, background: "#2e6b45" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ fontSize: 15, letterSpacing: 1.5, textTransform: "uppercase", color: "#6e685d" }}>
                  {step.label}
                </div>
                <div style={{ fontSize: 21, fontWeight: 600 }}>{step.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
