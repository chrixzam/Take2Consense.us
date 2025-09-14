import React, { useState } from 'react';
import { Plus, Calendar, MapPin, DollarSign, Clock } from 'lucide-react';

interface IdeaSubmissionFormProps {
  onSubmit: (idea: {
    title: string;
    description: string;
    location: string;
    budget: number;
    duration: number;
    date: Date;
    suggestedBy: string;
    imageDataUrl?: string;
    sourceUrl?: string;
  }) => void;
  currentCity: string;
  sessionName: string;
  onOpenRandom?: () => void;
}

export function IdeaSubmissionForm({ onSubmit, currentCity, sessionName, onOpenRandom }: IdeaSubmissionFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: currentCity,
    budget: 50,
    duration: 2,
    date: new Date(),
    suggestedBy: 'You',
    imageDataUrl: undefined as string | undefined,
    sourceUrl: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim()) {
      onSubmit(formData);
      setFormData({
        title: '',
        description: '',
        location: currentCity,
        budget: 50,
        duration: 2,
        date: new Date(),
        suggestedBy: 'You',
        imageDataUrl: undefined,
        sourceUrl: ''
      });
      setIsExpanded(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 ease-out">
      {!isExpanded ? (
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setIsExpanded(true)}
              className="flex items-center space-x-3 text-left group"
            >
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 group-hover:bg-blue-200 rounded-xl transition-colors">
                <Plus className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">Propose an idea for {sessionName}</p>
                <p className="text-sm text-gray-500">Share your suggestion with this planning session</p>
              </div>
            </button>
            {onOpenRandom && (
              <button
                type="button"
                onClick={onOpenRandom}
                className="px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg whitespace-nowrap"
              >
                Random Picker
              </button>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-gray-900">New Idea for {sessionName}</h3>
            <div className="flex items-center gap-2">
              {onOpenRandom && (
                <button
                  type="button"
                  onClick={onOpenRandom}
                  className="px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg"
                >
                  Random Picker
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>

          <div>
            <input
              type="text"
              placeholder="What would you like to do?"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-0 py-2 text-xl font-medium placeholder-gray-400 border-0 border-b-2 border-gray-200 focus:border-blue-600 focus:ring-0 bg-transparent"
              autoFocus
            />
        </div>

          <div>
            <textarea
              placeholder="Add more details (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Link input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Link (optional)</label>
            <input
              type="url"
              placeholder="https://example.com/details or tickets"
              value={formData.sourceUrl}
              onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <Calendar className="w-4 h-4" />
                <span>Date</span>
              </label>
              <input
                type="date"
                value={formatDate(formData.date)}
                onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <MapPin className="w-4 h-4" />
                <span>Location</span>
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <DollarSign className="w-4 h-4" />
                <span>Budget per person</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  min="0"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: parseInt(e.target.value) || 0 })}
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                <Clock className="w-4 h-4" />
                <span>Duration (hours)</span>
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseFloat(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Image upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Image (optional)</label>
            <div className="flex items-start gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  // Basic size guard: ~2MB
                  if (file.size > 2 * 1024 * 1024) {
                    alert('Image is too large. Please select an image under 2MB.');
                    e.currentTarget.value = '';
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    const result = typeof reader.result === 'string' ? reader.result : undefined;
                    setFormData({ ...formData, imageDataUrl: result });
                  };
                  reader.readAsDataURL(file);
                }}
                className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
              />
              {formData.imageDataUrl && (
                <div className="relative">
                  <img src={formData.imageDataUrl} alt="Preview" className="w-24 h-24 object-cover rounded-lg border" />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, imageDataUrl: undefined })}
                    className="mt-2 text-xs text-gray-600 hover:text-gray-900"
                  >
                    Remove image
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.title.trim()}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add Idea
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
