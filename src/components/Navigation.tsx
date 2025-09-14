import React from 'react';
import { Users, MapPin, Settings, ArrowLeft } from 'lucide-react';
import Logo from './Logo';

interface NavigationProps {
  // Main app navigation
  showBackButton?: boolean;
  onBack?: () => void;
  
  // Session-specific props
  sessionName?: string;
  memberCount?: number;
  currentCity?: string;
  onCityEdit?: () => void;
  
  // User actions
  onSettings?: () => void;
}

export function Navigation({ 
  showBackButton = false,
  onBack,
  sessionName,
  memberCount,
  currentCity,
  onCityEdit,
  onSettings
}: NavigationProps) {
  return (
    <nav className="border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section */}
          <div className="flex items-center space-x-4">
            {showBackButton && onBack && (
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            
            {/* Brand */}
            <div className="flex items-center space-x-3">
              <Logo size={40} />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Consense.us
                </h1>
                {sessionName && (
                  <p className="text-sm text-gray-500 -mt-1">{sessionName}</p>
                )}
              </div>
            </div>

            {/* Session info */}
            {sessionName && memberCount && (
              <div className="hidden sm:flex items-center space-x-1 px-3 py-1 bg-gray-100 rounded-full">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">{memberCount} members</span>
              </div>
            )}
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-3">
            {currentCity && onCityEdit && (
              <button
                onClick={onCityEdit}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MapPin className="w-4 h-4" />
                <span className="hidden sm:inline">{currentCity}</span>
              </button>
            )}
            
            {onSettings && (
              <button
                onClick={onSettings}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
