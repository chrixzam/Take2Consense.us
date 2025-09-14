export interface EventIdea {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  budget: number;
  duration: number;
  suggestedBy: string;
  date: Date;
  votes: number;
  voters: string[];
  createdAt: Date;
  imageDataUrl?: string; // base64 data URL for uploaded image
  sourceUrl?: string;    // optional external link
  linkTitle?: string;
  linkDescription?: string;
  linkImageUrl?: string;
  linkSiteName?: string;
  linkFaviconUrl?: string;
}

export interface User {
  id: string;
  name: string;
  avatar?: string;
}

export interface GroupSession {
  id: string;
  shareId: string;
  name: string;
  description?: string;
  members: User[];
  events: EventIdea[];
  city: string;
  userStatedLocation?: string; // The exact location text as stated by the user
  sessionStartDate?: Date; // When the session activities should start
  sessionEndDate?: Date; // When the session activities should end
  createdAt: Date;
  updatedAt: Date;
}

// Normalized event from external feeds (e.g., PredictHQ)
export interface FeedEvent {
  title: string;
  description?: string;
  category?: string;
  start?: string; // ISO string
  end?: string;   // ISO string
  locationName?: string;
  sourceUrl?: string;
  // Optional geo hints when coming from place suggestions
  lat?: number;
  lon?: number;
  address?: string;
}
