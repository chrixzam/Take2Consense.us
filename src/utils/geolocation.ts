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
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const { lat, lon } = coords;
  if (!key) throw new Error('Missing VITE_GOOGLE_MAPS_API_KEY');
  // Use classic Geocoding API for broad compatibility
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(lat + ',' + lon)}&key=${encodeURIComponent(
    key
  )}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Reverse geocode failed: ${res.status}`);
  const data = await res.json();
  const result = Array.isArray(data?.results) && data.results.length > 0 ? data.results[0] : null;
  if (!result) return { label: 'Unknown location' };
  const components: Array<{ long_name: string; short_name: string; types: string[] }> = result.address_components || [];
  const byType = (t: string) => components.find(c => c.types.includes(t));
  const locality = byType('locality')?.long_name || byType('postal_town')?.long_name || byType('sublocality')?.long_name;
  const admin1 = byType('administrative_area_level_1')?.short_name || byType('administrative_area_level_1')?.long_name;
  const countryCode = byType('country')?.short_name;
  const label = [locality, admin1].filter(Boolean).join(', ') || result.formatted_address || 'Unknown location';
  return { label, countryCode };
}

// Forward geocode a city/place name to coordinates using Open-Meteo's free geocoding API
// https://open-meteo.com/en/docs/geocoding-api
export async function forwardGeocodeCity(name: string): Promise<{ coords: Coordinates; countryCode?: string } | null> {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const q = name.trim();
  if (!q || !key) return null;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const first = Array.isArray(data?.results) && data.results.length > 0 ? data.results[0] : null;
  if (!first) return null;
  const loc = first.geometry?.location;
  const lat = Number(loc?.lat);
  const lon = Number(loc?.lng);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
  const components: Array<{ long_name: string; short_name: string; types: string[] }> = first.address_components || [];
  const countryCode = components.find(c => c.types.includes('country'))?.short_name;
  return { coords: { lat, lon }, countryCode };
}

async function googleGeolocate(): Promise<Coordinates | null> {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  if (!key) return null;
  try {
    const res = await fetch(`https://www.googleapis.com/geolocation/v1/geolocate?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ considerIp: true }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const lat = Number(data?.location?.lat);
    const lon = Number(data?.location?.lng);
    if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon };
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
  // Fallback to Google Geolocation API (IP/WiFi/cell)
  try {
    const coords = await googleGeolocate();
    if (coords) {
      const details = await reverseGeocode(coords);
      return { city: details.label, coords, countryCode: details.countryCode };
    }
  } catch {}
  return null;
}
