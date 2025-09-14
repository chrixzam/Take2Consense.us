import React, { useEffect, useState } from 'react';
import { Navigation } from './Navigation';
import { User } from '../types';
import { Camera, User2 } from 'lucide-react';

interface UserProfileProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onBack: () => void;
}

export default function UserProfile({ user, onUpdateUser, onBack }: UserProfileProps) {
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    setName(user.name);
    setAvatar(user.avatar || '');
  }, [user.id]);

  const handleSave = () => {
    const updated: User = { ...user, name: name.trim() || 'You', avatar: avatar.trim() || undefined };
    onUpdateUser(updated);
    onBack();
  };

  const AvatarPreview = () => (
    <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-3xl font-semibold text-gray-700 overflow-hidden">
      {avatar ? (
        <img
          src={avatar}
          alt="Avatar"
          className="w-full h-full object-cover"
          onError={() => setPreviewError('Could not load image')}
          onLoad={() => setPreviewError(null)}
        />
      ) : (
        <User2 className="w-10 h-10 text-gray-400" />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation showBackButton onBack={onBack} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
            <p className="text-gray-600 mt-1">Update your name and avatar.</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Avatar */}
            <div className="flex items-center space-x-4">
              <AvatarPreview />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      placeholder="https://example.com/me.jpg"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Camera className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                  {avatar && (
                    <button
                      className="text-sm text-gray-600 hover:text-gray-800"
                      onClick={() => { setAvatar(''); setPreviewError(null); }}
                    >
                      Remove
                    </button>
                  )}
                </div>
                {previewError && (
                  <p className="text-sm text-red-600 mt-1">{previewError}</p>
                )}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">Shown to other members in sessions.</p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
              <button
                onClick={onBack}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
