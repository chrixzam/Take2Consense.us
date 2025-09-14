import React from 'react';

interface AgentPlanModalProps {
  open: boolean;
  onClose: () => void;
  idea: string;
  planText: string;
  model?: string;
  provider?: string;
}

export default function AgentPlanModal({ open, onClose, idea, planText, model, provider }: AgentPlanModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative max-w-2xl w-full mx-4 rounded-2xl bg-white shadow-xl border border-gray-200">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Planning Draft</h3>
          <p className="text-sm text-gray-500 mt-1">Idea: {idea || 'Untitled idea'}</p>
        </div>
        <div className="p-5 max-h-[60vh] overflow-auto whitespace-pre-wrap text-gray-800">
          {planText}
        </div>
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs text-gray-500">{provider ? `${provider}` : ''}{model ? ` • ${model}` : ''}</div>
          <button onClick={onClose} className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black">Close</button>
        </div>
      </div>
    </div>
  );
}

