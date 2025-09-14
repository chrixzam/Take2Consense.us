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
  onAddFromFeed?: (ev: FeedEvent) => void;
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
  onAddFromFeed,
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

  useEffect(() => {
    let alive = true;
    async function run() {
      if (!canFetch) return;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (limit) params.set('limit', String(limit));
        if (country) params.set('country', country);
        if (category) params.set('category', category);
        if (activeGte) params.set('active.gte', activeGte);
        if (activeLte) params.set('active.lte', activeLte);
        if (startAroundOrigin) params.set('start_around.origin', startAroundOrigin);
        if (locationAroundOrigin) params.set('location_around.origin', locationAroundOrigin);
        if (locationAroundOffset) params.set('location_around.offset', locationAroundOffset);
        // Prefer upcoming events by default
        params.set('sort', 'start');
        if (!activeGte) params.set('active.gte', new Date().toISOString());

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
      } catch (e: any) {
        if (alive) setError(e?.message || 'Failed to load events');
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [
    query,
    limit,
    country,
    category,
    activeGte,
    activeLte,
    startAroundOrigin,
    locationAroundOrigin,
    locationAroundOffset,
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
    <div className="w-full bg-gradient-to-b from-blue-50 via-purple-200 to-green-300 py-10">
      <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center mr-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Events Feed</h2>
        <span className="ml-2 text-sm text-gray-500">Query: {query}</span>
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-6 text-sm text-gray-600">Loading events…</div>
          ) : error ? (
            <div className="p-6 text-sm text-red-600">{error}</div>
          ) : events.length === 0 ? (
            <div className="p-6 text-sm text-gray-600">No events found.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
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
                  <li key={ev.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-4">
                        <div className="flex items-center space-x-2 mb-1">
                          {ev.category && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              {ev.category}
                            </span>
                          )}
                        </div>
                        <div className="text-gray-900 font-medium mb-1 line-clamp-2">{ev.title || 'Untitled event'}</div>
                        {ev.description && (
                          <div className="text-sm text-gray-600 line-clamp-2">{ev.description}</div>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          {ev.start && (
                            <span className="inline-flex items-center"><Calendar className="w-4 h-4 mr-1 text-gray-400" /> {formatDate(ev.start)}</span>
                          )}
                          {(ev.place?.name || ev.entities?.[0]?.name) && (
                            <span className="inline-flex items-center"><MapPin className="w-4 h-4 mr-1 text-gray-400" /> {ev.place?.name || ev.entities?.[0]?.name}</span>
                          )}
                        </div>
                        <div className="mt-3 flex items-center gap-4">
                          <a
                            href={sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Source
                          </a>
                          {onAddFromFeed && (
                            <button
                              type="button"
                              onClick={() => onAddFromFeed(payload)}
                              className="inline-flex items-center text-sm font-medium text-green-700 hover:text-green-800"
                              title="Add this event as an idea"
                            >
                              + Add to ideas
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
      )}
      </div>
    </div>
  );
}

export default EventsFeed;
