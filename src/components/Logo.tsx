import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  src?: string;
}

export function Logo({ size = 40, className, src }: LogoProps) {
  const pixelSize = `${size}px`;
  return (
    <img
      src={src || '/logo.png'}
      alt="Consense.us logo"
      width={pixelSize}
      height={pixelSize}
      className={className}
    />
  );
}

export default Logo;