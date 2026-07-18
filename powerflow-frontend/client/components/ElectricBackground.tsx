import { memo } from "react";

function SparkNetwork() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fff1b8" />
          <stop offset="50%" stopColor="#ffbf00" />
          <stop offset="100%" stopColor="#ff8c00" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="c" />
          <feMerge>
            <feMergeNode in="c" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <g id="house">
          <rect
            x="-20"
            y="-10"
            width="40"
            height="28"
            rx="3"
            fill="#101622"
            stroke="#1d2840"
          />
          <polygon
            points="-24,-10 0,-28 24,-10"
            fill="#131b2c"
            stroke="#1d2840"
          />
          <rect x="-8" y="0" width="10" height="10" fill="#0b1220" />
          <rect x="8" y="0" width="10" height="10" fill="#0b1220" />
        </g>
      </defs>

      <g
        filter="url(#glow)"
        stroke="url(#gold)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      >
        <path
          id="wire1"
          d="M80 650 C 300 520, 520 720, 740 620 S 1180 560, 1360 640"
          className="[stroke-dasharray:8_14] animate-spark"
        />
        <path
          id="wire2"
          d="M100 420 C 360 380, 520 300, 780 360 S 1080 420, 1380 360"
          className="[stroke-dasharray:10_18] animate-spark"
        />
        <path
          id="wire3"
          d="M-20 250 C 220 200, 540 220, 820 240 S 1200 220, 1500 210"
          className="[stroke-dasharray:6_12] animate-spark"
        />

        <g transform="translate(200,640)">
          <use href="#house" />
        </g>
        <g transform="translate(720,600)">
          <use href="#house" />
        </g>
        <g transform="translate(1240,640)">
          <use href="#house" />
        </g>

        <g transform="translate(260,360)">
          <use href="#house" />
        </g>
        <g transform="translate(820,340)">
          <use href="#house" />
        </g>
        <g transform="translate(1360,340)">
          <use href="#house" />
        </g>

        <g transform="translate(140,230)">
          <use href="#house" />
        </g>
        <g transform="translate(780,220)">
          <use href="#house" />
        </g>
        <g transform="translate(1420,210)">
          <use href="#house" />
        </g>
      </g>

      <g fill="#ffd76b">
        <circle r="4">
          <animateMotion dur="6s" repeatCount="indefinite" rotate="auto">
            <mpath href="#wire1" />
          </animateMotion>
        </circle>
        <circle r="3">
          <animateMotion
            dur="5s"
            repeatCount="indefinite"
            rotate="auto"
            begin="1s"
          >
            <mpath href="#wire2" />
          </animateMotion>
        </circle>
        <circle r="5">
          <animateMotion
            dur="7s"
            repeatCount="indefinite"
            rotate="auto"
            begin="0.5s"
          >
            <mpath href="#wire3" />
          </animateMotion>
        </circle>
      </g>
    </svg>
  );
}

export const ElectricBackground = memo(function ElectricBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 brand-gradient opacity-70" />
      <SparkNetwork />
    </div>
  );
});
