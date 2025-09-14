import React, { useState, useEffect } from 'react';
import { SessionList } from './components/SessionList';
import { SessionCreationForm } from './components/SessionCreationForm';
import { SessionJoinForm } from './components/SessionJoinForm';
import { SessionView } from './components/SessionView';
import { User, GroupSession } from './types';
import VersionBadge from './components/VersionBadge';
import { generateSessionId } from './utils/sessionId';
import { detectCity, forwardGeocodeCity } from './utils/geolocation';

function App() {
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [currentSession, setCurrentSession] = useState<GroupSession | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinError, setJoinError] = useState<string>('');
  const [currentUser] = useState<User>({ id: '1', name: 'You' });
  const [currentCity, setCurrentCity] = useState('San Francisco, CA');
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Load sessions from localStorage
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
  }, []);

  // Save sessions to localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('groupSessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  // Auto-detect location on first load (with caching)
  useEffect(() => {
    const cached = localStorage.getItem('userLocation');
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { city: string; coords: { lat: number; lon: number }; ts: number };
        // Use cached value if within 24h
        if (Date.now() - parsed.ts < 24 * 60 * 60 * 1000) {
          setCurrentCity(parsed.city);
          setUserCoords(parsed.coords);
        }
      } catch {}
    }
    if (!cached && navigator.geolocation) {
      (async () => {
        const result = await detectCity();
        if (result) {
          setCurrentCity(result.city);
          setUserCoords(result.coords);
          localStorage.setItem(
            'userLocation',
            JSON.stringify({ city: result.city, coords: result.coords, ts: Date.now() })
          );
          localStorage.setItem('detectedLocation', 'true');
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
    const newSession: GroupSession = {
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

  const handleBackToSessions = () => {
    setCurrentSession(null);
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

  // Show session view if one is selected
  if (currentSession) {
    return (
      <>
        <SessionView
          session={currentSession}
          currentUser={currentUser}
          onUpdateSession={handleUpdateSession}
          onBack={handleBackToSessions}
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
        userCoords={userCoords || undefined}
        currentCity={currentCity}
        onCityChange={async (city) => {
          setCurrentCity(city);
          // Try to forward-geocode the city name to update coords
          let coords = await forwardGeocodeCity(city);
          if (!coords) {
            // Fallback to cached or existing coords if geocoding fails
            const cached = localStorage.getItem('userLocation');
            if (cached) {
              try {
                coords = JSON.parse(cached)?.coords || undefined;
              } catch {}
            } else {
              coords = userCoords || undefined;
            }
          } else {
            setUserCoords(coords);
          }
          localStorage.setItem('userLocation', JSON.stringify({ city, coords, ts: Date.now() }));
        }}
      />
      <VersionBadge />
    </>
  );
}

export default App;
