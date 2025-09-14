import React from 'react';
import { Calendar, Users, MapPin, Clock, Trash2 } from 'lucide-react';
import type { GroupSession } from '../types';

interface SessionCardProps {
  session: GroupSession;
  onSelect: (session: GroupSession) => void;
  onDelete?: (sessionId: string) => void;
}

export function SessionCard({ session, onSelect, onDelete }: SessionCardProps) {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - new Date(date).getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return new Date(date).toLocaleDateString();
  };

  // Normalize legacy auto-generated names like "Planning session for <X>"
  const displayName = React.useMemo(() => {
    try {
      const stripped = session.name.replace(/^\s*planning\s*session\s*for\s*/i, '').trim();
      return stripped.length > 0 ? stripped : session.name;
    } catch {
      return session.name;
    }
  }, [session.name]);

  return (
    <div
      onClick={() => onSelect(session)}
      className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
            {displayName}
          </h3>
          {session.description && (
            <p className="text-gray-600 text-sm line-clamp-2 mb-3">{session.description}</p>
          )}
        </div>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Delete this session? This cannot be undone.')) {
                onDelete(session.id);
              }
            }}
            className="ml-3 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
            title="Delete session"
            aria-label="Delete session"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
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
  );
}
