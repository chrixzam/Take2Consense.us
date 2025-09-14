import React from 'react';
import type { FeedEvent } from '../types';
import type { PlaceSuggestion, EventSuggestion } from '../agents/service';
import { loadGoogleMaps } from '../utils/googleMapsLoader';
import BookingModal from './BookingModal';

type Coords = { lat: number; lon: number };

interface AgentPlanModalProps {
  open: boolean;
  onClose: () => void;
  idea: string;
  planText: string;
  model?: string;
  provider?: string;
  places?: PlaceSuggestion[];
  events?: EventSuggestion[];
  onAddFromPlan?: (ev: FeedEvent) => void;
  onRemoveFromPlan?: (ev: FeedEvent) => void;
  originCoords?: Coords;
  startDate?: Date;
  endDate?: Date;
  budgetLevel?: number;
  locationLabel?: string;
  // Optional custom content to render directly under the map
  mapFooter?: React.ReactNode;
}

export default function AgentPlanModal({ open, onClose, idea, planText, model, provider, places = [], events = [], onAddFromPlan, onRemoveFromPlan, originCoords, startDate, endDate, budgetLevel, locationLabel, mapFooter }: AgentPlanModalProps) {
  const mapRef = React.useRef<HTMLDivElement | null>(null);
  // Use any to avoid requiring @types/google.maps
  const mapInstanceRef = React.useRef<any>(null);
  const markersRef = React.useRef<any[] | null>(null);
  const [addedKeys, setAddedKeys] = React.useState<Set<string>>(new Set());
  const [bookingModalOpen, setBookingModalOpen] = React.useState(false);

  // Function to check if booking agent should be shown
  const shouldShowBookingAgent = React.useMemo(() => {
    // Check for travel-related keywords in the idea
    const travelKeywords = [
      'travel', 'trip', 'vacation', 'holiday', 'visit', 'visiting', 'fly', 'flight', 'hotel', 'stay', 'staying',
      'weekend getaway', 'road trip', 'destination', 'explore', 'exploring', 'tour', 'touring', 'journey',
      'adventure', 'escape', 'getaway', 'abroad', 'international', 'domestic', 'book', 'booking', 'reserve',
      'reservation', 'accommodation', 'lodging', 'airbnb', 'hostel', 'resort', 'cruise', 'train', 'bus',
      'rental car', 'itinerary', 'sightseeing', 'tourist', 'backpack', 'backpacking'
    ];
    
    const ideaLower = idea.toLowerCase();
    const hasTravelKeywords = travelKeywords.some(keyword => ideaLower.includes(keyword));
    
    // Check if location is far from user's current location (if we have coordinates)
    let isFarLocation = false;
    if (originCoords && places.length > 0) {
      // Calculate average distance of suggested places
      const avgDistance = places.reduce((sum, place) => sum + place.distKm, 0) / places.length;
      // Consider "far" if average distance is more than 50km (about 30 miles)
      isFarLocation = avgDistance > 50;
    }
    
    // Check if the location label suggests a different city/region
    let isDifferentLocation = false;
    if (locationLabel) {
      // Simple heuristic: if location label contains state/country indicators or is different from common local terms
      const locationLower = locationLabel.toLowerCase();
      const localTerms = ['nearby', 'local', 'around here', 'close by'];
      const hasLocalTerms = localTerms.some(term => locationLower.includes(term));
      
      // If it's not a local term and contains location indicators, it's likely a different location
      if (!hasLocalTerms && (locationLower.includes(',') || locationLower.length > 20)) {
        isDifferentLocation = true;
      }
    }
    
    return hasTravelKeywords || isFarLocation || isDifferentLocation;
  }, [idea, originCoords, places, locationLabel]);

  // Load Google Maps and render markers for suggested places when modal opens/updates
  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const gmaps = await loadGoogleMaps({ libraries: ['marker'] });
        if (cancelled) return;

        // Create map instance if needed
        if (mapRef.current && !mapInstanceRef.current) {
          const firstPlace = places[0];
          const center = firstPlace
            ? { lat: firstPlace.lat, lng: firstPlace.lon }
            : originCoords
            ? { lat: originCoords.lat, lng: originCoords.lon }
            : { lat: 37.7749, lng: -122.4194 };
          mapInstanceRef.current = new gmaps.Map(mapRef.current, {
            center,
            zoom: firstPlace ? 12 : 10,
            mapId: undefined,
          });
        }

        // Add/update markers for places
        if (mapInstanceRef.current) {
          // Clear prior markers
          if (markersRef.current) {
            // @ts-ignore - handle both Marker and AdvancedMarkerElement
            markersRef.current.forEach(m => m.setMap && m.setMap(null));
          }
          const useAdvanced = !!gmaps.marker && !!gmaps.marker.AdvancedMarkerElement;
          const ms: any[] = [];
          places.slice(0, 25).forEach(p => {
            const position = { lat: p.lat, lng: p.lon };
            if (useAdvanced) {
              const m = new gmaps.marker.AdvancedMarkerElement({ map: mapInstanceRef.current!, position, title: p.name });
              ms.push(m);
            } else {
              const m = new gmaps.Marker({ map: mapInstanceRef.current!, position, title: p.name });
              ms.push(m);
            }
          });
          markersRef.current = ms as any;

          // Fit bounds if we have multiple places
          if (places.length > 1) {
            const bounds = new gmaps.LatLngBounds();
            places.forEach(p => bounds.extend({ lat: p.lat, lng: p.lon }));
            mapInstanceRef.current.fitBounds(bounds, 32);
          } else if (places.length === 1) {
            // Recenter for a single place as well
            const p = places[0];
            mapInstanceRef.current.setCenter({ lat: p.lat, lng: p.lon });
            mapInstanceRef.current.setZoom(14);
          }
        }
      } catch (_) {
        // Ignore load errors; map is optional in draft
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, places, originCoords?.lat, originCoords?.lon]);

  // Recenter on origin if there are no places yet or places cleared
  React.useEffect(() => {
    if (!open || !originCoords) return;
    const map = mapInstanceRef.current;
    if (!map) return;
    if (!places || places.length === 0) {
      try {
        map.setCenter({ lat: originCoords.lat, lng: originCoords.lon });
        map.setZoom(12);
      } catch {}
    }
  }, [open, originCoords?.lat, originCoords?.lon, places?.length]);

  // Build stable keys to track items added and support undo without IDs
  const placeKey = (p: PlaceSuggestion) => `place:${p.name}|${p.address ?? ''}|${p.lat.toFixed(5)},${p.lon.toFixed(5)}`;
  const eventKey = (e: EventSuggestion) => `event:${e.title}|${e.place ?? ''}|${e.start ?? ''}|${e.url ?? ''}`;

  // Toggle helper for add/undo
  const toggleAddPlace = (p: PlaceSuggestion) => {
    if (!onAddFromPlan && !onRemoveFromPlan) return;
    const key = placeKey(p);
    const isAdded = addedKeys.has(key);
    const feed: FeedEvent = {
      title: p.name,
      description: `${p.type.replace('_',' ')}${p.priceLevel ? ` • ${String(p.priceLevel).includes('VERY_EXPENSIVE') ? '$$$$' : String(p.priceLevel).includes('EXPENSIVE') ? '$$$' : String(p.priceLevel).includes('MODERATE') ? '$$' : String(p.priceLevel).includes('INEXPENSIVE') ? '$' : String(p.priceLevel).includes('FREE') ? 'Free' : ''}` : ''}${p.address ? ` • ${p.address}` : ''} • ~${p.distKm.toFixed(1)} km`,
      category: p.type,
      locationName: p.name,
      sourceUrl: p.url,
      lat: p.lat,
      lon: p.lon,
      address: p.address,
    };
    if (isAdded) {
      onRemoveFromPlan && onRemoveFromPlan(feed);
      setAddedKeys(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    } else {
      onAddFromPlan && onAddFromPlan(feed);
      setAddedKeys(prev => new Set(prev).add(key));
    }
  };

  const toggleAddEvent = (e: EventSuggestion) => {
    if (!onAddFromPlan && !onRemoveFromPlan) return;
    const key = eventKey(e);
    const isAdded = addedKeys.has(key);
    const feed: FeedEvent = {
      title: e.title,
      description: e.start ? new Date(e.start).toLocaleString() : undefined,
      category: e.category,
      start: e.start,
      locationName: e.place,
      sourceUrl: e.url,
    };
    if (isAdded) {
      onRemoveFromPlan && onRemoveFromPlan(feed);
      setAddedKeys(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    } else {
      onAddFromPlan && onAddFromPlan(feed);
      setAddedKeys(prev => new Set(prev).add(key));
    }
  };
  // Render plan text with clickable markdown-style links [title](url)
  const renderPlanWithLinks = (text: string) => {
    const parts: React.ReactNode[] = [];
    const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      const label = match[1];
      const url = match[2];
      parts.push(
        <a
          key={`link-${parts.length}`}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 hover:text-blue-700 underline"
        >
          {label}
        </a>
      );
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return parts;
  };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative max-w-5xl w-full mx-4 rounded-2xl bg-white shadow-xl border border-gray-200">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Planning Draft</h3>
          <p className="text-sm text-gray-500 mt-1">Idea: {idea || 'Untitled idea'}</p>
          {(startDate || endDate) && (
            <p className="text-sm text-gray-600 mt-1">
              Dates: {startDate ? new Date(startDate).toLocaleDateString() : ''}
              {endDate ? ` – ${new Date(endDate).toLocaleDateString()}` : ''}
            </p>
          )}
          {budgetLevel && (
            <p className="text-sm text-gray-600 mt-1">
              Budget: {'$'.repeat(Math.min(5, Math.max(1, budgetLevel)))} ({Math.min(5, Math.max(1, budgetLevel))}/5)
            </p>
          )}
          {locationLabel && (
            <p className="text-sm text-gray-600 mt-1">Location: {locationLabel}</p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-4">
          <div className="md:col-span-2 p-0 md:p-5 max-h-[60vh] overflow-auto border-b md:border-b-0 md:border-r border-gray-100">
            {/* Map container (optional; loads when API key present) */}
            {window.location.pathname === '/demo' ? (
              <img 
                src="/fiji-map.jpg"
                alt="Fiji Water Sports Map"
                className="w-full h-48 md:rounded-md object-cover"
              />
            ) : (
              <div ref={mapRef} className="w-full h-48 bg-gray-100 md:rounded-md"></div>
            )}
            {/* Small subsection under the map (customizable) */}
            <div className="px-5 py-3 border-t border-gray-200 bg-gray-50">
              {mapFooter ? (
                mapFooter
              ) : (
                <div className="text-sm text-gray-700 flex flex-wrap gap-x-4 gap-y-1">
                  <span>
                    Places: <span className="font-medium">{places.length}</span>
                  </span>
                  <span>
                    Events: <span className="font-medium">{events.length}</span>
                  </span>
                  {locationLabel && (
                    <span>
                      Area: <span className="font-medium">{locationLabel}</span>
                    </span>
                  )}
                  {originCoords && (
                    <span>
                      Origin: <span className="font-medium">{originCoords.lat.toFixed(3)}, {originCoords.lon.toFixed(3)}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="p-5 whitespace-pre-wrap text-gray-800">
              {renderPlanWithLinks(planText)}
            </div>
          </div>
          <div className="p-5 max-h-[60vh] overflow-auto">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Suggestions</h4>
            {places.length === 0 && events.length === 0 && (
              <div className="text-sm text-gray-500">No suggestions found.</div>
            )}
            {places.length > 0 && (
              <div className="mb-4">
                <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Nearby places</div>
                <ul className="space-y-2">
                  {places.map((p, idx) => {
                    const price = (() => {
                      if (!p.priceLevel) return undefined;
                      const s = String(p.priceLevel);
                      if (s.includes('VERY_EXPENSIVE')) return '$$$$';
                      if (s.includes('EXPENSIVE')) return '$$$';
                      if (s.includes('MODERATE')) return '$$';
                      if (s.includes('INEXPENSIVE')) return '$';
                      if (s.includes('FREE')) return 'Free';
                      return undefined;
                    })();
                    return (
                      <li key={`p-${idx}`} className="text-sm text-gray-800 flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-gray-500">
                            {p.type.replace('_',' ')} • ~{p.distKm.toFixed(1)} km{price ? ` • ${price}` : ''}
                          </div>
                          {p.address && (
                            <div className="text-xs text-gray-500">{p.address}</div>
                          )}
                          {p.url && (
                            <a href={p.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:text-blue-700">Open map</a>
                          )}
                        </div>
                        {onAddFromPlan && (
                          <button
                            type="button"
                            className="shrink-0 text-xs text-green-700 hover:text-green-800"
                            onClick={() => toggleAddPlace(p)}
                          >
                            {addedKeys.has(placeKey(p)) ? 'Undo' : '+ Add'}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {events.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Relevant events</div>
                <ul className="space-y-2">
                  {events.map((e, idx) => (
                    <li key={`e-${idx}`} className="text-sm text-gray-800 flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium">{e.title}</div>
                        <div className="text-xs text-gray-500">
                          {e.place ? `${e.place}` : ''}{e.category ? ` • ${e.category}` : ''}{e.start ? ` • ${new Date(e.start).toLocaleString()}` : ''}
                        </div>
                        {e.url && (
                          <a href={e.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:text-blue-700">Open</a>
                        )}
                      </div>
                      {onAddFromPlan && (
                        <button
                          type="button"
                          className="shrink-0 text-xs text-green-700 hover:text-green-800"
                          onClick={() => toggleAddEvent(e)}
                        >
                          {addedKeys.has(eventKey(e)) ? 'Undo' : '+ Add'}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {(places.length > 0 || events.length > 0) && shouldShowBookingAgent && (
              <button
                onClick={() => setBookingModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
              >
                Get Booking Info
              </button>
            )}
          </div>
          <button onClick={onClose} className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black">Close</button>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        open={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        planText={planText}
        places={places}
        events={events}
        startDate={startDate}
        endDate={endDate}
        budgetLevel={budgetLevel}
        locationLabel={locationLabel}
        coords={originCoords}
        city={locationLabel}
      />
    </div>
  );
}
