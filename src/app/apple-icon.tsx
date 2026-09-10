import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
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
          background: "#0F3D2E",
        }}
      >
        <svg
          width="118"
          height="118"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            cx="6.1"
            cy="17.4"
            r="3.35"
            stroke="#F5A623"
            strokeWidth="2.2"
          />
          <circle
            cx="17.9"
            cy="17.4"
            r="3.35"
            stroke="#F5A623"
            strokeWidth="2.2"
          />
          <path
            d="M4.2 12.2h3.35l2.85-4.35H17.4"
            stroke="#F5A623"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14.2 7.85 16.95 12.2H20.6"
            stroke="#F5A623"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 17.4v-5.2"
            stroke="#F5A623"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
