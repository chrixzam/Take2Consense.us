export interface LinkPreviewMeta {
  title?: string;
  description?: string;
  imageUrl?: string;
  siteName?: string;
  faviconUrl?: string;
}

// Fetch metadata using Microlink (public, CORS-enabled, rate-limited)
export async function fetchLinkPreview(url: string, timeoutMs = 6000): Promise<LinkPreviewMeta | null> {
  if (!url) return null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const api = `https://api.microlink.io?url=${encodeURIComponent(url)}&audio=false&video=false&screenshot=false&meta=false`;
    const res = await fetch(api, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const json = await res.json();
    const data = json?.data || {};
    const meta: LinkPreviewMeta = {
      title: data.title || undefined,
      description: data.description || undefined,
      imageUrl: data.image?.url || undefined,
      siteName: data.publisher || data.lang || undefined,
      faviconUrl: data.logo?.url || undefined,
    };
    return meta;
  } catch {
    return null;
  }
}

