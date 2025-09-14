// Generate a unique, human-readable session ID
export const generateSessionId = (): string => {
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
  
  return `${adjective}-${noun}-${number}`;
};

export const validateSessionId = (id: string): boolean => {
  // Simple validation for the format: word-word-number
  const pattern = /^[a-z]+-[a-z]+-\d{1,3}$/;
  return pattern.test(id);
};