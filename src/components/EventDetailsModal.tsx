import React from 'react';
import { Calendar, MapPin, DollarSign, Clock, User, ThumbsUp, X, Trash2 } from 'lucide-react';
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
        {(event.imageDataUrl || event.linkImageUrl) && (
          <div className="w-full h-60 bg-gray-50 overflow-hidden">
            <img src={event.imageDataUrl || event.linkImageUrl} alt="Event" className="w-full h-full object-cover" />
          </div>
        )}
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

          {event.sourceUrl && (
            <div>
              <a
                href={event.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg"
              >
                Open Link
              </a>
            </div>
          )}

          {!event.description && event.linkDescription && (
            <p className="text-gray-700 leading-relaxed">{event.linkDescription}</p>
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
                ? 'bg-green-50 text-green-600 hover:bg-green-100'
                : 'bg-white text-gray-700 hover:bg-gray-100 hover:text-green-600'
            }`}
            aria-pressed={hasVoted}
            aria-label={hasVoted ? 'Remove upvote' : 'Upvote'}
            title={hasVoted ? 'Remove upvote' : 'Upvote'}
          >
            <ThumbsUp className={`w-4 h-4 ${hasVoted ? 'text-green-600' : ''}`} />
            <span>{hasVoted ? 'Voted' : 'Vote'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
