import React, { useState } from 'react';
import { Shuffle, Sparkles } from 'lucide-react';
import { EventIdea, FeedEvent } from '../types';

interface RandomSuggestionProps {
  events: EventIdea[];
  feedEvents?: FeedEvent[];
  onAddFromFeed?: (ev: FeedEvent) => void;
}

export function RandomSuggestion({ events, feedEvents = [], onAddFromFeed }: RandomSuggestionProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedEvent, setSuggestedEvent] = useState<EventIdea | null>(null);
  const [suggestedFeedEvent, setSuggestedFeedEvent] = useState<FeedEvent | null>(null);
  const [showResult, setShowResult] = useState(false);

  const generateRandomSuggestion = () => {
    const hasFeed = feedEvents && feedEvents.length > 0;
    const hasIdeas = events.length > 0;
    if (!hasFeed && !hasIdeas) return;

    setIsGenerating(true);
    setShowResult(false);

    // Add some suspense with a delay
    setTimeout(() => {
      // Prefer feed events when available
      if (hasFeed) {
        const r = Math.floor(Math.random() * feedEvents.length);
        setSuggestedFeedEvent(feedEvents[r]);
        setSuggestedEvent(null);
      } else {
        const randomIndex = Math.floor(Math.random() * events.length);
        setSuggestedEvent(events[randomIndex]);
        setSuggestedFeedEvent(null);
      }
      setIsGenerating(false);
      setShowResult(true);
    }, 1500);
  };

  const resetSuggestion = () => {
    setShowResult(false);
    setSuggestedEvent(null);
    setSuggestedFeedEvent(null);
  };

  // Empty state prioritizes feed
  if ((feedEvents?.length ?? 0) === 0 && events.length === 0) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Nothing to pick yet</h3>
        <p className="text-gray-600">Try adjusting the feed or add some ideas.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Can't decide?</h3>
        <p className="text-gray-600 mb-6">Let me pick a random suggestion for your group!</p>

        {!showResult && !isGenerating && (
          <button
            onClick={generateRandomSuggestion}
            className="inline-flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition-colors"
          >
            <Shuffle className="w-5 h-5" />
            <span>Pick Random Event</span>
          </button>
        )}

        {isGenerating && (
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="text-purple-600 font-medium">Choosing the perfect event...</p>
          </div>
        )}

        {showResult && (suggestedEvent || suggestedFeedEvent) && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-200">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-1">Your random pick:</h4>
            </div>

            <div className="text-left space-y-3">
              {suggestedFeedEvent ? (
                <>
                  <h5 className="text-xl font-bold text-gray-900">{suggestedFeedEvent.title}</h5>
                  {suggestedFeedEvent.description && (
                    <p className="text-gray-600">{suggestedFeedEvent.description}</p>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    {suggestedFeedEvent.start && (
                      <div>📅 {new Date(suggestedFeedEvent.start).toLocaleString()}</div>
                    )}
                    {suggestedFeedEvent.locationName && (
                      <div>📍 {suggestedFeedEvent.locationName}</div>
                    )}
                  </div>
                  {suggestedFeedEvent.sourceUrl && (
                    <div className="text-sm">
                      <a className="text-blue-600 hover:text-blue-700" href={suggestedFeedEvent.sourceUrl} target="_blank" rel="noreferrer">
                        View source
                      </a>
                    </div>
                  )}
                </>
              ) : suggestedEvent ? (
                <>
                  <h5 className="text-xl font-bold text-gray-900">{suggestedEvent.title}</h5>
                  {suggestedEvent.description && (
                    <p className="text-gray-600">{suggestedEvent.description}</p>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>📅 {new Date(suggestedEvent.date).toLocaleDateString()}</div>
                    <div>📍 {suggestedEvent.location}</div>
                    <div>💰 ${suggestedEvent.budget}</div>
                    <div>⏰ {suggestedEvent.duration}h</div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Suggested by {suggestedEvent.suggestedBy}
                  </div>
                </>
              ) : null}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={resetSuggestion}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Try Again
              </button>
              <button
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                onClick={() => {
                  if (suggestedFeedEvent && onAddFromFeed) {
                    onAddFromFeed(suggestedFeedEvent);
                  }
                }}
              >
                Let's Do It!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
