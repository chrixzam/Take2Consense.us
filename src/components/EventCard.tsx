import React from 'react';
import { MapPin, DollarSign, Clock, Calendar, ThumbsUp, Trash2 } from 'lucide-react';
import { EventIdea, User } from '../types';

interface EventCardProps {
  event: EventIdea;
  onVote: (eventId: string) => void;
  hasVoted: boolean;
  onDelete?: (eventId: string) => void;
  onOpen?: (event: EventIdea) => void;
  currentUser?: User;
}

export function EventCard({ event, onVote, hasVoted, onDelete, onOpen, currentUser }: EventCardProps) {
  const categoryColors = {
    'Food & Dining': 'bg-orange-100 text-orange-800',
    'Entertainment': 'bg-purple-100 text-purple-800',
    'Outdoor': 'bg-green-100 text-green-800',
    'Culture': 'bg-blue-100 text-blue-800',
    'Sports': 'bg-red-100 text-red-800',
    'Shopping': 'bg-pink-100 text-pink-800',
    'Social': 'bg-yellow-100 text-yellow-800',
    'Other': 'bg-gray-100 text-gray-800'
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };

  return (
    <div
      className="bg-white/90 rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden group hover:shadow-md cursor-pointer"
      onClick={() => onOpen?.(event)}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={(e) => {
        if (!onOpen) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(event);
        }
      }}
    >
      {(event.imageDataUrl || event.linkImageUrl) && (
        <div className="w-full h-40 bg-gray-50 overflow-hidden">
          <img src={event.imageDataUrl || event.linkImageUrl} alt="Event" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div
                className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-[10px] font-medium text-gray-700"
                title={`by ${event.suggestedBy}`}
              >
                {currentUser && currentUser.avatar && event.suggestedBy && currentUser.name && event.suggestedBy.toLowerCase() === currentUser.name.toLowerCase() ? (
                  <img src={currentUser.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{(event.suggestedBy || '?').charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
              {event.title}
            </h3>
            {event.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
            )}
            {!event.description && event.linkDescription && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.linkDescription}</p>
            )}
          </div>
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Delete this idea? This cannot be undone.')) {
                  onDelete(event.id);
                }
              }}
              className="ml-3 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
              title="Delete idea"
              aria-label="Delete idea"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="truncate">{event.location}</span>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span>${event.budget}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>{event.duration}h</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[event.category as keyof typeof categoryColors] || categoryColors.Other}`}>
              {event.category}
            </span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onVote(event.id); }}
            className="group/vote flex items-center px-3 py-2 rounded-lg transition-colors hover:bg-gray-100"
            aria-pressed={hasVoted}
            aria-label={hasVoted ? 'Remove upvote' : (event.votes > 1 ? `Upvote, ${event.votes} likes` : 'Upvote')}
            title={hasVoted ? 'Remove upvote' : 'Upvote'}
          >
            <ThumbsUp className={`w-5 h-5 ${hasVoted ? 'text-green-600' : 'text-gray-600 group-hover/vote:text-green-600'}`} />
            {event.votes > 1 && (
              <span className="ml-2 text-sm text-gray-600 group-hover/vote:text-green-600">{event.votes}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
