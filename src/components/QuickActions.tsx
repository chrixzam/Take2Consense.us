import React from 'react';
import { Plus, UserPlus } from 'lucide-react';

interface QuickActionsProps {
  onCreateNew: () => void;
  onJoinSession: () => void;
}

export function QuickActions({ onCreateNew, onJoinSession }: QuickActionsProps) {
  return (
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
  );
}
