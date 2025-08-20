'use client';

import { useState } from 'react';

export default function TestFlightsPage() {
  const [origin, setOrigin] = useState('DEL');
  const [destination, setDestination] = useState('BOM');
  const [departDate, setDepartDate] = useState('2024-12-01');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchFlights = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-flights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin, destination, departDate })
      });
      
      const data = await response.json();
      setResults(data.flights || []);
    } catch (error) {
      console.error('Error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">✈️ Test Flight Search</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">From</label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="DEL"
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">To</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="BOM"
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Departure</label>
            <input
              type="date"
              value={departDate}
              onChange={(e) => setDepartDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={searchFlights}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Since Kiwi requires business accounts, we're using realistic mock flight data.
            This demonstrates the interface and pricing structure.
          </p>
        </div>
      </div>

      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Flight Options</h2>
          </div>
          <div className="divide-y">
            {results.map((flight, index) => (
              <div key={index} className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="font-medium">{flight.departure.time}</p>
                        <p className="text-sm text-gray-600">{flight.departure.airport}</p>
                      </div>
                      <div className="flex-1 text-center">
                        <p className="text-sm text-gray-600">
                          {flight.duration} • {flight.stops === 0 ? 'Direct' : `${flight.stops} stop(s)`}
                        </p>
                        <div className="w-full h-px bg-gray-300 my-1"></div>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{flight.arrival.time}</p>
                        <p className="text-sm text-gray-600">{flight.arrival.airport}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{flight.airline}</p>
                  </div>
                  <div className="text-right ml-6">
                    <p className="text-2xl font-bold">₹{flight.price.toLocaleString()}</p>
                    <button className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                      Book Now
                    </button>
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