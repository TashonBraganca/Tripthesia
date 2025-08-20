'use client';

import { useState } from 'react';

export default function TestPlacesPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchPlaces = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/test-places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, lat: 28.6139, lng: 77.2090 }) // Delhi coordinates
      });
      
      const data = await response.json();
      setResults(data.places || []);
    } catch (error) {
      console.error('Error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🗺️ Test Places Search</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for places (e.g., 'restaurants in Delhi')"
            className="flex-1 p-3 border border-gray-300 rounded-lg"
            onKeyPress={(e) => e.key === 'Enter' && searchPlaces()}
          />
          <button
            onClick={searchPlaces}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        
        <p className="text-sm text-gray-600">
          This will test Foursquare API integration and fallback to mock data if needed.
        </p>
      </div>

      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Found {results.length} places</h2>
          </div>
          <div className="divide-y">
            {results.map((place, index) => (
              <div key={place.id || index} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg">{place.name}</h3>
                    <p className="text-gray-600">{place.category}</p>
                    {place.rating && (
                      <p className="text-sm text-yellow-600">⭐ {place.rating}</p>
                    )}
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>Lat: {place.lat?.toFixed(4)}</p>
                    <p>Lng: {place.lng?.toFixed(4)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}