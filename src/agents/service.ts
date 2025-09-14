import { AgentRegistry, agentGraph, runAgent } from './index';
import { forwardGeocodeCity } from '../utils/geolocation';

export type PlaceSuggestion = { name: string; type: string; lat: number; lon: number; distKm: number; url: string; address?: string; priceLevel?: string };
export type EventSuggestion = { title: string; place?: string; start?: string; url?: string; category?: string };

export type PlanResult = {
  text: string;
  model?: string;
  provider?: string;
  source: 'api' | 'openai' | 'anthropic' | 'local';
  places?: PlaceSuggestion[];
  events?: EventSuggestion[];
};

const registry = new AgentRegistry(agentGraph);

function normalizeModelId(model?: string) {
  if (!model) return undefined;
  // Accept values like 'openai/gpt-4.1-mini-2025-04-14' and return provider + bare model id
  const parts = model.split('/');
  if (parts.length === 2) return { provider: parts[0], model: parts[1] };
  return { provider: 'openai', model }; // best effort
}

type Coords = { lat: number; lon: number };

function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const A =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(A), Math.sqrt(1 - A));
}

// Google Places API: Text Search (v1)
async function fetchGooglePlacesTextSearch(idea: string, coords?: Coords): Promise<PlaceSuggestion[]> {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  if (!key || !coords || !idea.trim()) return [];
  try {
    const body = {
      textQuery: idea.slice(0, 120),
      maxResultCount: 8,
      locationBias: {
        circle: {
          center: { latitude: coords.lat, longitude: coords.lon },
          radius: 4000,
        },
      },
    };
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        // Request fields similar to provided curl plus coords/uri/types for our UI
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.priceLevel,places.location,places.types,places.googleMapsUri',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) return [];
    const data: any = await res.json();
    const places: any[] = Array.isArray(data?.places) ? data.places : [];
    const mapped: PlaceSuggestion[] = places
      .map((p: any) => {
        const name = p.displayName?.text || 'Unnamed place';
        const lat = p.location?.latitude;
        const lon = p.location?.longitude;
        const type = Array.isArray(p.types) && p.types.length ? p.types[0] : 'poi';
        const url = p.googleMapsUri || '';
        const address = p.formattedAddress || undefined;
        const priceLevel = p.priceLevel || undefined; // enum string
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
        const distKm = haversineKm(coords, { lat, lon });
        return { name, type, lat, lon, distKm, url, address, priceLevel } as PlaceSuggestion;
      })
      .filter(Boolean) as PlaceSuggestion[];
    return mapped.sort((a, b) => a.distKm - b.distKm).slice(0, 8);
  } catch {
    return [];
  }
}

async function fetchNearbyPOIs(idea: string, coords?: Coords) {
  if (!coords) return [] as PlaceSuggestion[];

  const text = idea.toLowerCase();
  // Very small heuristic for place categories
  const cuisineMatch = text.match(/(sushi|ramen|pizza|tacos?|burger|steak|vegan|vegetarian|thai|indian|mexican|chinese|korean|mediterranean|bbq)/);
  const wantsFood = /(eat|food|restaurant|dinner|lunch|brunch)/.test(text) || !!cuisineMatch;
  const wantsCoffee = /(coffee|cafe|latte|espresso)/.test(text);
  const wantsBar = /(bar|pub|cocktails?|drinks?)/.test(text);
  const wantsPark = /(park|outdoor|picnic)/.test(text);
  const wantsMuseum = /(museum|exhibit|gallery)/.test(text);
  const wantsCinema = /(movie|cinema|theater)/.test(text);

  const radiusM = 4000; // 4km
  const clauses: string[] = [];

  const around = `(around:${radiusM},${coords.lat},${coords.lon})`;
  const addPOI = (selector: string) => {
    clauses.push(`node${selector}${around};`);
    clauses.push(`way${selector}${around};`);
    clauses.push(`relation${selector}${around};`);
  };

  if (wantsFood) {
    const cuisine = cuisineMatch?.[1];
    if (cuisine) {
      addPOI(`["amenity"="restaurant"]["cuisine"~"${cuisine}",i]`);
    } else {
      addPOI(`["amenity"="restaurant"]`);
    }
  }
  if (wantsCoffee) addPOI(`["amenity"="cafe"]`);
  if (wantsBar) addPOI(`["amenity"="bar"],["amenity"="pub"]`); // will split into two entries because of comma
  if (wantsPark) addPOI(`["leisure"="park"]`);
  if (wantsMuseum) addPOI(`["tourism"="museum"]`);
  if (wantsCinema) addPOI(`["amenity"="cinema"]`);

  if (clauses.length === 0) return [];

  // Build Overpass query
  const query = `
    [out:json][timeout:25];
    (
      ${clauses.join('\n      ')}
    );
    out center 20;
  `;

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: new URLSearchParams({ data: query }).toString(),
    });
    if (!res.ok) return [];
    const data: any = await res.json();
    const elems: any[] = Array.isArray(data?.elements) ? data.elements : [];
    const results = elems.map((el: any) => {
      const lat = el.lat || el.center?.lat;
      const lon = el.lon || el.center?.lon;
      const name = el.tags?.name || 'Unnamed place';
      // Haversine distance in km
      const R = 6371;
      const dLat = ((lat - coords.lat) * Math.PI) / 180;
      const dLon = ((lon - coords.lon) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(coords.lat * Math.PI/180) * Math.cos(lat * Math.PI/180) * Math.sin(dLon / 2) ** 2;
      const distKm = 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const type = el.tags?.amenity || el.tags?.leisure || el.tags?.tourism || 'poi';
      const url = el.id ? `https://www.openstreetmap.org/${el.type || 'node'}/${el.id}` : '';
      const address = el.tags?.['addr:full'] || el.tags?.['addr:street'] || undefined;
      return { name, type, lat, lon, distKm, url, address };
    })
    .filter(r => Number.isFinite(r.lat) && Number.isFinite(r.lon))
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, 8);
    return results as PlaceSuggestion[];
  } catch {
    return [];
  }
}

async function fetchRelevantEvents(idea: string, coords?: Coords, country?: string) {
  // Mirror EventsFeed token logic
  const envToken = import.meta.env.VITE_PREDICTHQ_TOKEN as string | undefined;
  const token = envToken && envToken.trim().length > 0
    ? envToken
    : '4vd1wx00yGqZtYdxxZMH3lZmX39f2nBlJ3A_uIz2';
  if (!token || !coords) return [] as EventSuggestion[];

  try {
    const params = new URLSearchParams();
    if (idea) params.set('q', idea.slice(0, 100));
    params.set('limit', '5');
    if (country) params.set('country', country);
    params.set('sort', 'start');
    params.set('active.gte', new Date().toISOString());
    params.set('location_around.origin', `${coords.lat},${coords.lon}`);
    params.set('location_around.offset', '10km');

    const res = await fetch(`https://api.predicthq.com/v1/events/?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const data: any = await res.json();
    const results: any[] = Array.isArray(data?.results) ? data.results : [];
    return results.slice(0, 5).map((ev: any) => {
      const searchQuery = encodeURIComponent([ev.title, ev.place?.name || ev.entities?.[0]?.name].filter(Boolean).join(' '));
      return {
        title: ev.title || 'Untitled event',
        place: ev.place?.name || ev.entities?.[0]?.name,
        start: ev.start,
        category: ev.category,
        url: `https://www.google.com/search?q=${searchQuery}`,
      } as EventSuggestion;
    });
  } catch {
    return [];
  }
}

export async function planWithAgent(idea: string, agentId = 'planner', coords?: Coords, city?: string, country?: string): Promise<PlanResult> {
  const agent = registry.get(agentId);
  if (!agent) {
    return { text: 'Agent not found.', source: 'local' };
  }

  // First, use our runner to build the combined prompt and select model/provider
  const prep = await runAgent(agent, idea, { mode: 'base' });
  // Force Anthropic for start planning per requirement
  const { model, provider } = (() => {
    const norm = normalizeModelId(prep.model);
    const forcedProvider = 'anthropic';
    const forcedModel = (norm?.provider === 'anthropic' ? norm?.model : undefined) || (prep.provider === 'anthropic' ? prep.model : undefined) || 'anthropic/claude-3-5-sonnet-20240620';
    return { model: forcedModel, provider: forcedProvider };
  })();

  // Ensure we have coordinates: try forward-geocode the city if missing
  let usedCoords: Coords | undefined = coords;
  if (!usedCoords && city) {
    try {
      const geo = await forwardGeocodeCity(city);
      if (geo?.coords) usedCoords = geo.coords;
      if (!country && geo?.countryCode) country = geo.countryCode;
    } catch {}
  }

  // Gather geolocation context: prefer Google Places if key present; fallback to Overpass
  let nearby: PlaceSuggestion[] = [];
  try {
    nearby = await fetchGooglePlacesTextSearch(idea, usedCoords);
  } catch {}
  if (nearby.length === 0) {
    nearby = await fetchNearbyPOIs(idea, usedCoords);
  }
  const nearbyContext = nearby.length
    ? `\n\nNearby options${city ? ` in ${city}` : ''} (within ~4km):\n` +
      nearby
        .map((p, i) => `${i + 1}. ${p.name} (${p.type.replace('_',' ')}) — ${p.distKm.toFixed(1)} km — ${p.url}`)
        .join('\n')
    : '';

  // Fetch relevant events from PredictHQ
  const events = await fetchRelevantEvents(idea, usedCoords, country);
  const eventsContext = events.length
    ? `\n\nUpcoming events related to "${idea}" nearby:` +
      '\n' +
      events
        .map((e, i) => {
          const when = e.start ? new Date(e.start).toLocaleString() : 'date TBA';
          const where = e.place ? ` @ ${e.place}` : '';
          const cat = e.category ? ` • ${e.category}` : '';
          const title = e.url ? `[${e.title}](${e.url})` : e.title;
          return `${i + 1}. ${title}${where}${cat} — ${when}`;
        })
        .join('\n')
    : '';

  // Prefer calling a backend proxy if configured to avoid CORS and protect keys
  const apiUrl = import.meta.env.VITE_AGENT_API_URL as string | undefined;
  if (apiUrl) {
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, userInput: idea + nearbyContext + eventsContext, mode: 'base', coords: usedCoords, city, country }),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          text: data.text || String(data),
          model: data.model || model,
          provider: data.provider || provider,
          source: 'api',
          places: nearby,
          events,
        };
      }
    } catch (_) {
      // fall through to direct provider call
    }
  }

  const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
  if (anthropicKey) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: (model || 'claude-3-5-sonnet-20240620').replace(/^anthropic\//,''),
          max_tokens: 800,
          system: prep.preparedPrompt.split('\n\n[User]\n')[0],
          messages: [ { role: 'user', content: idea + nearbyContext + eventsContext } ],
        }),
      });
      if (response.ok) {
        const data: any = await response.json();
        const text = data?.content?.[0]?.text || JSON.stringify(data);
        return { text, model, provider, source: 'anthropic', places: nearby, events };
  }
    } catch (_) {}
  }

  // Local fallback: keep left column minimal; suggestions remain on the right.
  const fallback = `Draft prepared for "${idea}".`;
  return { text: fallback, model, provider, source: 'local', places: nearby, events };
}
