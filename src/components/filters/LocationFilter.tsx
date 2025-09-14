import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { FilterPopover } from './FilterPopover';
import { usePopoverManager } from '../../hooks/usePopoverManager';
import { forwardGeocodeCity, findPlaceFromText } from '../../utils/geolocation';

interface LocationFilterProps {
  eventLocation?: { label: string; lat: number; lon: number };
  eventLocationCountry?: string;
  autoDetectedLocation?: { label: string; lat: number; lon: number };
  autoDetectedLocationCountry?: string;
  onLocationChange: (location?: { label: string; lat: number; lon: number }, country?: string) => void;
  className?: string;
}

export function LocationFilter({ 
  eventLocation, 
  eventLocationCountry, 
  autoDetectedLocation,
  autoDetectedLocationCountry,
  onLocationChange, 
  className = '' 
}: LocationFilterProps) {
  const { isOpen, toggle, close, popoverRef, buttonRef } = usePopoverManager();
  const [locationInput, setLocationInput] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);

  const hasSelection = eventLocation !== undefined;
  const hasAutoDetected = autoDetectedLocation !== undefined && !eventLocation;

  const useAutoDetected = () => {
    if (autoDetectedLocation) {
      onLocationChange(autoDetectedLocation, autoDetectedLocationCountry);
      close();
    }
  };

  const clearLocation = () => {
    onLocationChange(undefined, undefined);
    close();
  };

  const resolveLocation = async () => {
    const q = locationInput.trim();
    if (!q) return;
    
    setLocationLoading(true);
    try {
      // Prefer Google Places text lookup for flexible free-text matches
      const place = await findPlaceFromText(q);
      if (place?.coords) {
        onLocationChange(
          { label: place.label || q, lat: place.coords.lat, lon: place.coords.lon },
          place.countryCode
        );
        close();
      } else {
        // Fallback to classic geocoding
        const res = await forwardGeocodeCity(q);
        if (res?.coords) {
          onLocationChange(
            { label: q, lat: res.coords.lat, lon: res.coords.lon },
            res.countryCode
          );
          close();
        } else {
          alert('Could not find that location. Try a city or address.');
        }
      }
    } catch {
      alert('Could not look up that location.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      resolveLocation();
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        className={`inline-flex items-center justify-center p-1.5 hover:text-white transition-colors ${
          hasSelection || isOpen ? 'text-fuchsia-400' : ''
        } ${className}`}
        title="Add location"
        aria-label="Add location"
        onClick={toggle}
      >
        <MapPin className="w-4 h-4" />
      </button>

      <FilterPopover isOpen={isOpen} popoverRef={popoverRef} className="left-24">
        <div className="w-[260px] rounded-2xl bg-gray-900 ring-1 ring-white/10 shadow-xl text-gray-100 p-3">
          <div className="text-xs text-gray-300 mb-2">Event location</div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="City or address"
              className="flex-1 bg-gray-800 text-gray-100 text-xs rounded-md px-2 py-1.5 placeholder-gray-400 outline-none border border-white/10 focus:border-cyan-400/40"
            />
            <button
              type="button"
              onClick={resolveLocation}
              disabled={locationLoading || !locationInput.trim()}
              className="px-2 py-1 text-xs rounded-md bg-cyan-600 text-white disabled:opacity-60"
            >
              {locationLoading ? '...' : 'Set'}
            </button>
          </div>
          {/* Auto-detected location suggestion */}
          {hasAutoDetected && (
            <div className="mt-2 p-2 bg-gray-800 rounded-md border border-cyan-400/20">
              <div className="text-[11px] text-cyan-400 mb-1">Detected from your idea:</div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-300">{autoDetectedLocation.label}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={useAutoDetected}
                    className="px-2 py-0.5 text-[10px] rounded bg-cyan-600 text-white hover:bg-cyan-500"
                  >
                    Use
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Selected location display */}
          {eventLocation && (
            <div className="mt-2 p-2 bg-gray-800 rounded-md border border-fuchsia-400/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-fuchsia-400 mb-0.5">Selected location:</div>
                  <div className="text-[11px] text-gray-300">{eventLocation.label}</div>
                </div>
                <button
                  type="button"
                  onClick={clearLocation}
                  className="px-2 py-0.5 text-[10px] rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </FilterPopover>
    </div>
  );
}
