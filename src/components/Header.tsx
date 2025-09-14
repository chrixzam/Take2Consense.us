import React from 'react';
import { Users, MapPin, Settings, ArrowLeft } from 'lucide-react';

interface HeaderProps {
  groupName: string;
  memberCount: number;
  currentCity: string;
  onCityEdit: () => void;
  onBack?: () => void;
}

export function Header({ groupName, memberCount, currentCity, onCityEdit, onBack }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur-sm bg-white/90">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-xl">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{groupName}</h1>
              <p className="text-sm text-gray-500">{memberCount} members</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={onCityEdit}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MapPin className="w-4 h-4" />
              <span>{currentCity}</span>
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}