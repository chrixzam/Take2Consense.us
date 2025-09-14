import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, MapPin, AlertCircle, Sparkles, ExternalLink } from 'lucide-react';
import { FeedEvent } from '../types';

type PredictHQEvent = {
  id: string;
  title?: string;
  start?: string;
  end?: string;
  category?: string;
  description?: string;
  labels?: string[];
  entities?: Array<{ name?: string; type?: string }>;
  place?: { name?: string; type?: string };
};

interface EventsFeedProps {
  query?: string;
  limit?: number;
  country?: string;
  category?: string;
  activeGte?: string; // ISO date or YYYY-MM-DD
  activeLte?: string; // ISO date or YYYY-MM-DD
  startAroundOrigin?: string; // ISO date or YYYY-MM-DD
  locationAroundOrigin?: string; // "lat,lon"
  locationAroundOffset?: string; // e.g. "5mi" or "10km"
  sessionStartDate?: Date; // Session start date for date-based suggestions
  sessionEndDate?: Date; // Session end date for date-based suggestions
  sessionName?: string; // Session name for query enhancement
  sessionDescription?: string; // Session description for query enhancement
  sessionCity?: string; // Session city for location-based suggestions
  userStatedLocation?: string; // User's explicitly stated location
  onAddFromFeed?: (ev: FeedEvent) => void;
  onLoadedEvents?: (events: FeedEvent[]) => void;
}

export function EventsFeed({
  query = 'taylor swift',
  limit = 5,
  country,
  category,
  activeGte,
  activeLte,
  startAroundOrigin,
  locationAroundOrigin,
  locationAroundOffset,
  sessionStartDate,
  sessionEndDate,
  sessionName,
  sessionDescription,
  sessionCity,
  userStatedLocation,
  onAddFromFeed,
  onLoadedEvents,
}: EventsFeedProps) {
  const envToken = import.meta.env.VITE_PREDICTHQ_TOKEN as string | undefined;
  // Fallback token is hardcoded for local usage. Avoid committing secrets in production.
  const token = envToken && envToken.trim().length > 0
    ? envToken
    : '4vd1wx00yGqZtYdxxZMH3lZmX39f2nBlJ3A_uIz2';
  const [events, setEvents] = useState<PredictHQEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canFetch = useMemo(() => Boolean(token && token.trim().length > 0), [token]);


  // Smart date filtering based on session dates
  const smartDateFilters = useMemo(() => {
    const filters: { activeGte?: string; activeLte?: string } = {};
    
    // Use session dates if available, otherwise use provided date filters
    if (sessionStartDate && !activeGte) {
      filters.activeGte = sessionStartDate.toISOString();
    } else if (activeGte) {
      filters.activeGte = activeGte;
    }
    
    if (sessionEndDate && !activeLte) {
      // Add a buffer to the end date to catch events that might extend slightly beyond
      const bufferedEndDate = new Date(sessionEndDate);
      bufferedEndDate.setDate(bufferedEndDate.getDate() + 7); // 7-day buffer
      filters.activeLte = bufferedEndDate.toISOString();
    } else if (activeLte) {
      filters.activeLte = activeLte;
    }
    
    return filters;
  }, [sessionStartDate, sessionEndDate, activeGte, activeLte]);

  // Smart query generation based on session context
  const smartQuery = useMemo(() => {
    // If we have both location and date data, create a more targeted query
    const hasLocationData = userStatedLocation || sessionCity || locationAroundOrigin;
    const hasDateData = sessionStartDate || sessionEndDate || smartDateFilters.activeGte || smartDateFilters.activeLte;
    
    if (hasLocationData && hasDateData) {
      // Use session context to create better queries
      const locationContext = userStatedLocation || sessionCity || '';
      const sessionContext = sessionName || sessionDescription || '';
      
      // Generate contextual search terms
      const contextTerms = [];
      if (sessionContext.toLowerCase().includes('music') || sessionContext.toLowerCase().includes('concert')) {
        contextTerms.push('concerts', 'music', 'festivals');
      }
      if (sessionContext.toLowerCase().includes('food') || sessionContext.toLowerCase().includes('dining')) {
        contextTerms.push('food', 'restaurants', 'culinary');
      }
      if (sessionContext.toLowerCase().includes('art') || sessionContext.toLowerCase().includes('culture')) {
        contextTerms.push('art', 'exhibitions', 'cultural');
      }
      if (sessionContext.toLowerCase().includes('sport') || sessionContext.toLowerCase().includes('game')) {
        contextTerms.push('sports', 'games', 'tournaments');
      }
      
      // Default to general events if no specific context
      if (contextTerms.length === 0) {
        contextTerms.push('events', 'activities', 'entertainment');
      }
      
      return contextTerms.join(' OR ');
    }
    
    // Fallback to provided query or default
    return query;
  }, [query, userStatedLocation, sessionCity, locationAroundOrigin, sessionStartDate, sessionEndDate, smartDateFilters.activeGte, smartDateFilters.activeLte, sessionName, sessionDescription]);

  // Enhanced location context display
  const locationContext = useMemo(() => {
    if (userStatedLocation && userStatedLocation !== sessionCity) {
      return userStatedLocation;
    }
    return sessionCity;
  }, [userStatedLocation, sessionCity]);

  useEffect(() => {
    let alive = true;
    async function run() {
      if (!canFetch) return;
      setLoading(true);
      // Clear previous results when filters change to avoid showing stale lists
      setEvents([]);
      setError(null);
      try {
        const params = new URLSearchParams();
        // Remove query parameter - use only date-based filtering
        if (limit) params.set('limit', String(limit));
        if (country) params.set('country', country);
        if (category) params.set('category', category);
        
        // Use smart date filters that prioritize session dates, but ensure no past events
        const now = new Date();
        let startDate = now.toISOString();
        
        if (smartDateFilters.activeGte) {
          // Use the later of session start date or current time to avoid past events
          const sessionStart = new Date(smartDateFilters.activeGte);
          startDate = sessionStart > now ? smartDateFilters.activeGte : now.toISOString();
        } else if (activeGte) {
          // Use the later of provided start date or current time to avoid past events
          const providedStart = new Date(activeGte);
          startDate = providedStart > now ? activeGte : now.toISOString();
        }
        
        params.set('active.gte', startDate);
        
        if (smartDateFilters.activeLte) {
          params.set('active.lte', smartDateFilters.activeLte);
        }
        
        if (startAroundOrigin) params.set('start_around.origin', startAroundOrigin);
        if (locationAroundOrigin) params.set('location_around.origin', locationAroundOrigin);
        if (locationAroundOffset) params.set('location_around.offset', locationAroundOffset);
        // Prefer upcoming events by default
        params.set('sort', 'start');

        const res = await fetch(`https://api.predicthq.com/v1/events/?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
        }
        const data = await res.json();
        const results = Array.isArray(data?.results) ? data.results : [];
        if (alive) setEvents(results);
        // Notify parent with normalized feed events when available
        if (alive && onLoadedEvents) {
          const normalized: FeedEvent[] = results.map((ev: PredictHQEvent) => {
            const searchQuery = encodeURIComponent([
              ev.title,
              ev.place?.name || ev.entities?.[0]?.name,
            ].filter(Boolean).join(' '));
            const sourceUrl = `https://www.google.com/search?q=${searchQuery}`;
            return {
              title: ev.title || 'Untitled event',
              description: ev.description,
              category: ev.category,
              start: ev.start,
              end: ev.end,
              locationName: ev.place?.name || ev.entities?.[0]?.name,
              sourceUrl,
            } as FeedEvent;
          });
          onLoadedEvents(normalized);
        }
      } catch (e: any) {
        if (alive) setError(e?.message || 'Failed to load events');
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    // Refresh events hourly
    const intervalId = window.setInterval(() => {
      if (!alive) return;
      run();
    }, 60 * 60 * 1000);
    return () => {
      alive = false;
      window.clearInterval(intervalId);
    };
  }, [
    limit,
    country,
    category,
    smartDateFilters.activeGte,
    smartDateFilters.activeLte,
    startAroundOrigin,
    locationAroundOrigin,
    locationAroundOffset,
    sessionStartDate,
    sessionEndDate,
    sessionCity,
    userStatedLocation,
    smartQuery,
    canFetch,
    token,
  ]);

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    try {
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
      }).format(new Date(iso));
    } catch {
      return '';
    }
  };

  return (
    <div className="relative left-1/2 -translate-x-1/2 w-screen bg-gradient-to-b from-blue-50 via-purple-200 to-green-300 py-10">
      <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center mr-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Events Feed</h2>
        <div className="ml-2 text-xs text-blue-600 flex flex-wrap items-center gap-2">
          {locationContext && (
            <span>• Location: {locationContext}</span>
          )}
          {sessionStartDate && (
            <span>
              • Session dates: {sessionStartDate.toLocaleDateString()}
              {sessionEndDate && sessionEndDate.getTime() !== sessionStartDate.getTime() && 
                ` - ${sessionEndDate.toLocaleDateString()}`
              }
            </span>
          )}
          {userStatedLocation && userStatedLocation !== sessionCity && (
            <span>• User location: {userStatedLocation}</span>
          )}
        </div>
      </div>

      {!canFetch && (
        <div className="flex items-start space-x-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 mt-0.5" />
          <div className="text-sm">
            Set <code className="px-1 py-0.5 rounded bg-gray-100">VITE_PREDICTHQ_TOKEN</code> in <code className="px-1 py-0.5 rounded bg-gray-100">.env.local</code> to enable the feed.
          </div>
        </div>
      )}

      {canFetch && (
        <div className="flex justify-center">
          <div className="bg-white/[0.78] rounded-2xl shadow-sm border border-gray-200 w-full">
          {loading ? (
            <div className="p-6 text-sm text-gray-600">Loading events…</div>
          ) : error ? (
            <div className="p-6 text-sm text-red-600">{error}</div>
          ) : events.length === 0 ? (
            <div className="p-6 text-sm text-gray-600">No events found.</div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              {events.map((ev) => {
                const searchQuery = encodeURIComponent([
                  ev.title,
                  ev.place?.name || ev.entities?.[0]?.name,
                ].filter(Boolean).join(' '));
                const sourceUrl = `https://www.google.com/search?q=${searchQuery}`;
                const payload: FeedEvent = {
                  title: ev.title || 'Untitled event',
                  description: ev.description,
                  category: ev.category,
                  start: ev.start,
                  end: ev.end,
                  locationName: ev.place?.name || ev.entities?.[0]?.name,
                  sourceUrl,
                };
                return (
                  <li key={ev.id} className="p-3 bg-white rounded-xl border border-gray-200 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center space-x-2 mb-1">
                          {ev.category && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700">
                              {ev.category}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-sm text-gray-900 font-semibold line-clamp-2">
                            {ev.title || 'Untitled event'}
                          </div>
                          <a
                            href={sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-blue-600 hover:text-blue-700"
                            aria-label="Open source link"
                            title="Open source link"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                        {ev.description && (
                          <div className="text-xs text-gray-600 line-clamp-2">{ev.description}</div>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                          {ev.start && (
                            <span className="inline-flex items-center"><Calendar className="w-4 h-4 mr-1 text-gray-400" /> {formatDate(ev.start)}</span>
                          )}
                          {(ev.place?.name || ev.entities?.[0]?.name) && (
                            <span className="inline-flex items-center"><MapPin className="w-4 h-4 mr-1 text-gray-400" /> {ev.place?.name || ev.entities?.[0]?.name}</span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          {onAddFromFeed && (
                            <button
                              type="button"
                              onClick={() => onAddFromFeed(payload)}
                              className="inline-flex items-center text-xs font-medium text-green-700 hover:text-green-800"
                              title="Add this event as an idea"
                            >
                              + Add
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default EventsFeed;
