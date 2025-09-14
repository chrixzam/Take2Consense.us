import React, { useState } from 'react';
import { Share2, Copy, Check, X } from 'lucide-react';

interface ShareSessionModalProps {
  sessionId: string;
  sessionName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareSessionModal({ sessionId, sessionName, isOpen, onClose }: ShareSessionModalProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}?join=${sessionId}`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Share2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Share Session</h3>
              <p className="text-sm text-gray-500">{sessionName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session ID
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-lg text-center">
                {sessionId}
              </div>
              <button
                onClick={() => copyToClipboard(sessionId)}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share Link
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              />
              <button
                onClick={() => copyToClipboard(shareUrl)}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-green-50 rounded-xl p-4">
            <h4 className="font-medium text-green-900 mb-2">How to invite others:</h4>
            <ol className="text-sm text-green-800 space-y-1">
              <li>1. Share the Session ID: <code className="bg-green-100 px-1 rounded">{sessionId}</code></li>
              <li>2. Or send them the complete link above</li>
              <li>3. They can join and start proposing ideas!</li>
            </ol>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
