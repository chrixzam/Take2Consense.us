// Lightweight Google Maps JS API loader using the importLibrary bootstrap
// Reads API key from Vite env: VITE_GOOGLE_MAPS_API_KEY

declare global {
  interface Window {
    google?: any;
  }
}

let loadPromise: Promise<any> | null = null;

export async function loadGoogleMaps(params?: { libraries?: string[]; v?: string }) {
  if (typeof window === 'undefined') throw new Error('Google Maps can only load in a browser');
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  if (!key) throw new Error('Missing VITE_GOOGLE_MAPS_API_KEY');

  // If already loaded, return the global
  if (window.google?.maps?.importLibrary) return window.google.maps;

  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      try {
        const g: Record<string, any> = {
          key,
          v: params?.v || 'weekly',
        };
        const m = document;
        const b = window as any;
        const c = 'google';
        const p = 'The Google Maps JavaScript API';
        const d = (b[c] || (b[c] = {})).maps || ((b[c] = b[c] || {}), (b[c].maps = {}));
        const r = new Set<string>();
        const e = new URLSearchParams();
        let h: Promise<any> | null = null;
        let a: HTMLScriptElement | null = null;
        const q = '__ib__';
        const l = 'importLibrary';
        const u = () =>
          h ||
          (h = new Promise(async (f, n) => {
            a = m.createElement('script');
            e.set('libraries', [...r] + '');
            for (const k in g) e.set(k.replace(/[A-Z]/g, t => '_' + t[0].toLowerCase()), g[k]);
            e.set('callback', c + '.maps.' + q);
            a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
            (d as any)[q] = f;
            a.onerror = () => (h = n(Error(p + ' could not load.')));
            // @ts-ignore - nonce may be undefined
            a.nonce = m.querySelector('script[nonce]')?.nonce || '';
            m.head.append(a);
          }));
        if (d[l]) {
          console.warn(p + ' only loads once. Ignoring:', g);
        } else {
          (d as any)[l] = (f: string, ...n: any[]) => r.add(f) && u().then(() => (d as any)[l](f, ...n));
        }
        // Ensure base libraries are requested
        (params?.libraries || []).forEach(lib => (d as any)[l](lib));
        u().then(() => resolve(window.google.maps)).catch(reject);
      } catch (err) {
        reject(err);
      }
    });
  }

  return loadPromise;
}

