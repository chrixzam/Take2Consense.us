import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  src?: string; // path in /public
}

// Displays the brand logo image from /public (default: /logo.svg)
export function Logo({ size = 40, className, src = '/logo.svg' }: LogoProps) {
  const pixelSize = `${size}px`;
  return (
    <img
      src={src}
      alt="Consense.us logo"
      width={size}
      height={size}
      style={{ width: pixelSize, height: pixelSize }}
      className={className}
    />
  );
}

export default Logo;
