import React from 'react';
import { Calendar } from 'lucide-react';
import { SessionCard } from './SessionCard';
import type { GroupSession } from '../types';

interface SessionGridProps {
  sessions: GroupSession[];
  onSelectSession: (session: GroupSession) => void;
  onDeleteSession?: (sessionId: string) => void;
}

export function SessionGrid({ sessions, onSelectSession, onDeleteSession }: SessionGridProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
        <p className="mb-6">Create your first planning session to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sessions.map(session => (
        <SessionCard
          key={session.id}
          session={session}
          onSelect={onSelectSession}
          onDelete={onDeleteSession}
        />
      ))}
    </div>
  );
}
