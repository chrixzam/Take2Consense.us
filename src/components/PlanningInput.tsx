import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { CalendarFilter } from './filters/CalendarFilter';
import { BudgetFilter } from './filters/BudgetFilter';
import { LocationFilter } from './filters/LocationFilter';
import AgentPlanModal from './AgentPlanModal';
import { usePlanningState } from '../hooks/usePlanningState';
import { useLocationExtraction } from '../hooks/useLocationExtraction';
import { useDateExtraction } from '../hooks/useDateExtraction';
import { planWithAgent } from '../agents/service';
import { findPlaceFromText } from '../utils/geolocation';
import type { FeedEvent } from '../types';

type Coords = { lat: number; lon: number };

interface PlanningInputProps {
  onCreateSessionFromPlan: (
    subject: string, 
    events: FeedEvent[], 
    city?: string,
    userStatedLocation?: string,
    sessionStartDate?: Date,
    sessionEndDate?: Date
  ) => void;
  userCoords?: Coords;
  currentCity: string;
  userCountry?: string;
}

export function PlanningInput({ 
  onCreateSessionFromPlan, 
  userCoords, 
  currentCity, 
  userCountry 
}: PlanningInputProps) {
  const planningState = usePlanningState();
  const { extractLocationFromIdea } = useLocationExtraction();
  const { applySemanticDates, hasDateTerms } = useDateExtraction();
  
  // Filter state
  const [selectedStartDate, setSelectedStartDate] = useState<Date | undefined>(undefined);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>(undefined);
  const [selectedBudget, setSelectedBudget] = useState<number | undefined>(undefined);
  const [lastProcessedText, setLastProcessedText] = useState<string>('');

  const {
    ideaText,
    planning,
    planModalOpen,
    planText,
    planModel,
    planProvider,
    planError,
    suggestedPlaces,
    suggestedEvents,
    selectedPlanEvents,
    ideaLocationLabel,
    eventLocation,
    eventLocationCountry,
    autoDetectedLocation,
    autoDetectedLocationCountry,
    setIdeaText,
    setPlanning,
    setPlanModalOpen,
    setPlanText,
    setPlanModel,
    setPlanProvider,
    setPlanError,
    setSuggestedPlaces,
    setSuggestedEvents,
    setSelectedPlanEvents,
    setIdeaLocationLabel,
    setEventLocation,
    setEventLocationCountry,
    setAutoDetectedLocation,
    setAutoDetectedLocationCountry,
    isSameFeedEvent
  } = planningState;

  const handleDateChange = (startDate?: Date, endDate?: Date) => {
    setSelectedStartDate(startDate);
    setSelectedEndDate(endDate);
  };

  const handleBudgetChange = (budget?: number) => {
    setSelectedBudget(budget);
  };

  const handleLocationChange = (location?: { label: string; lat: number; lon: number }, country?: string) => {
    setEventLocation(location);
    setEventLocationCountry(country);
  };

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
      // Otherwise, try to infer a location from the text (heuristic),
      // and if that fails, let Google Places parse the full idea text.
      let ideaLoc: string | undefined = undefined;
      if (!eventLocation) {
        if (ideaLocAll) {
          ideaLoc = ideaLocAll;
        } else {
          try {
            const placeFromIdea = await findPlaceFromText(ideaText.trim());
            if (placeFromIdea?.label) ideaLoc = placeFromIdea.label;
          } catch {}
        }
      }
      setIdeaLocationLabel(ideaLoc);

      // If both an explicit filter and an idea-mentioned location exist, check country conflict.
      if (eventLocation && ideaLocAll) {
        try {
          // Use Places text lookup to better parse natural-language mentions
          const ideaPlace = await findPlaceFromText(ideaLocAll);
          const ideaCountry = ideaPlace?.countryCode;
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

      // Determine coordinates and city for planning
      // Priority: explicit filter > auto-detected > idea location > user location
      const coordsForPlanning = eventLocation
        ? { lat: eventLocation.lat, lon: eventLocation.lon }
        : autoDetectedLocation
        ? { lat: autoDetectedLocation.lat, lon: autoDetectedLocation.lon }
        : (ideaLoc ? undefined : userCoords);

      const cityForPlanning = eventLocation
        ? eventLocation.label
        : autoDetectedLocation
        ? autoDetectedLocation.label
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      startPlanning();
    }
  };

  const handleModalClose = () => {
    // Create a session using the idea as subject and any selected events
    if (onCreateSessionFromPlan) {
      const cityLabel = eventLocation?.label || autoDetectedLocation?.label || ideaLocationLabel || currentCity;
      
      // Determine the user-stated location (prioritize what the user explicitly stated)
      const userStatedLocation = eventLocation?.label || ideaLocationLabel;
      
      onCreateSessionFromPlan(
        ideaText.trim(), 
        selectedPlanEvents, 
        cityLabel,
        userStatedLocation,
        selectedStartDate,
        selectedEndDate
      );
    }
    setPlanModalOpen(false);
    setSelectedPlanEvents([]);
    setIdeaLocationLabel(undefined);
  };

  const handleAddFromPlan = (ev: FeedEvent) => {
    // Collect selected events locally for session creation on close, prevent duplicates
    setSelectedPlanEvents(prev => prev.some(e => isSameFeedEvent(e, ev)) ? prev : [...prev, ev]);
  };

  const handleRemoveFromPlan = (ev: FeedEvent) => {
    setSelectedPlanEvents(prev => prev.filter(e => !isSameFeedEvent(e, ev)));
  };

  // Auto-detect and apply semantic dates from user input
  useEffect(() => {
    const currentText = ideaText.trim();
    
    // Only process if text has changed and contains date terms
    if (currentText !== lastProcessedText && currentText.length > 0) {
      setLastProcessedText(currentText);
      
      // Only auto-apply dates if no dates are currently selected
      if (!selectedStartDate && !selectedEndDate && hasDateTerms(currentText)) {
        const applied = applySemanticDates(currentText, handleDateChange);
        if (applied) {
          // Optional: Could show a brief notification that dates were auto-detected
          console.log('Auto-detected dates from input:', currentText);
        }
      }
    }
  }, [ideaText, lastProcessedText, selectedStartDate, selectedEndDate, hasDateTerms, applySemanticDates, handleDateChange]);

  // Auto-detect location from user input and sync with location filter
  useEffect(() => {
    const currentText = ideaText.trim();
    
    // Only process if text has changed and no explicit location filter is set
    if (currentText !== lastProcessedText && currentText.length > 0 && !eventLocation) {
      const detectLocation = async () => {
        try {
          const extractedLocation = extractLocationFromIdea(currentText);
          if (extractedLocation) {
            // Try to resolve the extracted location to coordinates
            const place = await findPlaceFromText(extractedLocation);
            if (place?.coords) {
              setAutoDetectedLocation({
                label: place.label || extractedLocation,
                lat: place.coords.lat,
                lon: place.coords.lon
              });
              setAutoDetectedLocationCountry(place.countryCode);
              console.log('Auto-detected location from input:', extractedLocation);
            }
          } else {
            // Clear auto-detected location if no location found in text
            setAutoDetectedLocation(undefined);
            setAutoDetectedLocationCountry(undefined);
          }
        } catch (error) {
          console.log('Failed to auto-detect location:', error);
        }
      };

      detectLocation();
    }
  }, [ideaText, lastProcessedText, eventLocation, extractLocationFromIdea, setAutoDetectedLocation, setAutoDetectedLocationCountry]);

  return (
    <>
      {/* Idea input box under hero text (glassy underline style; buttons under text) */}
      <div className="max-w-2xl mx-auto mt-6 px-2">
        <div className="relative rounded-2xl bg-gray-900 ring-1 ring-white/10 shadow-xl shadow-blue-900/20 pb-12">
          <input
            type="text"
            value={ideaText}
            onChange={(e) => setIdeaText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your idea and we'll plan it together…"
            className="w-full bg-transparent px-5 pr-44 py-5 text-lg text-gray-100 placeholder-gray-400 rounded-2xl outline-none border-b border-white/15 focus:border-cyan-400/60"
            aria-label="Type your idea"
          />
          {/* Bottom action bar: icons on left, Start button on right */}
          <div className="absolute left-3 right-2 bottom-2 flex items-center justify-between">
            <div className="flex items-center gap-3 text-gray-300">
              <CalendarFilter
                selectedStartDate={selectedStartDate}
                selectedEndDate={selectedEndDate}
                onDateChange={handleDateChange}
              />
              <BudgetFilter
                selectedBudget={selectedBudget}
                onBudgetChange={handleBudgetChange}
              />
              <LocationFilter
                eventLocation={eventLocation}
                eventLocationCountry={eventLocationCountry}
                autoDetectedLocation={autoDetectedLocation}
                autoDetectedLocationCountry={autoDetectedLocationCountry}
                onLocationChange={handleLocationChange}
              />
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
        </div>
        {planError && (
          <div className="text-left text-sm text-red-600 mt-2 px-2">{planError}</div>
        )}
      </div>

      <AgentPlanModal
        open={planModalOpen}
        onClose={handleModalClose}
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
        onAddFromPlan={handleAddFromPlan}
        onRemoveFromPlan={handleRemoveFromPlan}
        originCoords={eventLocation 
          ? { lat: eventLocation.lat, lon: eventLocation.lon } 
          : autoDetectedLocation 
          ? { lat: autoDetectedLocation.lat, lon: autoDetectedLocation.lon }
          : userCoords}
      />
    </>
  );
}
