import React, { useState } from 'react';
import { X, Calendar, MapPin, DollarSign, Phone, Globe, Clock } from 'lucide-react';
import { bookWithAgent } from '../agents/service';
import type { PlaceSuggestion, EventSuggestion } from '../agents/service';

type Coords = { lat: number; lon: number };

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  planText: string;
  places: PlaceSuggestion[];
  events: EventSuggestion[];
  startDate?: Date;
  endDate?: Date;
  budgetLevel?: number;
  locationLabel?: string;
  coords?: Coords;
  city?: string;
  country?: string;
}

export default function BookingModal({
  open,
  onClose,
  planText,
  places,
  events,
  startDate,
  endDate,
  budgetLevel,
  locationLabel,
  coords,
  city,
  country,
}: BookingModalProps) {
  const [bookingText, setBookingText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<string | undefined>();
  const [provider, setProvider] = useState<string | undefined>();

  const handleGetBookingInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await bookWithAgent(
        planText,
        places,
        events,
        coords,
        city,
        country,
        budgetLevel,
        startDate,
        endDate
      );
      setBookingText(result.text);
      setModel(result.model);
      setProvider(result.provider);
    } catch (err) {
      setError('Failed to get booking information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-white">Booking Assistant</h2>
            <p className="text-sm text-gray-400 mt-1">
              Get specific booking instructions and contact information
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row max-h-[calc(90vh-80px)]">
          {/* Left side - Plan summary and context */}
          <div className="lg:w-1/3 p-6 border-r border-gray-700 bg-gray-800/50">
            <h3 className="text-lg font-medium text-white mb-4">Plan Summary</h3>
            
            {/* Context info */}
            <div className="space-y-3 mb-6">
              {locationLabel && (
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <MapPin className="w-4 h-4" />
                  <span>{locationLabel}</span>
                </div>
              )}
              {(startDate || endDate) && (
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {startDate && endDate
                      ? `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
                      : startDate
                      ? `From ${startDate.toLocaleDateString()}`
                      : `Until ${endDate?.toLocaleDateString()}`}
                  </span>
                </div>
              )}
              {budgetLevel && (
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <DollarSign className="w-4 h-4" />
                  <span>Budget: {'$'.repeat(budgetLevel)} ({budgetLevel}/5)</span>
                </div>
              )}
            </div>

            {/* Places to book */}
            {places.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Places ({places.length})</h4>
                <div className="space-y-2">
                  {places.slice(0, 3).map((place, i) => (
                    <div key={i} className="text-sm text-gray-400">
                      <div className="font-medium text-gray-300">{place.name}</div>
                      <div className="text-xs">{place.type.replace('_', ' ')} • {place.distKm.toFixed(1)}km</div>
                    </div>
                  ))}
                  {places.length > 3 && (
                    <div className="text-xs text-gray-500">+{places.length - 3} more places</div>
                  )}
                </div>
              </div>
            )}

            {/* Events */}
            {events.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Events ({events.length})</h4>
                <div className="space-y-2">
                  {events.slice(0, 3).map((event, i) => (
                    <div key={i} className="text-sm text-gray-400">
                      <div className="font-medium text-gray-300">{event.title}</div>
                      <div className="text-xs">
                        {event.start && new Date(event.start).toLocaleDateString()}
                        {event.place && ` • ${event.place}`}
                      </div>
                    </div>
                  ))}
                  {events.length > 3 && (
                    <div className="text-xs text-gray-500">+{events.length - 3} more events</div>
                  )}
                </div>
              </div>
            )}

            {/* Get booking info button */}
            {!bookingText && (
              <button
                onClick={handleGetBookingInfo}
                disabled={loading}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {loading ? 'Getting booking info...' : 'Get Booking Instructions'}
              </button>
            )}
          </div>

          {/* Right side - Booking instructions */}
          <div className="lg:w-2/3 p-6 overflow-y-auto">
            {error && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-4">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-400">Getting booking information...</span>
              </div>
            )}

            {bookingText && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">Booking Instructions</h3>
                  {model && provider && (
                    <div className="text-xs text-gray-500">
                      {provider} • {model}
                    </div>
                  )}
                </div>
                
                <div className="prose prose-invert prose-sm max-w-none">
                  <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {bookingText}
                  </div>
                </div>

                {/* Quick action buttons */}
                <div className="mt-6 pt-4 border-t border-gray-700">
                  <div className="flex flex-wrap gap-2">
                    {places.slice(0, 3).map((place, i) => (
                      <a
                        key={i}
                        href={place.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-full transition-colors"
                      >
                        <Globe className="w-3 h-3" />
                        {place.name}
                      </a>
                    ))}
                    {events.slice(0, 2).map((event, i) => (
                      <a
                        key={i}
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-full transition-colors"
                      >
                        <Clock className="w-3 h-3" />
                        {event.title}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!bookingText && !loading && (
              <div className="flex items-center justify-center py-12 text-gray-500">
                <div className="text-center">
                  <Phone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Click "Get Booking Instructions" to receive specific contact information and reservation tips for your planned venues and events.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
