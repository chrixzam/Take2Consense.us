import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

// Consense.us interlocking circular logo with colorful segments
export function Logo({ size = 40, className }: LogoProps) {
  const pixelSize = `${size}px`;
  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Consense.us logo"
      role="img"
      className={className}
    >
      <defs>
        {/* Define the mask for creating interlocking effect */}
        <mask id="centerMask">
          <rect width="100" height="100" fill="white" />
          <circle cx="50" cy="50" r="18" fill="black" />
        </mask>
      </defs>

      {/* Top segment - Orange/Red */}
      <path
        d="M 50 15 A 35 35 0 0 1 75 35 L 60 45 A 20 20 0 0 0 50 30 Z"
        fill="#E74C3C"
        mask="url(#centerMask)"
      />

      {/* Top Right segment - Black */}
      <path
        d="M 75 35 A 35 35 0 0 1 75 65 L 60 55 A 20 20 0 0 0 60 45 Z"
        fill="#2C3E50"
        mask="url(#centerMask)"
      />

      {/* Bottom Right segment - Green */}
      <path
        d="M 75 65 A 35 35 0 0 1 50 85 L 50 70 A 20 20 0 0 0 60 55 Z"
        fill="#27AE60"
        mask="url(#centerMask)"
      />

      {/* Bottom segment - Navy Blue */}
      <path
        d="M 50 85 A 35 35 0 0 1 25 65 L 40 55 A 20 20 0 0 0 50 70 Z"
        fill="#3498DB"
        mask="url(#centerMask)"
      />

      {/* Bottom Left segment - Purple */}
      <path
        d="M 25 65 A 35 35 0 0 1 25 35 L 40 45 A 20 20 0 0 0 40 55 Z"
        fill="#9B59B6"
        mask="url(#centerMask)"
      />

      {/* Top Left segment - Cyan */}
      <path
        d="M 25 35 A 35 35 0 0 1 50 15 L 50 30 A 20 20 0 0 0 40 45 Z"
        fill="#1ABC9C"
        mask="url(#centerMask)"
      />

      {/* Center circle - White */}
      <circle cx="50" cy="50" r="18" fill="white" stroke="#E0E0E0" strokeWidth="1" />

      {/* Central C */}
      <text
        x="50%"
        y="53%"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="24"
        fontWeight="900"
        fill="#2C3E50"
        fontFamily="Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji"
      >
        C
      </text>
    </svg>
  );
}

export default Logo;