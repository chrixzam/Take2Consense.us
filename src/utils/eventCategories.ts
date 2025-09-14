export const categorizeEvent = (title: string, description: string): string => {
  const text = `${title} ${description}`.toLowerCase();

  const categories = {
    'Food & Dining': [
      'restaurant', 'food', 'eat', 'dinner', 'lunch', 'breakfast', 'cafe', 'coffee',
      'pizza', 'sushi', 'brunch', 'cooking', 'kitchen', 'chef', 'meal', 'dining',
      'bar', 'drinks', 'cocktail', 'wine', 'beer', 'happy hour', 'pub', 'brewery'
    ],
    'Entertainment': [
      'movie', 'cinema', 'film', 'theater', 'show', 'concert', 'music', 'band',
      'comedy', 'club', 'nightlife', 'dance', 'party', 'game', 'arcade', 'bowling',
      'karaoke', 'trivia', 'entertainment', 'performance', 'stage'
    ],
    'Outdoor': [
      'park', 'hike', 'trail', 'outdoor', 'nature', 'beach', 'lake', 'mountain',
      'camping', 'picnic', 'walk', 'run', 'bike', 'cycling', 'kayak', 'fishing',
      'garden', 'zoo', 'outside', 'fresh air', 'sunshine', 'swim'
    ],
    'Culture': [
      'museum', 'art', 'gallery', 'history', 'culture', 'exhibition', 'library',
      'book', 'education', 'learn', 'tour', 'historic', 'monument', 'architecture',
      'cultural', 'heritage', 'science', 'planetarium', 'aquarium'
    ],
    'Sports': [
      'sport', 'game', 'match', 'stadium', 'basketball', 'football', 'baseball',
      'soccer', 'tennis', 'golf', 'hockey', 'volleyball', 'swimming', 'gym',
      'fitness', 'workout', 'exercise', 'athletic', 'competition', 'tournament'
    ],
    'Shopping': [
      'shop', 'shopping', 'mall', 'store', 'market', 'boutique', 'retail',
      'browse', 'buy', 'purchase', 'outlet', 'bazaar', 'fair', 'craft',
      'antique', 'thrift', 'department store'
    ],
    'Social': [
      'meet', 'gathering', 'social', 'friends', 'hangout', 'chat', 'talk',
      'visit', 'catch up', 'reunion', 'celebration', 'birthday', 'anniversary',
      'holiday', 'festival', 'community', 'group', 'club', 'society'
    ]
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return category;
    }
  }

  return 'Other';
};

export const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    'Food & Dining': '🍽️',
    'Entertainment': '🎭',
    'Outdoor': '🌲',
    'Culture': '🏛️',
    'Sports': '⚽',
    'Shopping': '🛍️',
    'Social': '👥',
    'Other': '📌'
  };

  return icons[category] || icons.Other;
};