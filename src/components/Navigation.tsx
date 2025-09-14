import React from 'react';
import { MapPin, Settings, ArrowLeft, RefreshCw } from 'lucide-react';
import Logo from './Logo';
import { useCurrentLocation } from '../hooks/useCurrentLocation';

interface NavigationProps {
  // Main app navigation
  showBackButton?: boolean;
  onBack?: () => void;
  onLogoClick?: () => void;
  
  // Session-specific props (deprecated - keeping for compatibility)
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
  onLogoClick,
  // sessionName,
  // memberCount,
  currentCity, // Keep for backward compatibility but don't use
  onCityEdit, // Keep for backward compatibility but don't use
  onSettings
}: NavigationProps) {
  const { currentLocation, isLoading, refreshLocation } = useCurrentLocation();
  return (
    <>
      <nav className="border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left section */}
            <div className="flex items-center space-x-4">
              {/* Brand */}
              <a
                href="/"
                onClick={(e) => { 
                  if (onLogoClick) { 
                    e.preventDefault(); 
                    onLogoClick(); 
                  } else {
                    // Allow natural navigation to home when no handler provided
                    const currentPath = window.location.pathname;
                    if (currentPath === '/demo') {
                      e.preventDefault();
                      window.history.pushState({}, '', '/demo');
                      window.location.reload();
                    }
                  }
                }}
                className="flex items-center space-x-3 hover:opacity-90 transition-opacity"
                aria-label="Go to home"
                title="Go to home"
              >
                <Logo size={40} />
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {window.location.pathname === '/demo' ? 'Consense.US' : 'Consense.us'}
                  </h1>
                </div>
              </a>

              {/* Session info removed from header */}
            </div>

            {/* Right section */}
            <div className="flex items-center space-x-3">
              {/* Demo Link */}
              {window.location.pathname !== '/demo' && (
                <a
                  href="/demo"
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState({}, '', '/demo');
                    window.location.reload();
                  }}
                  className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Try Demo
                </a>
              )}
              
              {/* Current Location Display */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={refreshLocation}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  title="Your current location (click to refresh)"
                >
                  <MapPin className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {isLoading ? 'Detecting...' : currentLocation || 'Location unavailable'}
                  </span>
                </button>
              </div>
              
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

      {showBackButton && onBack && (
        <div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-12 flex items-center">
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 px-2 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium">Back</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}