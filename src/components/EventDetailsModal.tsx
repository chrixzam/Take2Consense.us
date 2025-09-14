import React from 'react';
import { Calendar, MapPin, DollarSign, Clock, User, Heart, X, Trash2 } from 'lucide-react';
import { EventIdea } from '../types';

interface EventDetailsModalProps {
  event: EventIdea | null;
  isOpen: boolean;
  hasVoted: boolean;
  onClose: () => void;
  onVote: (eventId: string) => void;
  onDelete?: (eventId: string) => void;
}

export default function EventDetailsModal({ event, isOpen, hasVoted, onClose, onVote, onDelete }: EventDetailsModalProps) {
  if (!isOpen || !event) return null;

  const formatDateLong = (date: Date) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(date));
    } catch {
      return String(date);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
            <div className="text-sm text-gray-500">Proposed by {event.suggestedBy}</div>
          </div>
          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                onClick={() => {
                  if (window.confirm('Delete this idea? This cannot be undone.')) onDelete(event.id);
                }}
                title="Delete idea"
                aria-label="Delete idea"
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {event.description && (
            <p className="text-gray-700 leading-relaxed">{event.description}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{formatDateLong(event.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <span>${event.budget}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{event.duration}h</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span>{event.votes} votes</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {event.category}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="text-sm text-gray-500">Created {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(event.createdAt))}</div>
          <button
            onClick={() => onVote(event.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
              hasVoted
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-white text-gray-700 hover:bg-gray-100 hover:text-red-600'
            }`}
          >
            <Heart className={`w-4 h-4 ${hasVoted ? 'fill-current' : ''}`} />
            <span>{hasVoted ? 'Voted' : 'Vote'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

