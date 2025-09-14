export type Coordinates = { lat: number; lon: number };

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
export async function reverseGeocode(coords: Coordinates): Promise<string> {
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
  return label;
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

export async function detectCity(): Promise<{ city: string; coords: Coordinates } | null> {
  // Try GPS first
  try {
    const pos = await getCurrentPosition();
    const coords: Coordinates = {
      lat: pos.coords.latitude,
      lon: pos.coords.longitude,
    };
    const city = await reverseGeocode(coords);
    return { city, coords };
  } catch {}
  // Fallback to IP-based geolocation
  try {
    const ip = await ipFallback();
    if (ip) return ip;
  } catch {}
  return null;
}
