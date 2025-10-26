'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!youtubeUrl || !characterName) {
      setError('Please fill in all fields');
      return;
    }

    // Basic YouTube URL validation
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(youtubeUrl)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          youtubeUrl,
          characterName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze video');
      }

      const data = await response.json();

      // Navigate to gallery with the session ID
      router.push(`/gallery?sessionId=${data.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <main className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-light text-black mb-3 tracking-tight">
            elle
          </h1>
          <p className="text-gray-500 text-sm">
            Discover outfits from your favorite videos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              placeholder="YouTube video URL"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Character or person name"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Analyzing...' : 'Find Outfits'}
          </button>
        </form>

        {loading && (
          <div className="mt-8 text-center text-sm text-gray-500">
            <div className="animate-pulse">
              Analyzing video and identifying outfits...
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
