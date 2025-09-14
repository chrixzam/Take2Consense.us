export type Coordinates = { lat: number; lon: number };
export type GeoResult = { city: string; coords: Coordinates; countryCode?: string };

// Wrap navigator.geolocation in a Promise with sane defaults
export function getCurrentPosition(options: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000,
}): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

// Reverse geocode using BigDataCloud public endpoint (no API key required)
// https://www.bigdatacloud.com/docs/api/free-reverse-geocode-client
export async function reverseGeocode(coords: Coordinates): Promise<{ label: string; countryCode?: string }> {
  const { lat, lon } = coords;
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(
    lat
  )}&longitude=${encodeURIComponent(lon)}&localityLanguage=en`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Reverse geocode failed: ${res.status}`);
  const data = await res.json();
  const city = data.city || data.locality || data.principalSubdivision || data.localityInfo?.administrative?.[0]?.name;
  const region = data.principalSubdivision || data.countryCode;
  const country = data.countryName || data.countryCode;
  const parts = [city, region].filter(Boolean);
  const label = parts.length > 0 ? parts.join(', ') : country || 'Unknown location';
  const countryCode: string | undefined = typeof data.countryCode === 'string' ? data.countryCode : undefined;
  return { label, countryCode };
}

// Forward geocode a city/place name to coordinates using Open-Meteo's free geocoding API
// https://open-meteo.com/en/docs/geocoding-api
export async function forwardGeocodeCity(name: string): Promise<{ coords: Coordinates; countryCode?: string } | null> {
  const q = name.trim();
  if (!q) return null;
  const url = `https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&name=${encodeURIComponent(q)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const first = Array.isArray(data?.results) && data.results.length > 0 ? data.results[0] : null;
  if (!first) return null;
  const lat = Number(first.latitude);
  const lon = Number(first.longitude);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
  const coords = { lat, lon };
  const code = typeof first.country_code === 'string' ? String(first.country_code).toUpperCase() : undefined;
  return { coords, countryCode: code };
}

async function ipFallback(): Promise<{ city: string; coords: Coordinates } | null> {
  try {
    // Try ipwho.is first
    const res = await fetch('https://ipwho.is/?output=json');
    if (res.ok) {
      const data = await res.json();
      if (data?.success !== false) {
        const city = [data.city, data.region].filter(Boolean).join(', ') || data.country || 'Unknown location';
        const coords = { lat: Number(data.latitude), lon: Number(data.longitude) };
        if (!Number.isNaN(coords.lat) && !Number.isNaN(coords.lon)) {
          return { city, coords };
        }
      }
    }
  } catch {}
  try {
    // Fallback to ipapi.co
    const res2 = await fetch('https://ipapi.co/json/');
    if (res2.ok) {
      const d = await res2.json();
      const city = [d.city, d.region].filter(Boolean).join(', ') || d.country_name || 'Unknown location';
      const coords = { lat: Number(d.latitude), lon: Number(d.longitude) };
      if (!Number.isNaN(coords.lat) && !Number.isNaN(coords.lon)) {
        return { city, coords };
      }
    }
  } catch {}
  return null;
}

export async function detectCity(): Promise<GeoResult | null> {
  // Try GPS first
  try {
    const pos = await getCurrentPosition();
    const coords: Coordinates = {
      lat: pos.coords.latitude,
      lon: pos.coords.longitude,
    };
    const details = await reverseGeocode(coords);
    return { city: details.label, coords, countryCode: details.countryCode };
  } catch {}
  // Fallback to IP-based geolocation
  try {
    const ip = await ipFallback();
    if (ip) return ip;
  } catch {}
  return null;
}
