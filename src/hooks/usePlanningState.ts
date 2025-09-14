import { useState } from 'react';
import type { FeedEvent } from '../types';

export interface PlanningState {
  ideaText: string;
  planning: boolean;
  planModalOpen: boolean;
  planText: string;
  planModel?: string;
  planProvider?: string;
  planError: string | null;
  suggestedPlaces: Array<{ name: string; type: string; lat: number; lon: number; distKm: number; url: string }>;
  suggestedEvents: Array<{ title: string; place?: string; start?: string; url?: string; category?: string }>;
  selectedPlanEvents: FeedEvent[];
  ideaLocationLabel?: string;
  // Location filter state
  eventLocation?: { label: string; lat: number; lon: number };
  eventLocationCountry?: string;
  autoDetectedLocation?: { label: string; lat: number; lon: number };
  autoDetectedLocationCountry?: string;
}

export function usePlanningState() {
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
  const [ideaLocationLabel, setIdeaLocationLabel] = useState<string | undefined>(undefined);
  
  // Location filter state
  const [eventLocation, setEventLocation] = useState<{ label: string; lat: number; lon: number } | undefined>(undefined);
  const [eventLocationCountry, setEventLocationCountry] = useState<string | undefined>(undefined);
  const [autoDetectedLocation, setAutoDetectedLocation] = useState<{ label: string; lat: number; lon: number } | undefined>(undefined);
  const [autoDetectedLocationCountry, setAutoDetectedLocationCountry] = useState<string | undefined>(undefined);

  const resetPlanningState = () => {
    setIdeaText('');
    setPlanError(null);
    setPlanModalOpen(false);
    setSelectedPlanEvents([]);
    setIdeaLocationLabel(undefined);
    setEventLocation(undefined);
    setEventLocationCountry(undefined);
    setAutoDetectedLocation(undefined);
    setAutoDetectedLocationCountry(undefined);
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

  return {
    // State
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
    
    // Setters
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
    
    // Utilities
    resetPlanningState,
    isSameFeedEvent
  };
}
