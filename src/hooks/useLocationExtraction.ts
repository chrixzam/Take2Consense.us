import { findPlaceFromText } from '../utils/geolocation';

export function useLocationExtraction() {
  // Common location misspellings and corrections
  const locationCorrections: Record<string, string> = {
    'kyoto': 'Kyoto',
    'tokyo': 'Tokyo', 
    'paris': 'Paris',
    'london': 'London',
    'rome': 'Rome',
    'berlin': 'Berlin',
    'madrid': 'Madrid',
    'barcelona': 'Barcelona',
    'amsterdam': 'Amsterdam',
    'vienna': 'Vienna',
    'prague': 'Prague',
    'budapest': 'Budapest',
    'dublin': 'Dublin',
    'edinburgh': 'Edinburgh',
    'stockholm': 'Stockholm',
    'copenhagen': 'Copenhagen',
    'oslo': 'Oslo',
    'helsinki': 'Helsinki',
    'moscow': 'Moscow',
    'istanbul': 'Istanbul',
    'athens': 'Athens',
    'lisbon': 'Lisbon',
    'zurich': 'Zurich',
    'geneva': 'Geneva',
    'milan': 'Milan',
    'florence': 'Florence',
    'venice': 'Venice',
    'naples': 'Naples',
    'sydney': 'Sydney',
    'melbourne': 'Melbourne',
    'brisbane': 'Brisbane',
    'perth': 'Perth',
    'auckland': 'Auckland',
    'wellington': 'Wellington',
    'toronto': 'Toronto',
    'vancouver': 'Vancouver',
    'montreal': 'Montreal',
    'ottawa': 'Ottawa',
    'calgary': 'Calgary',
    'new york': 'New York',
    'los angeles': 'Los Angeles',
    'san francisco': 'San Francisco',
    'chicago': 'Chicago',
    'boston': 'Boston',
    'seattle': 'Seattle',
    'portland': 'Portland',
    'austin': 'Austin',
    'denver': 'Denver',
    'miami': 'Miami',
    'atlanta': 'Atlanta',
    'philadelphia': 'Philadelphia',
    'washington': 'Washington DC',
    'las vegas': 'Las Vegas',
    'san diego': 'San Diego'
  };

  // Normalize and correct location text
  const normalizeLocation = (location: string): string => {
    if (!location) return location;
    
    // Clean up the location string
    let normalized = location.trim().toLowerCase();
    
    // Handle common typos and variations
    normalized = normalized
      .replace(/\bth\b/g, 'the') // Fix "th" -> "the"
      .replace(/\bwinter\b/g, '') // Remove season references for location extraction
      .replace(/\bsummer\b/g, '')
      .replace(/\bspring\b/g, '')
      .replace(/\bfall\b/g, '')
      .replace(/\bautumn\b/g, '')
      .replace(/\bin\s+the\s+/g, 'in ') // "in the" -> "in"
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .trim();

    // Apply corrections from our dictionary
    if (locationCorrections[normalized]) {
      return locationCorrections[normalized];
    }

    // Capitalize first letter of each word for unknown locations
    return normalized.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Enhanced heuristic to extract location phrases from idea text.
  // Looks for patterns like: "brunch in Brooklyn", "museum near Paris", "dinner at Soho", "trip to London".
  const extractLocationFromIdea = (text: string): string | undefined => {
    if (!text) return undefined;
    const lowered = ` ${text.toLowerCase()} `;
    
    // Enhanced patterns to catch more location references, including travel patterns
    const patterns = [
      // Travel patterns - "travel to X", "trip to X", "visit X"
      /(\s|^)(travel\s+to|trip\s+to|visit|visiting|going\s+to|headed\s+to)\s+([A-Za-z][A-Za-z .'-]{1,48})(?=\s|$|[.,;!?:])/i,
      // Standard preposition patterns
      /(\s|^)(in|at|near|around|to|from|exploring)\s+([A-Za-z][A-Za-z .'-]{1,48})(?=\s|$|[.,;!?:])/i,
      // City, State/Country patterns
      /(\s|^)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2,3}|[A-Z][a-z]+)(?=\s|$|[.,;!?:])/,
      // "Let's go to..." patterns
      /(\s|^)(let'?s\s+go\s+to|heading\s+to)\s+([A-Za-z][A-Za-z .'-]{1,48})(?=\s|$|[.,;!?:])/i,
      // Direct city mentions (common city names) - expanded list
      /(\s|^)(new\s+york|los\s+angeles|san\s+francisco|chicago|boston|seattle|portland|austin|denver|miami|atlanta|philadelphia|washington|london|paris|tokyo|berlin|amsterdam|barcelona|rome|madrid|dublin|sydney|melbourne|toronto|vancouver|montreal|kyoto|osaka|beijing|shanghai|hong\s+kong|singapore|bangkok|mumbai|delhi|cairo|dubai|istanbul|moscow|st\s+petersburg)(?=\s|$|[.,;!?:])/i,
    ];
    
    for (const re of patterns) {
      const m = re.exec(text);
      if (m) {
        let candidate: string;
        if (m.length >= 4 && m[2] && m[3]) {
          // City, State/Country pattern
          candidate = `${m[2]}, ${m[3]}`;
        } else if (m.length >= 4 && m[3]) {
          // Standard preposition pattern or travel pattern
          candidate = m[3].trim();
        } else if (m.length >= 3 && m[2]) {
          // Direct city mention
          candidate = m[2].trim();
        } else {
          continue;
        }
        
        candidate = candidate.replace(/[.,;!?:]+$/, '');
        
        // Enhanced stoplist to avoid generic words
        const stoplist = new Set([
          'me', 'us', 'there', 'here', 'somewhere', 'anywhere', 'everywhere',
          'home', 'work', 'school', 'place', 'town', 'city', 'area', 'location',
          'this', 'that', 'these', 'those', 'some', 'any', 'all', 'every',
          'good', 'great', 'nice', 'cool', 'fun', 'awesome', 'amazing',
          'food', 'drink', 'eat', 'restaurant', 'bar', 'cafe', 'shop',
          'winter', 'summer', 'spring', 'fall', 'autumn', 'season',
          'time', 'day', 'night', 'morning', 'afternoon', 'evening'
        ]);
        
        if (!stoplist.has(candidate.toLowerCase()) && candidate.length >= 2) {
          return normalizeLocation(candidate);
        }
      }
    }
    return undefined;
  };

  const inferLocationFromText = async (text: string): Promise<string | undefined> => {
    const extractedLocation = extractLocationFromIdea(text);
    if (extractedLocation) {
      return extractedLocation;
    }

    // Fallback: try to parse the full text with Google Places
    try {
      const placeFromIdea = await findPlaceFromText(text.trim());
      if (placeFromIdea?.label) {
        return placeFromIdea.label;
      }
    } catch {
      // Ignore errors, return undefined
    }

    return undefined;
  };

  return {
    extractLocationFromIdea,
    inferLocationFromText
  };
}
