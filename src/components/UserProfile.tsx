import React, { useEffect, useState } from 'react';
import { Navigation } from './Navigation';
import { User } from '../types';
import { Plus, User2 } from 'lucide-react';

interface UserProfileProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onBack: () => void;
}

export default function UserProfile({ user, onUpdateUser, onBack }: UserProfileProps) {
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [previewError, setPreviewError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setName(user.name);
    setAvatar(user.avatar || '');
  }, [user.id, user.name, user.avatar]);

  const handleSave = () => {
    const updated: User = { ...user, name: name.trim() || 'You', avatar: avatar.trim() || undefined };
    onUpdateUser(updated);
    onBack();
  };

  async function fileToDataUrl(file: File): Promise<string> {
    // Resize large images to max 512px to keep localStorage small
    const load = (f: File) => new Promise<HTMLImageElement>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });

    const img = await load(file);
    const maxDim = 512;
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.drawImage(img, 0, 0, w, h);
    // Use JPEG to keep size small
    return canvas.toDataURL('image/jpeg', 0.85);
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewError(null);
    if (!file.type.startsWith('image/')) {
      setPreviewError('Please select an image file');
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setAvatar(dataUrl);
    } catch {
      setPreviewError('Could not process the image');
    } finally {
      // reset input so the same file can be chosen again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const AvatarPreview = () => (
    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-3xl font-semibold text-gray-700 overflow-hidden">
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
            <div className="flex items-center space-x-3">
              <AvatarPreview />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                aria-label="Upload photo"
                title="Upload photo"
              >
                <Plus className="w-4 h-4" />
              </button>
              {previewError && (
                <p className="text-sm text-red-600">{previewError}</p>
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
      </main>
    </div>
  );
}
