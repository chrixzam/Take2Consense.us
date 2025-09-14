import React from 'react';
import type { FeedEvent } from '../types';
import type { PlaceSuggestion, EventSuggestion } from '../agents/service';

interface AgentPlanModalProps {
  open: boolean;
  onClose: () => void;
  idea: string;
  planText: string;
  model?: string;
  provider?: string;
  places?: PlaceSuggestion[];
  events?: EventSuggestion[];
  onAddFromPlan?: (ev: FeedEvent) => void;
}

export default function AgentPlanModal({ open, onClose, idea, planText, model, provider, places = [], events = [], onAddFromPlan }: AgentPlanModalProps) {
  // Render plan text with clickable markdown-style links [title](url)
  const renderPlanWithLinks = (text: string) => {
    const parts: React.ReactNode[] = [];
    const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      const label = match[1];
      const url = match[2];
      parts.push(
        <a
          key={`link-${parts.length}`}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 hover:text-blue-700 underline"
        >
          {label}
        </a>
      );
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return parts;
  };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative max-w-5xl w-full mx-4 rounded-2xl bg-white shadow-xl border border-gray-200">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Planning Draft</h3>
          <p className="text-sm text-gray-500 mt-1">Idea: {idea || 'Untitled idea'}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-4">
          <div className="md:col-span-2 p-5 max-h-[60vh] overflow-auto whitespace-pre-wrap text-gray-800 border-b md:border-b-0 md:border-r border-gray-100">
            {renderPlanWithLinks(planText)}
          </div>
          <div className="p-5 max-h-[60vh] overflow-auto">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Suggestions</h4>
            {places.length === 0 && events.length === 0 && (
              <div className="text-sm text-gray-500">No suggestions found.</div>
            )}
            {places.length > 0 && (
              <div className="mb-4">
                <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Nearby places</div>
                <ul className="space-y-2">
                  {places.map((p, idx) => (
                    <li key={`p-${idx}`} className="text-sm text-gray-800 flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-gray-500">{p.type.replace('_',' ')} • ~{p.distKm.toFixed(1)} km</div>
                        {p.url && (
                          <a href={p.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:text-blue-700">Open map</a>
                        )}
                      </div>
                      {onAddFromPlan && (
                        <button
                          type="button"
                          className="shrink-0 text-xs text-green-700 hover:text-green-800"
                          onClick={() => onAddFromPlan({
                            title: p.name,
                            description: `${p.type.replace('_',' ')} • ~${p.distKm.toFixed(1)} km`,
                            category: p.type,
                            locationName: p.name,
                            sourceUrl: p.url,
                          } as FeedEvent)}
                        >
                          + Add
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {events.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Relevant events</div>
                <ul className="space-y-2">
                  {events.map((e, idx) => (
                    <li key={`e-${idx}`} className="text-sm text-gray-800 flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium">{e.title}</div>
                        <div className="text-xs text-gray-500">
                          {e.place ? `${e.place}` : ''}{e.category ? ` • ${e.category}` : ''}{e.start ? ` • ${new Date(e.start).toLocaleString()}` : ''}
                        </div>
                        {e.url && (
                          <a href={e.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:text-blue-700">Open</a>
                        )}
                      </div>
                      {onAddFromPlan && (
                        <button
                          type="button"
                          className="shrink-0 text-xs text-green-700 hover:text-green-800"
                          onClick={() => onAddFromPlan({
                            title: e.title,
                            description: e.start ? new Date(e.start).toLocaleString() : undefined,
                            category: e.category,
                            start: e.start,
                            locationName: e.place,
                            sourceUrl: e.url,
                          } as FeedEvent)}
                        >
                          + Add
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 flex items-center justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black">Close</button>
        </div>
      </div>
    </div>
  );
}
