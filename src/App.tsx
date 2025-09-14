import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { IdeaSubmissionForm } from './components/IdeaSubmissionForm';
import { EventCard } from './components/EventCard';
import { CalendarView } from './components/CalendarView';
import { RandomSuggestion } from './components/RandomSuggestion';
import { CitySelector } from './components/CitySelector';
import { EventIdea, User, GroupSession } from './types';
import { categorizeEvent } from './utils/eventCategories';
import { Calendar, Grid3X3, Shuffle } from 'lucide-react';

function App() {
  const [events, setEvents] = useState<EventIdea[]>([]);
  const [currentUser] = useState<User>({ id: '1', name: 'You' });
  const [currentCity, setCurrentCity] = useState('San Francisco, CA');
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [activeView, setActiveView] = useState<'grid' | 'calendar' | 'random'>('grid');
  
  const [groupSession] = useState<GroupSession>({
    id: '1',
    name: 'Weekend Plans',
    members: [
      { id: '1', name: 'You' },
      { id: '2', name: 'Alex' },
      { id: '3', name: 'Jordan' },
      { id: '4', name: 'Sam' }
    ],
    events: [],
    city: 'San Francisco, CA',
    createdAt: new Date()
  });

  // Auto-detect location on first load
  useEffect(() => {
    const hasDetectedLocation = localStorage.getItem('detectedLocation');
    if (!hasDetectedLocation && navigator.geolocation) {
      // In a real app, you'd detect the actual location
      // For demo purposes, we'll just mark it as detected
      localStorage.setItem('detectedLocation', 'true');
    }
  }, []);

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

    setEvents(prev => [...prev, newEvent]);
  };

  const handleVote = (eventId: string) => {
    setEvents(prev => prev.map(event => {
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
    }));
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
      <button
        onClick={() => setActiveView('random')}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
          activeView === 'random' 
            ? 'bg-white text-gray-900 shadow-sm' 
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Shuffle className="w-4 h-4" />
        <span>Random</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        groupName={groupSession.name}
        memberCount={groupSession.members.length}
        currentCity={currentCity}
        onCityEdit={() => setShowCitySelector(true)}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Idea Submission */}
          <IdeaSubmissionForm
            onSubmit={handleAddIdea}
            currentCity={currentCity}
          />

          {/* View Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {activeView === 'grid' && 'Event Ideas'}
                {activeView === 'calendar' && 'Calendar View'}
                {activeView === 'random' && 'Random Picker'}
              </h2>
              {events.length > 0 && (
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {events.length} ideas
                </span>
              )}
            </div>
            <ViewToggle />
          </div>

          {/* Content Views */}
          {activeView === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  onVote={handleVote}
                  hasVoted={event.voters.includes(currentUser.id)}
                />
              ))}
              {events.length === 0 && (
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
            <CalendarView events={events} />
          )}

          {activeView === 'random' && (
            <RandomSuggestion events={events} />
          )}
        </div>
      </main>

      <CitySelector
        currentCity={currentCity}
        onCityChange={setCurrentCity}
        onClose={() => setShowCitySelector(false)}
        isOpen={showCitySelector}
      />
    </div>
  );
}

export default App;