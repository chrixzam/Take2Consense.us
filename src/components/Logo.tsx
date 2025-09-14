import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

// Consense.us interlocking rings logo with central "C"
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
      {/* Rings */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Top ring - blue */}
        <circle cx="50" cy="34" r="26" stroke="#2563EB" strokeWidth="10" />
        {/* Bottom-left ring - green */}
        <circle cx="34" cy="66" r="26" stroke="#16A34A" strokeWidth="10" />
        {/* Bottom-right ring - purple */}
        <circle cx="66" cy="66" r="26" stroke="#6366F1" strokeWidth="10" />
      </g>

      {/* Central C */}
      <text
        x="50%"
        y="53%"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="56"
        fontWeight="900"
        fill="#111827"
        fontFamily="Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji"
      >
        C
      </text>
    </svg>
  );
}

export default Logo;

