'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface OutfitPiece {
  name: string;
  description: string;
  shoppingLink?: string;
}

interface Outfit {
  id: string;
  imageUrl: string;
  description: string;
  pieces: OutfitPiece[];
}

function GalleryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('sessionId');

  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    const fetchOutfits = async () => {
      try {
        const response = await fetch(`/api/outfits?sessionId=${sessionId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch outfits');
        }

        const data = await response.json();
        setOutfits(data.outfits || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchOutfits();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-500">Loading outfits...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 py-6 px-4 sticky top-0 bg-white z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-light text-black tracking-tight">
            elle
          </h1>
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-500 hover:text-black transition-colors"
          >
            New Search
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {outfits.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No outfits found</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-lg text-gray-700">
                {outfits.length} {outfits.length === 1 ? 'outfit' : 'outfits'} found
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {outfits.map((outfit) => (
                <button
                  key={outfit.id}
                  onClick={() => setSelectedOutfit(outfit)}
                  className="group relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {outfit.imageUrl ? (
                    <img
                      src={outfit.imageUrl}
                      alt={outfit.description}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-end">
                    <div className="w-full p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-sm font-medium truncate">
                        {outfit.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Outfit Details Modal */}
      {selectedOutfit && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedOutfit(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
              {/* Image */}
              <div className="md:w-1/2 bg-gray-100 flex items-center justify-center p-8">
                {selectedOutfit.imageUrl ? (
                  <img
                    src={selectedOutfit.imageUrl}
                    alt={selectedOutfit.description}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-gray-400">No image</div>
                )}
              </div>

              {/* Details */}
              <div className="md:w-1/2 p-8 overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-2xl font-light text-black">
                    Outfit Details
                  </h3>
                  <button
                    onClick={() => setSelectedOutfit(null)}
                    className="text-gray-400 hover:text-black text-2xl leading-none"
                  >
                    &times;
                  </button>
                </div>

                <p className="text-gray-600 mb-6">
                  {selectedOutfit.description}
                </p>

                <div className="space-y-4">
                  <h4 className="font-medium text-black mb-3">
                    Outfit Pieces
                  </h4>

                  {selectedOutfit.pieces.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                      No pieces identified
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {selectedOutfit.pieces.map((piece, index) => (
                        <li
                          key={index}
                          className="border-l-2 border-gray-200 pl-4 py-2"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <h5 className="font-medium text-black">
                                {piece.name}
                              </h5>
                              <p className="text-sm text-gray-600 mt-1">
                                {piece.description}
                              </p>
                            </div>
                            {piece.shoppingLink && (
                              <a
                                href={piece.shoppingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors whitespace-nowrap"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Shop
                              </a>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Gallery() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <GalleryContent />
    </Suspense>
  );
}
