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
}
