import React, { useState } from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  src?: string; // path in /public
}

// Displays the brand logo image from /public (prefers /logo.png, falls back to /logo.svg)
export function Logo({ size = 40, className, src = '/logo.png' }: LogoProps) {
  const pixelSize = `${size}px`;
  const [imgSrc, setImgSrc] = useState(src);
  return (
    <img
      src={imgSrc}
      alt="Consense.us logo"
      width={size}
      height={size}
      style={{ width: pixelSize, height: pixelSize }}
      className={className}
      onError={() => {
        if (imgSrc !== '/logo.svg') setImgSrc('/logo.svg');
      }}
    />
  );
}

export default Logo;
