export type FlightSearchParams = {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string; // yyyy-MM-dd
  returnDate?: string; // yyyy-MM-dd
  adults: number;
  currencyCode?: string; // e.g. USD
  nonStop?: boolean;
  max?: number; // 1-250
};

export type FlightOffer = any;

export type FlightSearchResponse = {
  data: FlightOffer[];
  dictionaries?: Record<string, any>;
};

export async function searchFlights(params: FlightSearchParams): Promise<FlightSearchResponse> {
  const base = (import.meta as any).env?.VITE_AMADEUS_BASE_URL as string | undefined || 'https://test.api.amadeus.com';
  const token = (import.meta as any).env?.VITE_AMADEUS_ACCESS_TOKEN as string | undefined;
  if (!token) throw new Error('Missing VITE_AMADEUS_ACCESS_TOKEN');

  const qs = new URLSearchParams();
  qs.set('originLocationCode', params.originLocationCode.toUpperCase());
  qs.set('destinationLocationCode', params.destinationLocationCode.toUpperCase());
  qs.set('departureDate', params.departureDate);
  if (params.returnDate) qs.set('returnDate', params.returnDate);
  qs.set('adults', String(Math.max(1, params.adults)));
  if (params.currencyCode) qs.set('currencyCode', params.currencyCode.toUpperCase());
  if (typeof params.nonStop === 'boolean') qs.set('nonStop', String(params.nonStop));
  if (params.max != null) qs.set('max', String(params.max));

  const url = `${base.replace(/\/$/, '')}/v2/shopping/flight-offers?${qs.toString()}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Amadeus search failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`);
  }
  const json = await res.json();
  return json as FlightSearchResponse;
}

export function summarizeOffer(offer: any, dictionaries?: any): { route?: string; duration?: string; carriers?: string } {
  if (!offer) return {};
  const itins = Array.isArray(offer.itineraries) ? offer.itineraries : [];
  const segs = itins[0]?.segments || [];
  const legs: string[] = [];
  const carrierCodes: Set<string> = new Set();
  for (const s of segs) {
    const from = s?.departure?.iataCode;
    const to = s?.arrival?.iataCode;
    if (s?.carrierCode) carrierCodes.add(s.carrierCode);
    if (from && to) legs.push(`${from}→${to}`);
  }
  const route = legs.join(' · ');
  const duration = itins.map((i: any) => i?.duration).filter(Boolean).join(' / ');
  const dict = dictionaries?.carriers || {};
  const carriers = Array.from(carrierCodes).map(c => dict[c] || c).join(', ');
  return { route, duration, carriers };
}

