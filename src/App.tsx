import React, { useState, useEffect } from 'react';
import { SessionList } from './components/SessionList';
import { SessionCreationForm } from './components/SessionCreationForm';
import { SessionJoinForm } from './components/SessionJoinForm';
import { SessionView } from './components/SessionView';
import { User, GroupSession, FeedEvent, EventIdea } from './types';
import UserProfile from './components/UserProfile';
import VersionBadge from './components/VersionBadge';
import { generateSessionId } from './utils/sessionId';
import { detectCity, forwardGeocodeCity } from './utils/geolocation';
import { categorizeEvent } from './utils/eventCategories';
import Toast from './components/Toast';

function App() {
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [currentSession, setCurrentSession] = useState<GroupSession | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinError, setJoinError] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<User>({ id: '1', name: 'You' });
  const [currentCity, setCurrentCity] = useState('San Francisco, CA');
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [userCountry, setUserCountry] = useState<string | undefined>(undefined);
  const [toast, setToast] = useState<string | null>(null);
  const [pendingFeedEvent, setPendingFeedEvent] = useState<FeedEvent | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  // Load sessions and user from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('groupSessions');
    if (savedSessions) {
      const parsedSessions = JSON.parse(savedSessions).map((session: any) => ({
        ...session,
        // Migrate existing sessions to have shareId if missing
        shareId: session.shareId || generateSessionId(),
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        events: session.events.map((event: any) => ({
          ...event,
          date: new Date(event.date),
          createdAt: new Date(event.createdAt)
        }))
      }));
      setSessions(parsedSessions);
    }
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const parsed: User = JSON.parse(savedUser);
        if (parsed && parsed.id) setCurrentUser(parsed);
      } catch {}
    }
  }, []);

  // Save sessions to localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('groupSessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  // Persist user profile
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  // Auto-detect location on first load (with caching)
  useEffect(() => {
    const cached = localStorage.getItem('userLocation');
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { city: string; coords?: { lat: number; lon: number }; countryCode?: string; ts: number };
        // Use cached value if within 24h
        if (Date.now() - parsed.ts < 24 * 60 * 60 * 1000) {
          setCurrentCity(parsed.city);
          if (parsed.coords) setUserCoords(parsed.coords);
          if (parsed.countryCode) setUserCountry(parsed.countryCode);
        }
      } catch {}
    }
    if (!cached && navigator.geolocation) {
      (async () => {
        const result = await detectCity();
        if (result) {
          setCurrentCity(result.city);
          setUserCoords(result.coords);
          setUserCountry(result.countryCode);
          localStorage.setItem(
            'userLocation',
            JSON.stringify({ city: result.city, coords: result.coords, countryCode: result.countryCode, ts: Date.now() })
          );
          localStorage.setItem('detectedLocation', 'true');
          setToast(`Location set to ${result.city} • searching within 10km`);
        }
      })();
    }

    // Check for join parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const joinSessionId = urlParams.get('join');
    if (joinSessionId) {
      setShowJoinForm(true);
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleCreateSession = (sessionData: {
    name: string;
    description: string;
    city: string;
    members: string[];
  }) => {
    let newSession: GroupSession = {
      id: Date.now().toString(),
      shareId: generateSessionId(),
      name: sessionData.name,
      description: sessionData.description,
      members: sessionData.members.map((name, index) => ({
        id: index.toString(),
        name
      })),
      events: [],
      city: sessionData.city,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // If a feed event is pending (user clicked Add on home), convert and add it
    if (pendingFeedEvent) {
      const ev = pendingFeedEvent;
      const start = ev.start ? new Date(ev.start) : new Date();
      const end = ev.end ? new Date(ev.end) : null;
      const duration = end && !Number.isNaN(end.getTime()) && end > start
        ? Math.max(30, Math.round((end.getTime() - start.getTime()) / (1000 * 60)))
        : 120;
      const title = ev.title || 'Untitled event';
      const description = ev.description || '';
      const category = categorizeEvent(title, description);
      const idea: EventIdea = {
        id: Date.now().toString(),
        title,
        description,
        category,
        location: ev.locationName || sessionData.city,
        budget: 0,
        duration,
        suggestedBy: 'Events Feed',
        date: start,
        sourceUrl: ev.sourceUrl,
        votes: 0,
        voters: [],
        createdAt: new Date(),
      };
      newSession = {
        ...newSession,
        events: [idea],
      };
      setPendingFeedEvent(null);
    }

    setSessions(prev => [newSession, ...prev]);
    setShowCreateForm(false);
    setCurrentSession(newSession);
  };

  const handleJoinSession = (sessionId: string, userName: string) => {
    // Find session by shareId
    const sessionToJoin = sessions.find(session => session.shareId === sessionId);
    
    if (!sessionToJoin) {
      setJoinError('Session not found. Please check the session ID and try again.');
      return;
    }
    
    // Check if user is already a member
    const isExistingMember = sessionToJoin.members.some(member => 
      member.name.toLowerCase() === userName.toLowerCase()
    );
    
    if (!isExistingMember) {
      // Add user to session members
      const updatedSession = {
        ...sessionToJoin,
        members: [...sessionToJoin.members, {
          id: Date.now().toString(),
          name: userName
        }],
        updatedAt: new Date()
      };
      
      setSessions(prev => prev.map(session => 
        session.id === sessionToJoin.id ? updatedSession : session
      ));
      
      setCurrentSession(updatedSession);
    } else {
      setCurrentSession(sessionToJoin);
    }
    
    setShowJoinForm(false);
    setJoinError('');
  };
  const handleSelectSession = (session: GroupSession) => {
    setCurrentSession(session);
  };

  const handleUpdateSession = (updatedSession: GroupSession) => {
    setSessions(prev => prev.map(session => 
      session.id === updatedSession.id ? updatedSession : session
    ));
    setCurrentSession(updatedSession);
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== sessionId);
      // Persist even when empty to ensure deletion sticks
      localStorage.setItem('groupSessions', JSON.stringify(updated));
      return updated;
    });
    if (currentSession && currentSession.id === sessionId) {
      setCurrentSession(null);
    }
  };

  const handleBackToSessions = () => {
    setCurrentSession(null);
  };

  const handleCreateSessionFromAgentPlan = (subject: string, feedEvents: FeedEvent[]) => {
    const name = subject && subject.trim() ? subject.trim() : 'New Planning Session';
    const newSessionBase: GroupSession = {
      id: Date.now().toString(),
      shareId: generateSessionId(),
      name,
      description: '',
      members: [currentUser],
      events: [],
      city: currentCity,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const ideas: EventIdea[] = (feedEvents || []).map((ev) => {
      const start = ev.start ? new Date(ev.start) : new Date();
      const end = ev.end ? new Date(ev.end) : null;
      const duration = end && !Number.isNaN(end.getTime()) && end > start
        ? Math.max(30, Math.round((end.getTime() - start.getTime()) / (1000 * 60)))
        : 120;
      const title = ev.title || 'Untitled event';
      const description = ev.description || '';
      const category = categorizeEvent(title, description);
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title,
        description,
        category,
        location: ev.locationName || currentCity,
        budget: 0,
        duration,
        suggestedBy: 'Agent Plan',
        date: start,
        sourceUrl: ev.sourceUrl,
        votes: 0,
        voters: [],
        createdAt: new Date(),
      } as EventIdea;
    });

    const newSession: GroupSession = {
      ...newSessionBase,
      events: ideas,
    };

    setSessions(prev => [newSession, ...prev]);
    setCurrentSession(newSession);
  };

  // Show create form
  if (showCreateForm) {
    return (
      <>
        <SessionCreationForm
          onCreateSession={handleCreateSession}
          onCancel={() => setShowCreateForm(false)}
          currentCity={currentCity}
        />
        <VersionBadge />
      </>
    );
  }

  // Show join form
  if (showJoinForm) {
    return (
      <>
        <SessionJoinForm
          onJoinSession={handleJoinSession}
          onCancel={() => { setShowJoinForm(false); setJoinError(''); }}
          error={joinError}
        />
        <VersionBadge />
      </>
    );
  }

  // Show user profile
  if (showProfile) {
    return (
      <>
        <UserProfile
          user={currentUser}
          onUpdateUser={setCurrentUser}
          onBack={() => setShowProfile(false)}
        />
        <VersionBadge />
      </>
    );
  }

  // Show session view if one is selected
  if (currentSession) {
    return (
      <>
        <SessionView
          session={currentSession}
          currentUser={currentUser}
          onUpdateSession={handleUpdateSession}
          onDeleteSession={handleDeleteSession}
          onBack={handleBackToSessions}
          onOpenProfile={() => setShowProfile(true)}
        />
        <VersionBadge />
      </>
    );
  }

  // Show session list
  return (
    <>
      <SessionList
        sessions={sessions}
        onSelectSession={handleSelectSession}
        onCreateNew={() => setShowCreateForm(true)}
        onJoinSession={() => setShowJoinForm(true)}
        onDeleteSession={handleDeleteSession}
        userCoords={userCoords || undefined}
        userCountry={userCountry}
        currentCity={currentCity}
        onOpenProfile={() => setShowProfile(true)}
        onCreateSessionFromPlan={handleCreateSessionFromAgentPlan}
        onCityChange={async (city) => {
          setCurrentCity(city);
          // Try to forward-geocode the city name to update coords
          let geocoded = await forwardGeocodeCity(city);
          let coords = geocoded?.coords;
          let country = geocoded?.countryCode;
          if (!coords) {
            // Fallback to cached or existing coords if geocoding fails
            const cached = localStorage.getItem('userLocation');
            if (cached) {
              try {
                const parsed = JSON.parse(cached);
                coords = parsed?.coords || undefined;
                country = parsed?.countryCode || country;
              } catch {}
            } else {
              coords = userCoords || undefined;
            }
          } else {
            setUserCoords(coords);
            setUserCountry(country);
          }
          localStorage.setItem('userLocation', JSON.stringify({ city, coords, countryCode: country, ts: Date.now() }));
          const radius = coords ? '10km' : '5mi';
          setToast(`Location set to ${city} • searching within ${radius}`);
        }}
        onAddEventFromFeed={(ev) => {
          // Prompt to create a session, then add the event after creation
          setPendingFeedEvent(ev);
          setShowCreateForm(true);
        }}
      />
      <VersionBadge />
      <Toast message={toast} onClose={() => setToast(null)} duration={3000} />
    </>
  );
}

export default App;
