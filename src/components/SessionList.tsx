import React, { useState } from 'react';
import { Navigation } from './Navigation';
import { EventsFeed } from './EventsFeed';
import { CitySelector } from './CitySelector';
import { HeroSection } from './HeroSection';
import { PlanningInput } from './PlanningInput';
import { QuickActions } from './QuickActions';
import { SessionGrid } from './SessionGrid';
import type { GroupSession, FeedEvent } from '../types';

type Coords = { lat: number; lon: number };

interface SessionListProps {
  sessions: GroupSession[];
  onSelectSession: (session: GroupSession) => void;
  onCreateNew: () => void;
  onJoinSession: () => void;
  onDeleteSession?: (sessionId: string) => void;
  userCoords?: Coords;
  currentCity: string;
  onCityChange: (city: string) => void;
  userCountry?: string;
  onAddEventFromFeed?: (ev: FeedEvent) => void;
  onOpenProfile?: () => void;
  onCreateSessionFromPlan?: (
    subject: string, 
    events: FeedEvent[], 
    city?: string,
    userStatedLocation?: string,
    sessionStartDate?: Date,
    sessionEndDate?: Date
  ) => void;
}

export function SessionList({ 
  sessions, 
  onSelectSession, 
  onCreateNew, 
  onJoinSession, 
  onDeleteSession, 
  userCoords, 
  currentCity, 
  onCityChange, 
  userCountry, 
  onAddEventFromFeed, 
  onOpenProfile, 
  onCreateSessionFromPlan 
}: SessionListProps) {
  const [showCitySelector, setShowCitySelector] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        currentCity={currentCity} 
        onCityEdit={() => setShowCitySelector(true)} 
        onSettings={onOpenProfile} 
      />
      
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          <HeroSection />
          
          <PlanningInput
            onCreateSessionFromPlan={onCreateSessionFromPlan!}
            userCoords={userCoords}
            currentCity={currentCity}
            userCountry={userCountry}
          />
          
          <QuickActions 
            onCreateNew={onCreateNew}
            onJoinSession={onJoinSession}
          />

          <SessionGrid
            sessions={sessions}
            onSelectSession={onSelectSession}
            onDeleteSession={onDeleteSession}
          />

          {/* Events Feed (defaults to user's location if available) */}
          <EventsFeed 
            query="jazz"
            country={userCountry}
            category="concerts"
            locationAroundOrigin={userCoords ? `${userCoords.lat},${userCoords.lon}` : '40.782409,-73.971885'}
            locationAroundOffset={userCoords ? '10km' : '5mi'}
            onAddFromFeed={onAddEventFromFeed}
          />
          
          <CitySelector
            currentCity={currentCity}
            onCityChange={onCityChange}
            onClose={() => setShowCitySelector(false)}
            isOpen={showCitySelector}
          />
        </div>
      </div>
    </div>
  );
}
