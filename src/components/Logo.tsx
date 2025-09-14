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
      src={src || '/cuh_risz_httpss.mj.runfqKC_SdUm2Y_Recreate_this_logo_in_a_cal_fdde79b4-4e5f-47a5-a78c-24b17daddfdd_3.jpg'}
      alt="Consense.us logo"
      width={pixelSize}
      height={pixelSize}
      className={className}
    />
  );
}

export default Logo;