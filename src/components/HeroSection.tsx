import React from 'react';
import { Sparkles } from 'lucide-react';

export function HeroSection() {
  return (
    <div className="text-center mb-8 pt-8">
      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Sparkles className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Consense.us</h1>
      <p className="text-gray-600">Make group decisions effortlessly with your planning sessions</p>
    </div>
  );
}
