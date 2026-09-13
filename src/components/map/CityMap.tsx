"use client";

import { cn } from "@/lib/cn";

export type MapMode = "idle" | "route" | "searching";

type CityMapProps = {
  className?: string;
  mode?: MapMode;
  pickupLabel?: string | null;
  dropoffLabel?: string | null;
};

function pinFromLabel(label: string, salt: number) {
  let h = salt;
  for (const ch of label) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
  return {
    x: 72 + (h % 230),
    y: 160 + ((h >> 8) % 260),
  };
}

function routePath(a: { x: number; y: number }, b: { x: number; y: number }) {
  const mx = (a.x + b.x) / 2;
  return `M${a.x} ${a.y} C ${mx} ${a.y - 44}, ${mx} ${b.y + 44}, ${b.x} ${b.y}`;
}

function BikeMark({ heading = 0 }: { heading?: number }) {
  return (
    <g filter="url(#kb-bike-shadow)">
      <circle r="9.5" fill="#FAFAF7" />
      <circle r="8.2" fill="#F5A623" />
      <g
        transform={`rotate(${heading}) scale(0.42)`}
        fill="none"
        stroke="#1A1A16"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="-7.2" cy="5.4" r="4.3" />
        <circle cx="8.2" cy="5.4" r="4.3" />
        <path d="M-7.2 5.4 H1.2 L4.2 -1.6 H10.2 M1.2 5.4 L-2.4 -2.2 H-8.4 M4.2 -1.6 L2.4 -7.2" />
        <path d="M10.2 -1.6 V-4.4" />
      </g>
    </g>
  );
}

const NEARBY_BIKES = [
  { x: 118, y: 198, heading: -18 },
  { x: 252, y: 156, heading: 22 },
  { x: 196, y: 268, heading: 8 },
  { x: 64, y: 292, heading: -28 },
  { x: 308, y: 232, heading: 14 },
];

export function CityMap({
  className,
  mode = "idle",
  pickupLabel,
  dropoffLabel,
}: CityMapProps) {
  const pickup = pickupLabel ? pinFromLabel(pickupLabel, 17) : null;
  const dropoff = dropoffLabel ? pinFromLabel(dropoffLabel, 91) : null;
  const user = { x: 176, y: 368 };
  const showRoute = Boolean(pickup && dropoff);
  const searching = mode === "searching";
  const showBikes = mode === "idle" || mode === "searching";
  const d = pickup && dropoff ? routePath(pickup, dropoff) : "";

  return (
    <div className={cn("relative overflow-hidden bg-[#E4DFD4]", className)}>
      <svg
        viewBox="0 0 390 760"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <linearGradient id="kb-water" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#C5D5E3" />
            <stop offset="100%" stopColor="#AFC6D8" />
          </linearGradient>
          <filter id="kb-bike-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1.6" stdDeviation="1.4" floodOpacity="0.28" />
          </filter>
        </defs>

        <rect width="390" height="760" fill="#E4DFD4" />

        <path
          d="M268 0 C300 90 250 160 280 240 C310 330 360 380 390 420 L390 0 Z"
          fill="url(#kb-water)"
          opacity="0.9"
        />
        <path
          d="M300 520 C330 560 350 620 390 640 L390 760 L250 760 C260 680 280 600 300 520 Z"
          fill="url(#kb-water)"
          opacity="0.75"
        />

        <rect x="228" y="36" width="128" height="118" rx="18" fill="#C9D7C4" />
        <rect x="28" y="248" width="92" height="70" rx="14" fill="#CDD8C8" />
        <rect x="248" y="430" width="78" height="58" rx="12" fill="#D0D9CB" />

        <g opacity="0.55" fill="#D2CCC0">
          <rect x="48" y="92" width="46" height="34" rx="4" />
          <rect x="102" y="80" width="38" height="48" rx="4" />
          <rect x="58" y="168" width="52" height="28" rx="4" />
          <rect x="148" y="140" width="44" height="40" rx="4" />
          <rect x="40" y="430" width="40" height="36" rx="4" />
          <rect x="96" y="448" width="56" height="30" rx="4" />
          <rect x="168" y="500" width="48" height="38" rx="4" />
          <rect x="52" y="560" width="62" height="42" rx="4" />
          <rect x="210" y="560" width="40" height="50" rx="4" />
          <rect x="270" y="620" width="54" height="36" rx="4" />
        </g>

        <g fill="none" stroke="#F7F4EE" strokeLinecap="round">
          <path d="M0 188 H390" strokeWidth="18" />
          <path d="M0 318 H390" strokeWidth="14" />
          <path d="M0 468 H310" strokeWidth="16" />
          <path d="M0 598 H390" strokeWidth="12" />
          <path d="M86 0 V760" strokeWidth="14" />
          <path d="M176 0 V760" strokeWidth="22" />
          <path d="M268 0 V510" strokeWidth="13" />
          <path d="M12 80 C120 110 200 70 390 120" strokeWidth="10" />
          <path d="M0 400 C80 360 160 430 390 380" strokeWidth="20" />
          <path d="M40 700 C140 640 240 720 390 680" strokeWidth="11" />
        </g>

        <g fill="none" stroke="#E8E2D6" strokeWidth="3" strokeLinecap="round">
          <path d="M0 188 H390" />
          <path d="M176 0 V760" />
          <path d="M0 400 C80 360 160 430 390 380" />
        </g>

        <g fill="#6B6458" fontFamily="var(--font-sans)" fontWeight="600">
          <text x="184" y="178" fontSize="10" opacity="0.55">
            Herbert Macaulay
          </text>
          <text x="36" y="308" fontSize="10" opacity="0.5">
            Tejuosho
          </text>
          <text x="236" y="92" fontSize="10" opacity="0.55">
            Unilag
          </text>
          <text x="94" y="454" fontSize="10" opacity="0.5">
            Sabo
          </text>
          <text x="40" y="588" fontSize="10" opacity="0.45">
            Yabatech
          </text>
        </g>

        {showBikes
          ? NEARBY_BIKES.map((r) => (
            <g key={`${r.x}-${r.y}`} transform={`translate(${r.x} ${r.y})`}>
              <g className="kb-bike-mark">
                <BikeMark heading={r.heading} />
              </g>
            </g>
          ))
          : null}

        {showRoute ? (
          <path
            key={d}
            className="kb-route-draw"
            d={d}
            fill="none"
            stroke="#F5A623"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        ) : null}

        {searching && pickup ? (
          <g>
            <circle
              className="kb-search-ring"
              cx={pickup.x}
              cy={pickup.y}
              r="28"
              fill="#F5A623"
              opacity="0.22"
            />
            <circle
              className="kb-search-ring"
              cx={pickup.x}
              cy={pickup.y}
              r="28"
              fill="#F5A623"
              opacity="0.18"
              style={{ animationDelay: "0.8s" }}
            />
          </g>
        ) : null}

        {pickup ? (
          <g className="kb-pin-drop">
            <circle cx={pickup.x} cy={pickup.y} r="9" fill="#0F3D2E" />
            <circle cx={pickup.x} cy={pickup.y} r="3.4" fill="#FAFAF7" />
          </g>
        ) : null}

        {dropoff ? (
          <g className="kb-pin-drop" style={{ animationDelay: "90ms" }}>
            <rect
              x={dropoff.x - 8}
              y={dropoff.y - 8}
              width="16"
              height="16"
              rx="3"
              fill="#0F3D2E"
            />
            <circle cx={dropoff.x} cy={dropoff.y} r="2.8" fill="#FAFAF7" />
          </g>
        ) : null}

        {!searching ? (
          <g>
            <circle
              cx={user.x}
              cy={user.y}
              r="18"
              fill="#2E7D5B"
              opacity="0.18"
              className="kb-loc-ring"
            />
            <circle cx={user.x} cy={user.y} r="8" fill="white" />
            <circle cx={user.x} cy={user.y} r="5.5" fill="#0F3D2E" />
          </g>
        ) : null}
      </svg>
    </div>
  );
}
