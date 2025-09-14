import React from 'react';
import { Sparkles } from 'lucide-react';

export function HeroSection() {
  const isDemo = window.location.pathname === '/demo';
  
  return (
    <div className="text-center mb-8 pt-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Welcome to Consense.us{isDemo ? ' Demo' : ''}
      </h1>
      <p className="text-gray-600">
        Make group decisions effortlessly with your planning sessions
        {isDemo && (
          <span className="block text-sm text-blue-600 mt-2">
            🎯 You're viewing the demo version - all features are fully functional!
          </span>
        )}
      </p>
    </div>
  );
}
