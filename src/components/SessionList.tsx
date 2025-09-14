import React from 'react';
import { Calendar, Users, MapPin, Plus, Clock, Sparkles, UserPlus } from 'lucide-react';
import { Navigation } from './Navigation';
import { EventsFeed } from './EventsFeed';
import { GroupSession } from '../types';

interface SessionListProps {
  sessions: GroupSession[];
  onSelectSession: (session: GroupSession) => void;
  onCreateNew: () => void;
  onJoinSession: () => void;
}

export function SessionList({ sessions, onSelectSession, onCreateNew, onJoinSession }: SessionListProps) {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - new Date(date).getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 pt-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Consense.us</h1>
          <p className="text-gray-600">Make group decisions effortlessly with your planning sessions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create New Session Card */}
          <button
            onClick={onCreateNew}
            className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-8 hover:border-blue-300 hover:bg-blue-50 transition-all group"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-200 rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">New Session</h3>
              <p className="text-gray-500 text-sm">Start planning with your group</p>
            </div>
          </button>

          {/* Join Session Card */}
          <button
            onClick={onJoinSession}
            className="bg-white border-2 border-dashed border-green-200 rounded-2xl p-8 hover:border-green-300 hover:bg-green-50 transition-all group"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 group-hover:bg-green-200 rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors">
                <UserPlus className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Join Session</h3>
              <p className="text-gray-500 text-sm">Use a session ID to join planning</p>
            </div>
          </button>
          {/* Session Cards */}
          {sessions.map(session => (
            <div
              key={session.id}
              onClick={() => onSelectSession(session)}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                    {session.name}
                  </h3>
                  {session.description && (
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">{session.description}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{session.members.length} members</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{session.city}</span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{session.events.length} event ideas</span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>Updated {formatDate(session.updatedAt)}</span>
                </div>
              </div>

              {session.events.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    {session.events.slice(0, 3).map(event => (
                      <span
                        key={event.id}
                        className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full truncate max-w-24"
                      >
                        {event.title}
                      </span>
                    ))}
                    {session.events.length > 3 && (
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                        +{session.events.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {sessions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
            <p className="mb-6">Create your first planning session to get started</p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={onCreateNew}
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Create Session</span>
              </button>
              <button
                onClick={onJoinSession}
                className="inline-flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors"
              >
                <UserPlus className="w-5 h-5" />
                <span>Join Session</span>
              </button>
            </div>
          </div>
        )}

        {/* Events feed at the bottom of the home page */}
        <EventsFeed limit={6} />
      </div>
    </div>
    </div>
  );
}
