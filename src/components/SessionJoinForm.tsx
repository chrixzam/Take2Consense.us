import React, { useState } from 'react';
import { Users, ArrowRight, AlertCircle } from 'lucide-react';
import { validateSessionId } from '../utils/sessionId';

interface SessionJoinFormProps {
  onJoinSession: (sessionId: string, userName: string) => void;
  onCancel: () => void;
  error?: string;
}

export function SessionJoinForm({ onJoinSession, onCancel, error }: SessionJoinFormProps) {
  const [formData, setFormData] = useState({
    sessionId: '',
    userName: 'You'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sessionId = formData.sessionId.trim().toLowerCase();
    
    if (sessionId && formData.userName.trim()) {
      onJoinSession(sessionId, formData.userName.trim());
    }
  };

  const isValidFormat = formData.sessionId ? validateSessionId(formData.sessionId.trim().toLowerCase()) : true;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Join Planning Session</h1>
          <p className="text-gray-600">Enter the session ID to join and start proposing ideas</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session ID *
            </label>
            <input
              type="text"
              value={formData.sessionId}
              onChange={(e) => setFormData({ ...formData, sessionId: e.target.value })}
              placeholder="amazing-party-123"
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                !isValidFormat ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
              autoFocus
            />
            {!isValidFormat && (
              <p className="mt-1 text-sm text-red-600">
                Format should be: word-word-number (e.g., amazing-party-123)
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name *
            </label>
            <input
              type="text"
              value={formData.userName}
              onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div className="flex space-x-4 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.sessionId.trim() || !formData.userName.trim() || !isValidFormat}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              <span>Join Session</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-xl">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Ask the session organizer for the session ID. It looks like "amazing-party-123"
          </p>
        </div>
      </div>
    </div>
  );
}