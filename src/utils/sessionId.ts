// Generate a unique, human-readable session ID
export const generateSessionId = (location?: string): string => {
  const adjectives = [
    'amazing', 'brilliant', 'creative', 'delightful', 'energetic', 'fantastic',
    'glorious', 'happy', 'inspiring', 'joyful', 'lively', 'magnificent',
    'optimistic', 'peaceful', 'radiant', 'stellar', 'vibrant', 'wonderful'
  ];
  
  const nouns = [
    'adventure', 'celebration', 'discovery', 'expedition', 'festival', 'gathering',
    'journey', 'meetup', 'outing', 'party', 'quest', 'reunion',
    'social', 'trip', 'venture', 'weekend'
  ];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 999) + 1;
  
  // If location is provided, incorporate it into the session ID
  if (location) {
    const locationSlug = generateLocationSlug(location);
    if (locationSlug) {
      return `${adjective}-${noun}-${locationSlug}-${number}`;
    }
  }
  
  return `${adjective}-${noun}-${number}`;
};

// Generate a location-based slug from a location string
const generateLocationSlug = (location: string): string | null => {
  if (!location || typeof location !== 'string') return null;
  
  // Clean and normalize the location string
  const cleaned = location
    .toLowerCase()
    .trim()
    // Remove common prefixes/suffixes
    .replace(/^(in|at|near|around|to|from|visiting|exploring)\s+/i, '')
    .replace(/\s+(city|town|area|region|county|state|country)$/i, '')
    // Remove special characters and extra spaces
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  if (!cleaned || cleaned.length < 2) return null;
  
  // Handle common city abbreviations and mappings
  const locationMappings: Record<string, string> = {
    'new-york': 'nyc',
    'new-york-city': 'nyc',
    'los-angeles': 'la',
    'san-francisco': 'sf',
    'san-fran': 'sf',
    'chicago': 'chi',
    'washington-dc': 'dc',
    'washington': 'dc',
    'las-vegas': 'vegas',
    'new-orleans': 'nola',
    'philadelphia': 'philly',
    'boston': 'bos',
    'seattle': 'sea',
    'portland': 'pdx',
    'miami': 'mia',
    'atlanta': 'atl',
    'denver': 'den',
    'austin': 'atx',
    'nashville': 'nash',
    'london': 'ldn',
    'paris': 'par',
    'tokyo': 'tky',
    'berlin': 'ber',
    'amsterdam': 'ams',
    'barcelona': 'bcn',
    'rome': 'rom',
    'madrid': 'mad',
    'dublin': 'dub',
    'sydney': 'syd',
    'melbourne': 'mel',
    'toronto': 'tor',
    'vancouver': 'van',
    'montreal': 'mtl'
  };
  
  // Use mapping if available, otherwise truncate long names
  const mapped = locationMappings[cleaned];
  if (mapped) return mapped;
  
  // For longer location names, take first few characters or first word
  if (cleaned.length > 8) {
    const firstWord = cleaned.split('-')[0];
    return firstWord.length >= 3 ? firstWord.slice(0, 6) : cleaned.slice(0, 6);
  }
  
  return cleaned;
};

export const validateSessionId = (id: string): boolean => {
  // Updated validation for the format: word-word-[location-]number
  const pattern = /^[a-z]+-[a-z]+(-[a-z0-9]+)?-\d{1,3}$/;
  return pattern.test(id);
};
