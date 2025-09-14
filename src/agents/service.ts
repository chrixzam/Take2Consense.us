import { AgentRegistry, agentGraph, runAgent } from './index';

export type PlaceSuggestion = { name: string; type: string; lat: number; lon: number; distKm: number; url: string };
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
      return { name, type, lat, lon, distKm, url };
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

  // Gather geolocation context first if available
  const nearby = await fetchNearbyPOIs(idea, coords);
  const nearbyContext = nearby.length
    ? `\n\nNearby options${city ? ` in ${city}` : ''} (within ~4km):\n` +
      nearby
        .map((p, i) => `${i + 1}. ${p.name} (${p.type.replace('_',' ')}) — ${p.distKm.toFixed(1)} km — ${p.url}`)
        .join('\n')
    : '';

  // Fetch relevant events from PredictHQ
  const events = await fetchRelevantEvents(idea, coords, country);
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
        body: JSON.stringify({ agentId, userInput: idea + nearbyContext + eventsContext, mode: 'base', coords, city, country }),
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

  // Local fallback: simple deterministic draft using the prompt.
  const list = nearby.length
    ? '\n\nNearby suggestions:\n' + nearby.map((p, i) => `${i + 1}. ${p.name} — ${(p.distKm*1000|0)} m • ${p.url}`).join('\n')
    : '';
  const eventsList = events.length
    ? '\n\nRelevant nearby events:\n' + events
        .map((e, i) => {
          const title = e.url ? `[${e.title}](${e.url})` : e.title;
          return `${i + 1}. ${title}${e.place ? ` @ ${e.place}` : ''}`;
        })
        .join('\n')
    : '';
  const fallback = `Plan Outline\n\n1) Clarify constraints (budget, time, location).\n2) Generate 3 options relevant to: "${idea}" using nearby places.\n3) Compare pros/cons, pick a lead.\n4) Propose date/time and rough budget.\n5) Next steps: confirm attendees, book venue.${list}`;
  return { text: fallback + eventsList, model, provider, source: 'local', places: nearby, events };
}
