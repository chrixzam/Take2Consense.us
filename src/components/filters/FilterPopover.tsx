import React from 'react';

interface FilterPopoverProps {
  isOpen: boolean;
  popoverRef: React.RefObject<HTMLDivElement>;
  children: React.ReactNode;
  className?: string;
}

export function FilterPopover({ isOpen, popoverRef, children, className = '' }: FilterPopoverProps) {
  if (!isOpen) return null;
  
  return (
    <div 
      ref={popoverRef} 
      className={`absolute top-full mt-2 z-30 ${className}`}
    >
      {children}
    </div>
  );
}
