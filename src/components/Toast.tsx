import React, { useEffect } from 'react';

interface ToastProps {
  message: string | null;
  duration?: number; // ms
  onClose: () => void;
}

export default function Toast({ message, duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => onClose(), duration);
    return () => clearTimeout(id);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className="fixed top-4 right-4 z-[100]">
      <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg text-sm max-w-xs">
        {message}
      </div>
    </div>
  );
}

