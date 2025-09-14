import { useState, useEffect } from 'react';
import { detectCity, type GeoResult } from '../utils/geolocation';

interface CurrentLocationState {
  currentLocation: string | null;
  coordinates: { lat: number; lon: number } | null;
  countryCode: string | undefined;
  isLoading: boolean;
  error: string | null;
}

export function useCurrentLocation() {
  const [state, setState] = useState<CurrentLocationState>({
    currentLocation: null,
    coordinates: null,
    countryCode: undefined,
    isLoading: false,
    error: null
  });

  const refreshLocation = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await detectCity();
      if (result) {
        setState({
          currentLocation: result.city,
          coordinates: result.coords,
          countryCode: result.countryCode,
          isLoading: false,
          error: null
        });
        
        // Cache the current location separately from user's selected city
        localStorage.setItem(
          'currentLocation',
          JSON.stringify({
            city: result.city,
            coords: result.coords,
            countryCode: result.countryCode,
            timestamp: Date.now()
          })
        );
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Unable to detect location'
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Location detection failed'
      }));
    }
  };

  // Load cached current location on mount
  useEffect(() => {
    const cached = localStorage.getItem('currentLocation');
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as {
          city: string;
          coords?: { lat: number; lon: number };
          countryCode?: string;
          timestamp: number;
        };
        
        // Use cached value if within 1 hour (more frequent than user location)
        if (Date.now() - parsed.timestamp < 60 * 60 * 1000) {
          setState({
            currentLocation: parsed.city,
            coordinates: parsed.coords || null,
            countryCode: parsed.countryCode,
            isLoading: false,
            error: null
          });
          return;
        }
      } catch {
        // Invalid cache, continue to detect
      }
    }

    // Auto-detect location if no valid cache
    if (navigator.geolocation) {
      refreshLocation();
    } else {
      setState(prev => ({
        ...prev,
        error: 'Geolocation not supported'
      }));
    }
  }, []);

  return {
    ...state,
    refreshLocation
  };
}
