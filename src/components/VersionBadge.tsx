import React from 'react';

export function VersionBadge() {
  const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';
  return (
    <div
      className="fixed bottom-2 right-3 z-50 rounded border border-gray-200 bg-white/80 px-2 py-1 text-xs text-gray-600 shadow-sm backdrop-blur"
      aria-label={`App version ${version}`}
    >
      v{version}
    </div>
  );
}

export default VersionBadge;

