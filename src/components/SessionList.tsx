import React, { useRef, useState, useEffect } from 'react';
import { Calendar, Users, MapPin, Plus, Clock, Sparkles, UserPlus, Trash2, DollarSign } from 'lucide-react';
import DateRangeCalendar from './DateRangeCalendar';
import { Navigation } from './Navigation';
import { EventsFeed } from './EventsFeed';
import type { GroupSession, FeedEvent } from '../types';
import { CitySelector } from './CitySelector';
import AgentPlanModal from './AgentPlanModal';
import { planWithAgent } from '../agents/service';
import { forwardGeocodeCity } from '../utils/geolocation';

type Coords = { lat: number; lon: number };

interface SessionListProps {
  sessions: GroupSession[];
  onSelectSession: (session: GroupSession) => void;
  onCreateNew: () => void;
  onJoinSession: () => void;
  onDeleteSession?: (sessionId: string) => void;
  userCoords?: Coords;
  currentCity: string;
  onCityChange: (city: string) => void;
  userCountry?: string;
  onAddEventFromFeed?: (ev: FeedEvent) => void;
  onOpenProfile?: () => void;
  onCreateSessionFromPlan?: (subject: string, events: FeedEvent[]) => void;
}

export function SessionList({ sessions, onSelectSession, onCreateNew, onJoinSession, onDeleteSession, userCoords, currentCity, onCityChange, userCountry, onAddEventFromFeed, onOpenProfile, onCreateSessionFromPlan }: SessionListProps) {
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [ideaText, setIdeaText] = useState('');
  const [planning, setPlanning] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planText, setPlanText] = useState('');
  const [planModel, setPlanModel] = useState<string | undefined>(undefined);
  const [planProvider, setPlanProvider] = useState<string | undefined>(undefined);
  const [planError, setPlanError] = useState<string | null>(null);
  const [suggestedPlaces, setSuggestedPlaces] = useState<Array<{ name: string; type: string; lat: number; lon: number; distKm: number; url: string }>>([]);
  const [suggestedEvents, setSuggestedEvents] = useState<Array<{ title: string; place?: string; start?: string; url?: string; category?: string }>>([]);
  const [selectedPlanEvents, setSelectedPlanEvents] = useState<FeedEvent[]>([]);
  // Calendar state
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMode, setCalendarMode] = useState<'single' | 'range'>('single');
  const [selectedStartDate, setSelectedStartDate] = useState<Date | undefined>(undefined);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>(undefined);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const calendarPopoverRef = useRef<HTMLDivElement | null>(null);
  const calendarButtonRef = useRef<HTMLButtonElement | null>(null);
  // Budget state
  const [showBudget, setShowBudget] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<number | undefined>(undefined); // 1..5
  const budgetPopoverRef = useRef<HTMLDivElement | null>(null);
  const budgetButtonRef = useRef<HTMLButtonElement | null>(null);
  // Event location (independent from user's city)
  const [showLocation, setShowLocation] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [eventLocation, setEventLocation] = useState<{ label: string; lat: number; lon: number } | undefined>(undefined);
  const [eventLocationCountry, setEventLocationCountry] = useState<string | undefined>(undefined);
  const locationPopoverRef = useRef<HTMLDivElement | null>(null);
  const locationButtonRef = useRef<HTMLButtonElement | null>(null);
  // Inferred location from idea text when user hasn't set an explicit location filter
  const [ideaLocationLabel, setIdeaLocationLabel] = useState<string | undefined>(undefined);

  // Very small heuristic to extract a location phrase from the idea text.
  // Looks for patterns like: "brunch in Brooklyn", "museum near Paris", "dinner at Soho", "trip to London".
  const extractLocationFromIdea = (text: string): string | undefined => {
    if (!text) return undefined;
    const lowered = ` ${text} `; // pad to simplify boundary checks
    const patterns = [
      /(\s|^)(in|at|near|around|to)\s+([A-Za-z][A-Za-z .'-]{1,48})(?=\s|$|[.,;!?:])/i,
    ];
    for (const re of patterns) {
      const m = re.exec(lowered);
      if (m && m[3]) {
        const candidate = m[3].trim().replace(/[.,;!?:]+$/, '');
        // Avoid obviously generic words that might match incorrectly
        const stoplist = new Set(['me', 'us', 'there', 'here', 'somewhere']);
        if (!stoplist.has(candidate.toLowerCase())) return candidate;
      }
    }
    return undefined;
  };

  // Close calendar when clicking outside of the popover and the calendar icon
  useEffect(() => {
    if (!showCalendar) return;
    const onDown = (e: MouseEvent) => {
      const pop = calendarPopoverRef.current;
      const btn = calendarButtonRef.current;
      const target = e.target as Node | null;
      if (pop && pop.contains(target as Node)) return;
      if (btn && btn.contains(target as Node)) return;
      setShowCalendar(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [showCalendar]);

  // Close budget popover on outside-click
  useEffect(() => {
    if (!showBudget) return;
    const onDown = (e: MouseEvent) => {
      const pop = budgetPopoverRef.current;
      const btn = budgetButtonRef.current;
      const target = e.target as Node | null;
      if (pop && pop.contains(target as Node)) return;
      if (btn && btn.contains(target as Node)) return;
      setShowBudget(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [showBudget]);

  // Close location popover on outside-click
  useEffect(() => {
    if (!showLocation) return;
    const onDown = (e: MouseEvent) => {
      const pop = locationPopoverRef.current;
      const btn = locationButtonRef.current;
      const target = e.target as Node | null;
      if (pop && pop.contains(target as Node)) return;
      if (btn && btn.contains(target as Node)) return;
      setShowLocation(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [showLocation]);

  const resolveLocation = async () => {
    const q = locationInput.trim();
    if (!q) return;
    setLocationLoading(true);
    try {
      const res = await forwardGeocodeCity(q);
      if (res?.coords) {
        setEventLocation({ label: q, lat: res.coords.lat, lon: res.coords.lon });
        setEventLocationCountry(res.countryCode);
        setShowLocation(false);
      } else {
        alert('Could not find that location. Try a city or address.');
      }
    } catch {
      alert('Could not look up that location.');
    } finally {
      setLocationLoading(false);
    }
  };

  const isSameFeedEvent = (a: FeedEvent, b: FeedEvent) => (
    a.title === b.title &&
    (a.start || '') === (b.start || '') &&
    (a.locationName || '') === (b.locationName || '') &&
    (a.sourceUrl || '') === (b.sourceUrl || '') &&
    (a.address || '') === (b.address || '') &&
    String(a.lat ?? '') === String(b.lat ?? '') &&
    String(a.lon ?? '') === String(b.lon ?? '')
  );

  const startPlanning = async () => {
    setPlanError(null);
    if (!ideaText.trim()) {
      setPlanError('Please enter an idea to plan.');
      return;
    }
    setPlanning(true);
    try {
      // Extract idea-mentioned location regardless, to detect conflicts.
      const ideaLocAll = extractLocationFromIdea(ideaText.trim());

      // If user selected an explicit location filter, it wins.
      // Otherwise, if the idea mentions a location, prefer that.
      // Else, fall back to the user's current city/coords.
      const ideaLoc = !eventLocation ? ideaLocAll : undefined;
      setIdeaLocationLabel(ideaLoc);

      // If both an explicit filter and an idea-mentioned location exist, check country conflict.
      if (eventLocation && ideaLocAll) {
        try {
          const ideaGeo = await forwardGeocodeCity(ideaLocAll);
          const ideaCountry = ideaGeo?.countryCode;
          if (ideaCountry && eventLocationCountry && ideaCountry !== eventLocationCountry) {
            const proceed = window.confirm(
              `Your idea mentions "${ideaLocAll}" but the location filter is set to "${eventLocation.label}".\nDo you want to continue with ${eventLocation.label}?`
            );
            if (!proceed) {
              // User canceled due to conflict; stop planning so they can adjust.
              setPlanning(false);
              return;
            }
          }
        } catch {}
      }

      const coordsForPlanning = eventLocation
        ? { lat: eventLocation.lat, lon: eventLocation.lon }
        : (ideaLoc ? undefined : userCoords);

      const cityForPlanning = eventLocation
        ? eventLocation.label
        : (ideaLoc || currentCity);

      const res = await planWithAgent(
        ideaText.trim(),
        'planner',
        coordsForPlanning,
        cityForPlanning,
        userCountry,
        selectedBudget,
        selectedStartDate,
        selectedEndDate,
      );
      setPlanText(res.text);
      setPlanModel(res.model);
      setPlanProvider(res.provider);
      setSuggestedPlaces(res.places || []);
      setSuggestedEvents(res.events || []);
      setSelectedPlanEvents([]);
      setPlanModalOpen(true);
    } catch (e) {
      setPlanError('Failed to get a plan.');
    } finally {
      setPlanning(false);
    }
  };
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
      <Navigation currentCity={currentCity} onCityEdit={() => setShowCitySelector(true)} onSettings={onOpenProfile} />
      
      <div className="p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 pt-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Consense.us</h1>
          <p className="text-gray-600">Make group decisions effortlessly with your planning sessions</p>

          {/* Idea input box under hero text (glassy underline style; buttons under text) */}
          <div className="max-w-2xl mx-auto mt-6 px-2">
            <div className="relative rounded-2xl bg-gray-900 ring-1 ring-white/10 shadow-xl shadow-blue-900/20 pb-12">
              <input
                type="text"
                value={ideaText}
                onChange={(e) => setIdeaText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    startPlanning();
                  }
                }}
                placeholder="Type your idea and we'll plan it together…"
                className="w-full bg-transparent px-5 pr-44 py-5 text-lg text-gray-100 placeholder-gray-400 rounded-2xl outline-none border-b border-white/15 focus:border-cyan-400/60"
                aria-label="Type your idea"
              />
              {/* Bottom action bar: icons on left, Start button on right */}
              <div className="absolute left-3 right-2 bottom-2 flex items-center justify-between">
                <div className="flex items-center gap-3 text-gray-300">
                  <button
                    type="button"
                    className={`inline-flex items-center justify-center p-1.5 hover:text-white transition-colors ${ (selectedStartDate || selectedEndDate || showCalendar) ? 'text-blue-400' : '' }`}
                    title="Add date"
                    aria-label="Add date"
                    onClick={() => setShowCalendar((s) => !s)}
                    ref={calendarButtonRef}
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className={`inline-flex items-center justify-center p-1.5 hover:text-white transition-colors ${ (selectedBudget || showBudget) ? 'text-emerald-400' : '' }`}
                    title="Add budget"
                    aria-label="Add budget"
                    onClick={() => setShowBudget((s) => !s)}
                    ref={budgetButtonRef}
                  >
                    <DollarSign className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className={`inline-flex items-center justify-center p-1.5 hover:text-white transition-colors ${ (eventLocation || showLocation) ? 'text-fuchsia-400' : '' }`}
                    title="Add location"
                    aria-label="Add location"
                    onClick={() => setShowLocation((s) => !s)}
                    ref={locationButtonRef}
                  >
                    <MapPin className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={startPlanning}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-medium shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-cyan-500/60 disabled:opacity-60"
                  disabled={planning}
                >
                  {planning ? 'Planning…' : 'Start planning'}
                </button>
              </div>
              {showCalendar && (
                <div ref={calendarPopoverRef} className="absolute left-2 top-full mt-2 z-30">
                  <DateRangeCalendar
                    month={calendarMonth}
                    onMonthChange={(d) => setCalendarMonth(d)}
                    mode={calendarMode}
                    onModeChange={(m) => {
                      setCalendarMode(m);
                      // Reset range when switching modes for clarity
                      if (m === 'single') {
                        setSelectedEndDate(undefined);
                      }
                    }}
                    startDate={selectedStartDate}
                    endDate={selectedEndDate}
                    onSelectDate={(d) => {
                      if (calendarMode === 'single') {
                        setSelectedStartDate(d);
                        setSelectedEndDate(undefined);
                      } else {
                        if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
                          setSelectedStartDate(d);
                          setSelectedEndDate(undefined);
                        } else if (selectedStartDate && !selectedEndDate) {
                          if (d < selectedStartDate) {
                            setSelectedEndDate(selectedStartDate);
                            setSelectedStartDate(d);
                          } else {
                            setSelectedEndDate(d);
                          }
                        }
                      }
                    }}
                    className="w-[220px] md:w-[240px]"
                    onApply={() => setShowCalendar(false)}
                    onClear={() => {
                      setSelectedStartDate(undefined);
                      setSelectedEndDate(undefined);
                    }}
                  />
                </div>
              )}
              {showLocation && (
                <div ref={locationPopoverRef} className="absolute left-24 top-full mt-2 z-30">
                  <div className="w-[260px] rounded-2xl bg-gray-900 ring-1 ring-white/10 shadow-xl text-gray-100 p-3">
                    <div className="text-xs text-gray-300 mb-2">Event location</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={locationInput}
                        onChange={(e) => setLocationInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') resolveLocation(); }}
                        placeholder="City or address"
                        className="flex-1 bg-gray-800 text-gray-100 text-xs rounded-md px-2 py-1.5 placeholder-gray-400 outline-none border border-white/10 focus:border-cyan-400/40"
                      />
                      <button
                        type="button"
                        onClick={resolveLocation}
                        disabled={locationLoading || !locationInput.trim()}
                        className="px-2 py-1 text-xs rounded-md bg-cyan-600 text-white disabled:opacity-60"
                      >
                        {locationLoading ? '...' : 'Set'}
                      </button>
                    </div>
                    {eventLocation && (
                      <div className="mt-2 text-[11px] text-gray-400">Selected: {eventLocation.label}</div>
                    )}
                  </div>
                </div>
              )}
              {showBudget && (
                <div ref={budgetPopoverRef} className="absolute left-12 top-full mt-2 z-30">
                  <div className="w-[200px] rounded-2xl bg-gray-900 ring-1 ring-white/10 shadow-xl text-gray-100 p-3">
                    <div className="text-xs text-gray-300 mb-2">Budget</div>
                    <div className="flex items-center gap-2">
                      {[1,2,3,4,5].map(level => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => { setSelectedBudget(level); setShowBudget(false); }}
                          className="p-1"
                          aria-label={`Budget ${level} of 5`}
                        >
                          <DollarSign className={`w-5 h-5 ${selectedBudget && level <= selectedBudget ? 'text-emerald-400' : 'text-gray-400'} hover:text-white transition-colors`} />
                        </button>
                      ))}
                      <span className="ml-2 text-[11px] text-gray-400">{selectedBudget ? `${selectedBudget}/5` : '—/5'}</span>
                    </div>
                  </div>
                </div>
              )}
          </div>
            {planError && (
              <div className="text-left text-sm text-red-600 mt-2 px-2">{planError}</div>
            )}
            {/* Quick actions under idea input */}
            <div className="mt-4 flex items-center justify-center space-x-3">
              <button
                onClick={onCreateNew}
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Create Session</span>
              </button>
              <button
                onClick={onJoinSession}
                className="inline-flex items-center space-x-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-green-700 transition-colors"
              >
                <UserPlus className="w-5 h-5" />
                <span>Join Session</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                {onDeleteSession && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Delete this session? This cannot be undone.')) {
                        onDeleteSession(session.id);
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
          ))}
        </div>

        {sessions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
            <p className="mb-6">Create your first planning session to get started</p>
          </div>
        )}

        {/* Events Feed (defaults to user's location if available) */}
        <EventsFeed 
          query="jazz"
          country={userCountry}
          category="concerts"
          locationAroundOrigin={userCoords ? `${userCoords.lat},${userCoords.lon}` : '40.782409,-73.971885'}
          locationAroundOffset={userCoords ? '10km' : '5mi'}
          onAddFromFeed={onAddEventFromFeed}
        />
        <CitySelector
          currentCity={currentCity}
          onCityChange={onCityChange}
          onClose={() => setShowCitySelector(false)}
          isOpen={showCitySelector}
        />
      </div>
      <AgentPlanModal
        open={planModalOpen}
        onClose={() => {
          // Create a session using the idea as subject and any selected events
          if (onCreateSessionFromPlan) {
            onCreateSessionFromPlan(ideaText.trim(), selectedPlanEvents);
          }
          setPlanModalOpen(false);
          setSelectedPlanEvents([]);
          setIdeaLocationLabel(undefined);
        }}
        idea={ideaText}
        planText={planText}
        model={planModel}
        provider={planProvider}
        places={suggestedPlaces}
        events={suggestedEvents}
        startDate={selectedStartDate}
        endDate={selectedEndDate}
        budgetLevel={selectedBudget}
        locationLabel={eventLocation?.label || ideaLocationLabel}
        onAddFromPlan={(ev: FeedEvent) => {
          // Collect selected events locally for session creation on close, prevent duplicates
          setSelectedPlanEvents(prev => prev.some(e => isSameFeedEvent(e, ev)) ? prev : [...prev, ev]);
        }}
        onRemoveFromPlan={(ev: FeedEvent) => {
          setSelectedPlanEvents(prev => prev.filter(e => !isSameFeedEvent(e, ev)));
        }}
        originCoords={eventLocation ? { lat: eventLocation.lat, lon: eventLocation.lon } : userCoords}
      />
    </div>
    </div>
  );
}
