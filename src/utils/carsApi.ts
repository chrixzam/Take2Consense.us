export type CarSearchParams = {
  bookerCountry: string; // ISO-3166-1 alpha-2 e.g. 'us'
  currency: string; // e.g. 'USD'
  driverAge: number; // e.g. 30
  pickupAirport?: string; // IATA code, optional
  dropoffAirport?: string; // IATA code, optional
  pickupDateTime: string; // yyyy-MM-ddTHH:mm[:ss]
  dropoffDateTime: string; // yyyy-MM-ddTHH:mm[:ss]
};

export type CarSearchResponse = {
  data: any[];
};

export async function searchCars(params: CarSearchParams): Promise<CarSearchResponse> {
  const base = (import.meta as any).env?.VITE_AGENT_API_URL as string | undefined;
  if (!base) {
    throw new Error('Missing VITE_AGENT_API_URL for cars search proxy');
  }
  const url = `${base.replace(/\/$/, '')}/cars/search`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Cars search failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`);
  }
  return (await res.json()) as CarSearchResponse;
}

