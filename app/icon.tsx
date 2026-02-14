import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Image generation
export default function Icon() {
  return new ImageResponse(
    // ImageResponse JSX element
    <div
      style={{
        fontSize: 24,
        background: "linear-gradient(135deg, #6366f1, #a855f7)",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        borderRadius: "10px", // Matches --radius-md
      }}
    >
      {/* Lucide Package icon SVG */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Path 1: Box shape */}
        <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
        {/* Path 2: Center vertical line */}
        <path d="M12 22V12" />
        {/* Path 3: Top inner lines (polyline converted to path for simplicity or kept as polyline) */}
        <polyline points="3.29 7 12 12 20.71 7" />
        {/* Path 4: Diagonal internal line */}
        <path d="m7.5 4.27 9 5.15" />
      </svg>
    </div>,
    // ImageResponse options
    {
      ...size,
    },
  );
}
