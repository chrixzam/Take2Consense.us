import React, { useState } from 'react';
import { Users, MapPin, Plus, Sparkles } from 'lucide-react';
import { Navigation } from './Navigation';

interface SessionCreationFormProps {
  onCreateSession: (session: {
    name: string;
    description: string;
    city: string;
    members: string[];
  }) => void;
  onCancel: () => void;
  currentCity: string;
}

export function SessionCreationForm({ onCreateSession, onCancel, currentCity }: SessionCreationFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    city: currentCity,
    members: ['You']
  });

  const [newMember, setNewMember] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onCreateSession(formData);
    }
  };

  const addMember = () => {
    if (newMember.trim() && !formData.members.includes(newMember.trim())) {
      setFormData({
        ...formData,
        members: [...formData.members, newMember.trim()]
      });
      setNewMember('');
    }
  };

  const removeMember = (member: string) => {
    if (member !== 'You') {
      setFormData({
        ...formData,
        members: formData.members.filter(m => m !== member)
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Planning Session</h1>
          <p className="text-gray-600">Start organizing events with your group</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Weekend Plans, Birthday Party, Team Outing..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What's the occasion or purpose of this planning session?"
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4" />
              <span>Location</span>
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="City, State"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4" />
              <span>Group Members</span>
            </label>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.members.map((member, index) => (
                <span
                  key={index}
                  className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                    member === 'You' 
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer'
                  }`}
                  onClick={() => removeMember(member)}
                >
                  <span>{member}</span>
                  {member !== 'You' && <span className="text-xs">×</span>}
                </span>
              ))}
            </div>

            <div className="flex space-x-2">
              <input
                type="text"
                value={newMember}
                onChange={(e) => setNewMember(e.target.value)}
                placeholder="Add member name"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMember())}
              />
              <button
                type="button"
                onClick={addMember}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
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
              disabled={!formData.name.trim()}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create Session
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
}