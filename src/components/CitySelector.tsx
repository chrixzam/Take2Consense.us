import React, { useState, useEffect } from 'react';
import { MapPin, Navigation } from 'lucide-react';

interface CitySelectorProps {
  currentCity: string;
  onCityChange: (city: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function CitySelector({ currentCity, onCityChange, onClose, isOpen }: CitySelectorProps) {
  const [city, setCity] = useState(currentCity);
  const [isDetecting, setIsDetecting] = useState(false);

  const detectLocation = async () => {
    setIsDetecting(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: true
        });
      });

      // Use reverse geocoding (mock implementation for demo)
      // In production, you'd use a service like Google Maps Geocoding API
      const mockCities = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ'];
      const detectedCity = mockCities[Math.floor(Math.random() * mockCities.length)];
      
      setCity(detectedCity);
    } catch (error) {
      console.error('Error detecting location:', error);
      alert('Could not detect your location. Please enter your city manually.');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSave = () => {
    onCityChange(city);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <MapPin className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Set Your Location</h3>
            <p className="text-sm text-gray-500">This helps us provide relevant suggestions</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter your city"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-center">
            <button
              onClick={detectLocation}
              disabled={isDetecting}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium text-sm disabled:opacity-50"
            >
              <Navigation className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
              <span>{isDetecting ? 'Detecting...' : 'Detect my location'}</span>
            </button>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!city.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}