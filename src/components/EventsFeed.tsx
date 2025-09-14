import React, { useEffect, useMemo, useState } from 'react';

type EventbriteEvent = {
  id: string;
  name: { text: string | null };
  description?: { text: string | null };
  summary?: string | null;
  url: string;
  start: { timezone: string; local: string };
  end: { timezone: string; local: string };
  status: string;
  is_free?: boolean;
  logo?: { url: string | null } | null;
  venue?: {
    name?: string | null;
    address?: {
      city?: string | null;
      region?: string | null;
      country?: string | null;
      localized_address_display?: string | null;
    } | null;
  } | null;
};

type EventsFeedProps = {
  // Optional: provide token explicitly; otherwise uses env, localStorage, or URL param
  token?: string;
  // Optional: limit number of events shown
  limit?: number;
  // Optional: force a specific organization ID
  organizationId?: string;
};

function resolveToken(propToken?: string): string | null {
  // Priority: prop -> env -> localStorage -> URL param `eventbrite_token`
  const envToken = (import.meta as any).env?.VITE_EVENTBRITE_TOKEN as string | undefined;
  const lsToken = typeof window !== 'undefined' ? localStorage.getItem('eventbrite_token') : null;
  const urlToken = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('eventbrite_token') : null;
  return propToken || envToken || lsToken || urlToken || null;
}

function detectTokenSource(propToken?: string): string | null {
  const envToken = (import.meta as any).env?.VITE_EVENTBRITE_TOKEN as string | undefined;
  const lsToken = typeof window !== 'undefined' ? localStorage.getItem('eventbrite_token') : null;
  const urlToken = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('eventbrite_token') : null;
  if (propToken) return 'prop';
  if (envToken) return 'env';
  if (lsToken) return 'localStorage';
  if (urlToken) return 'url';
  return null;
}

function formatDate(isoLocal: string): string {
  const d = new Date(isoLocal);
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

async function fetchJSON(url: string, token: string, signal?: AbortSignal) {
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    signal,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} on ${url}: ${text || res.statusText}`);
  }
  return res.json();
}

export function EventsFeed({ token, limit = 6, organizationId }: EventsFeedProps) {
  const [events, setEvents] = useState<EventbriteEvent[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string | null>(null);

  const resolvedToken = useMemo(() => resolveToken(token), [token]);
  const tokenSource = useMemo(() => detectTokenSource(token), [token]);

  useEffect(() => {
    if (!resolvedToken) return;
    const controller = new AbortController();
    const base = 'https://www.eventbriteapi.com/v3';
    const tryFetch = async () => {
      setLoading(true);
      setError(null);
      setDebug(null);
      try {
        // 1) Try users/me/owned_events
        const q = new URLSearchParams({ status: 'live,started', order_by: 'start_asc', expand: 'venue,logo' });
        let data: any = null;
        try {
          data = await fetchJSON(`${base}/users/me/owned_events/?${q.toString()}`, resolvedToken, controller.signal);
          const items = Array.isArray(data?.events) ? data.events : [];
          if (items.length > 0) {
            setEvents(items);
            return;
          }
          setDebug('No events in owned_events; trying other endpoints.');
        } catch (err: any) {
          setDebug(`owned_events failed: ${err.message}`);
        }

        // 2) Try users/me/events (attending/created)
        try {
          data = await fetchJSON(`${base}/users/me/events/?${q.toString()}`, resolvedToken, controller.signal);
          const items = Array.isArray(data?.events) ? data.events : [];
          if (items.length > 0) {
            setEvents(items);
            return;
          }
          setDebug((d) => (d ? d + ' | ' : '') + 'users/me/events empty; trying org.');
        } catch (err: any) {
          setDebug((d) => (d ? d + ' | ' : '') + `users/me/events failed: ${err.message}`);
        }

        // 3) If we have an organizationId prop, use that; otherwise fetch first org
        let orgId = organizationId;
        if (!orgId) {
          try {
            const orgs = await fetchJSON(`${base}/users/me/organizations/`, resolvedToken, controller.signal);
            const first = Array.isArray(orgs?.organizations) ? orgs.organizations[0] : null;
            orgId = first?.id || null;
          } catch (err: any) {
            setDebug((d) => (d ? d + ' | ' : '') + `failed to load organizations: ${err.message}`);
          }
        }

        if (orgId) {
          try {
            data = await fetchJSON(`${base}/organizations/${orgId}/events/?${q.toString()}`, resolvedToken, controller.signal);
            const items = Array.isArray(data?.events) ? data.events : [];
            setEvents(items);
            return;
          } catch (err: any) {
            setDebug((d) => (d ? d + ' | ' : '') + `org events failed: ${err.message}`);
          }
        }

        // If we got here, nothing worked
        setEvents([]);
        setError('No events found or access denied.');
      } catch (e: any) {
        if (e.name === 'AbortError') return;
        setEvents([]);
        setError(e?.message || 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };
    tryFetch();
    return () => controller.abort();
  }, [resolvedToken, organizationId]);

  const hasToken = Boolean(resolvedToken);
  const displayEvents = (events || []).slice(0, limit);

  return (
    <section className="max-w-4xl mx-auto mt-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Upcoming Events</h2>
        <div className="text-sm text-gray-500">
          Powered by Eventbrite
          {hasToken && tokenSource && (
            <span className="ml-2 text-xs text-gray-400">(token: {tokenSource})</span>
          )}
        </div>
      </div>

      {!hasToken && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-4">
          Provide an Eventbrite token to load events. Add `?eventbrite_token=YOUR_TOKEN` to the URL or set `VITE_EVENTBRITE_TOKEN`.
        </div>
      )}

      {hasToken && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          {loading && (
            <div className="animate-pulse space-y-3">
              <div className="h-5 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
          )}

          {!loading && error && (
            <div className="text-red-600 text-sm">
              {error}
              {debug && (
                <div className="mt-1 text-xs text-gray-500">{debug}</div>
              )}
            </div>
          )}

          {!loading && !error && displayEvents.length === 0 && (
            <div className="text-gray-500 text-sm">No upcoming events found.</div>
          )}

          {!loading && !error && displayEvents.length > 0 && (
            <ul className="divide-y divide-gray-100">
              {displayEvents.map((ev) => (
                <li key={ev.id} className="py-4 flex items-start gap-4">
                  {ev.logo?.url ? (
                    <img
                      src={ev.logo.url}
                      alt={ev.name?.text || 'Event image'}
                      className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 text-xs flex-shrink-0">
                      No Image
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <a href={ev.url} target="_blank" rel="noreferrer" className="block">
                      <h3 className="text-base font-medium text-gray-900 hover:text-blue-600 truncate">
                        {ev.name?.text || 'Untitled Event'}
                      </h3>
                    </a>
                    <div className="text-sm text-gray-600 mt-1">
                      {formatDate(ev.start.local)}
                      {ev.venue?.address?.localized_address_display && (
                        <span className="text-gray-400"> • </span>
                      )}
                      {ev.venue?.address?.localized_address_display}
                    </div>
                    {ev.summary && (
                      <p className="text-sm text-gray-700 mt-1 line-clamp-2">{ev.summary}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

export default EventsFeed;
