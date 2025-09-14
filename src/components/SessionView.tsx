import React, { useState } from 'react';
import { Navigation } from './Navigation';
import { IdeaSubmissionForm } from './IdeaSubmissionForm';
import { EventCard } from './EventCard';
import { CalendarView } from './CalendarView';
import { RandomSuggestion } from './RandomSuggestion';
import { CitySelector } from './CitySelector';
import { ShareSessionModal } from './ShareSessionModal';
import { EventsFeed } from './EventsFeed';
import { EventIdea, User, GroupSession } from '../types';
import { categorizeEvent } from '../utils/eventCategories';
import { forwardGeocodeCity } from '../utils/geolocation';
import { Calendar, Grid3X3, Sparkles, Users, MapPin, Share2 } from 'lucide-react';
import type { FeedEvent } from '../types';

interface SessionViewProps {
  session: GroupSession;
  currentUser: User;
  onUpdateSession: (session: GroupSession) => void;
  onBack: () => void;
}

export function SessionView({ session, currentUser, onUpdateSession, onBack }: SessionViewProps) {
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showRandomModal, setShowRandomModal] = useState(false);
  const [activeView, setActiveView] = useState<'grid' | 'calendar'>('grid');
  const [sessionCoords, setSessionCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [sessionCountry, setSessionCountry] = useState<string | undefined>(undefined);

  // Geocode the session city to use in the EventsFeed
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const geo = await forwardGeocodeCity(session.city);
        if (!alive) return;
        if (geo) {
          setSessionCoords(geo.coords);
          setSessionCountry(geo.countryCode);
        } else {
          setSessionCoords(null);
          setSessionCountry(undefined);
        }
      } catch {
        if (!alive) return;
        setSessionCoords(null);
        setSessionCountry(undefined);
      }
    })();
    return () => {
      alive = false;
    };
  }, [session.city]);

  const handleAddIdea = (ideaData: {
    title: string;
    description: string;
    location: string;
    budget: number;
    duration: number;
    date: Date;
    suggestedBy: string;
  }) => {
    const category = categorizeEvent(ideaData.title, ideaData.description);
    
    const newEvent: EventIdea = {
      id: Date.now().toString(),
      ...ideaData,
      category,
      votes: 0,
      voters: [],
      createdAt: new Date()
    };

    const updatedSession = {
      ...session,
      events: [...session.events, newEvent],
      updatedAt: new Date()
    };

    onUpdateSession(updatedSession);
  };

  const handleVote = (eventId: string) => {
    const updatedEvents = session.events.map(event => {
      if (event.id === eventId) {
        const hasVoted = event.voters.includes(currentUser.id);
        return {
          ...event,
          votes: hasVoted ? event.votes - 1 : event.votes + 1,
          voters: hasVoted 
            ? event.voters.filter(id => id !== currentUser.id)
            : [...event.voters, currentUser.id]
        };
      }
      return event;
    });

    const updatedSession = {
      ...session,
      events: updatedEvents,
      updatedAt: new Date()
    };

    onUpdateSession(updatedSession);
  };

  const handleAddFromFeed = (ev: FeedEvent) => {
    const start = ev.start ? new Date(ev.start) : new Date();
    const end = ev.end ? new Date(ev.end) : null;
    const duration = end && !Number.isNaN(end.getTime()) && end > start
      ? Math.max(30, Math.round((end.getTime() - start.getTime()) / (1000 * 60)))
      : 120;
    const title = ev.title || 'Untitled event';
    const description = ev.description || '';
    const category = categorizeEvent(title, description);
    const newEvent: EventIdea = {
      id: Date.now().toString(),
      title,
      description,
      category,
      location: ev.locationName || session.city,
      budget: 0,
      duration,
      suggestedBy: currentUser.name,
      date: start,
      votes: 0,
      voters: [],
      createdAt: new Date(),
    };
    const updatedSession = {
      ...session,
      events: [...session.events, newEvent],
      updatedAt: new Date(),
    };
    onUpdateSession(updatedSession);
  };

  const handleCityChange = (newCity: string) => {
    const updatedSession = {
      ...session,
      city: newCity,
      updatedAt: new Date()
    };
    onUpdateSession(updatedSession);
  };

  const ViewToggle = () => (
    <div className="flex items-center bg-gray-100 rounded-xl p-1">
      <button
        onClick={() => setActiveView('grid')}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
          activeView === 'grid' 
            ? 'bg-white text-gray-900 shadow-sm' 
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Grid3X3 className="w-4 h-4" />
        <span>Ideas</span>
      </button>
      <button
        onClick={() => setActiveView('calendar')}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
          activeView === 'calendar' 
            ? 'bg-white text-gray-900 shadow-sm' 
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Calendar className="w-4 h-4" />
        <span>Calendar</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        showBackButton
        onBack={onBack}
        sessionName={session.name}
        memberCount={session.members.length}
        currentCity={session.city}
        onCityEdit={() => setShowCitySelector(true)}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Session Context Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{session.name}</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{session.members.length} members</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{session.city}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{session.events.length} event ideas</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {session.members.map((member, index) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full text-xs font-medium text-gray-700"
                    title={member.name}
                  >
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                ))}
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full text-xs font-medium text-blue-700 hover:from-blue-200 hover:to-blue-300 transition-all"
                  title="Share session"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {session.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-gray-600">{session.description}</p>
              </div>
            )}
          </div>

          {/* Idea Submission */}
          <IdeaSubmissionForm
            onSubmit={handleAddIdea}
            currentCity={session.city}
            sessionName={session.name}
            onOpenRandom={() => setShowRandomModal(true)}
          />

          {/* View Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {activeView === 'grid' && 'Event Ideas'}
                {activeView === 'calendar' && 'Calendar View'}
              </h2>
              {session.events.length > 0 && (
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {session.events.length} ideas
                </span>
              )}
            </div>
            <ViewToggle />
          </div>

          {/* Content Views */}
          {activeView === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {session.events.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  onVote={handleVote}
                  hasVoted={event.voters.includes(currentUser.id)}
                />
              ))}
              {session.events.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Grid3X3 className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No ideas yet</h3>
                  <p>Be the first to suggest an event for your group!</p>
                </div>
              )}
            </div>
          )}

          {activeView === 'calendar' && (
            <CalendarView events={session.events} />
          )}

          {/* Random picker moved to modal; removed redundant bottom view */}

          {/* Events Feed for this session (uses session city) */}
          <EventsFeed
            query="jazz"
            country={sessionCountry}
            category="concerts"
            locationAroundOrigin={sessionCoords ? `${sessionCoords.lat},${sessionCoords.lon}` : undefined}
            locationAroundOffset={sessionCoords ? '10km' : undefined}
            onAddFromFeed={handleAddFromFeed}
          />
        </div>
      </main>

      <CitySelector
        currentCity={session.city}
        onCityChange={handleCityChange}
        onClose={() => setShowCitySelector(false)}
        isOpen={showCitySelector}
      />
      
      <ShareSessionModal
        sessionId={session.shareId}
        sessionName={session.name}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />

      {/* Random Picker Modal */}
      {showRandomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowRandomModal(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Random Picker</h3>
              <button
                onClick={() => setShowRandomModal(false)}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Close
              </button>
            </div>
            <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50">
              <RandomSuggestion events={session.events} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
