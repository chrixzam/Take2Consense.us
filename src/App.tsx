import React, { useState, useEffect } from 'react';
import { SessionList } from './components/SessionList';
import { SessionCreationForm } from './components/SessionCreationForm';
import { SessionView } from './components/SessionView';
import { User, GroupSession } from './types';

function App() {
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [currentSession, setCurrentSession] = useState<GroupSession | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentUser] = useState<User>({ id: '1', name: 'You' });
  const [currentCity, setCurrentCity] = useState('San Francisco, CA');

  // Load sessions from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('groupSessions');
    if (savedSessions) {
      const parsedSessions = JSON.parse(savedSessions).map((session: any) => ({
        ...session,
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

  // Auto-detect location on first load
  useEffect(() => {
    const hasDetectedLocation = localStorage.getItem('detectedLocation');
    if (!hasDetectedLocation && navigator.geolocation) {
      // In a real app, you'd detect the actual location
      // For demo purposes, we'll just mark it as detected
      localStorage.setItem('detectedLocation', 'true');
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
      <SessionCreationForm
        onCreateSession={handleCreateSession}
        onCancel={() => setShowCreateForm(false)}
        currentCity={currentCity}
      />
    );
  }

  // Show session view if one is selected
  if (currentSession) {
    return (
      <SessionView
        session={currentSession}
        currentUser={currentUser}
        onUpdateSession={handleUpdateSession}
        onBack={handleBackToSessions}
      />
    );
  }

  // Show session list
  return (
    <SessionList
      sessions={sessions}
      onSelectSession={handleSelectSession}
      onCreateNew={() => setShowCreateForm(true)}
    />
  );
}

export default App;