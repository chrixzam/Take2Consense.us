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
}

export interface User {
  id: string;
  name: string;
  avatar?: string;
}

export interface GroupSession {
  id: string;
  name: string;
  description?: string;
  members: User[];
  events: EventIdea[];
  city: string;
  createdAt: Date;
  updatedAt: Date;
}