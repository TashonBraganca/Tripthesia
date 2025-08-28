"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Calendar, Users, Plane, Train, Car, Filter, Star } from 'lucide-react';
import Link from 'next/link';
import TransportSearchResults from '@/components/transport/TransportSearchResults';
import LocalTransportOptions from '@/components/transport/LocalTransportOptions';
import PriceTracker from '@/components/transport/PriceTracker';

export default function TransportPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [currentView, setCurrentView] = useState('search'); // search, local, tracker
  const [searchParams, setSearchParams] = useState({
    from: '',
    to: '',
    departureDate: '',
    returnDate: '',
    adults: 1,
    currency: 'USD',
  });
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load search params from URL or localStorage
    const savedSearch = localStorage.getItem('transportSearch');
    if (savedSearch) {
      try {
        setSearchParams(JSON.parse(savedSearch));
      } catch (error) {
        console.error('Failed to load saved search params');
      }
    }
  }, []);

  const handleSearch = (params: any) => {
    setSearchParams(params);
    localStorage.setItem('transportSearch', JSON.stringify(params));
  };

  const handleSelectTransport = (transport: any) => {
    setSelectedTransport(transport);
    setCurrentView('tracker');
  };

  const views = [
    { id: 'search', name: 'Search Transport', icon: Plane, description: 'Find flights, trains & buses' },
    { id: 'local', name: 'Local Transport', icon: Car, description: 'Ground transportation options' },
    { id: 'tracker', name: 'Price Tracker', icon: Star, description: 'Monitor price changes' },
  ];

  if (!mounted || !isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading transport options...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <Plane className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign in to search transport</h1>
          <p className="text-gray-600 mb-6">Access comprehensive transport search with price tracking and booking.</p>
          <Link
            href="/sign-in"
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div 
        className="bg-white shadow-sm border-b"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/trips"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Trips
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-2xl font-bold text-gray-900">Transport Search</h1>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Welcome,</span>
              <span className="font-medium">{user.firstName}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div 
        className="bg-white border-b"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {views.map((view) => {
              const Icon = view.icon;
              const isActive = currentView === view.id;
              
              return (
                <motion.button
                  key={view.id}
                  onClick={() => setCurrentView(view.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-all duration-200 ${
                    isActive
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  whileHover={{ y: -1 }}
                  whileTap={{ y: 0 }}
                >
                  <Icon className="h-5 w-5" />
                  <div className="text-left">
                    <div className="text-sm font-medium">{view.name}</div>
                    <div className="text-xs hidden sm:block">{view.description}</div>
                  </div>
                </motion.button>
              );
            })}
          </nav>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {currentView === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <SearchTransportView 
                searchParams={searchParams}
                onSearch={handleSearch}
                onSelectTransport={handleSelectTransport}
                selectedTransport={selectedTransport}
              />
            </motion.div>
          )}
          
          {currentView === 'local' && (
            <motion.div
              key="local"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <LocalTransportView destination={searchParams.to || 'your destination'} />
            </motion.div>
          )}
          
          {currentView === 'tracker' && (
            <motion.div
              key="tracker"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PriceTrackerView 
                selectedTransport={selectedTransport}
                searchParams={searchParams}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Search Transport View Component
function SearchTransportView({ searchParams, onSearch, onSelectTransport, selectedTransport }: any) {
  const [showSearchForm, setShowSearchForm] = useState(!searchParams.from || !searchParams.to);
  const [formData, setFormData] = useState(searchParams);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.from && formData.to && formData.departureDate) {
      onSearch(formData);
      setShowSearchForm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <motion.div 
        className="bg-white rounded-xl shadow-sm border p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Search All Transport</h2>
          <motion.button
            onClick={() => setShowSearchForm(!showSearchForm)}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {showSearchForm ? 'Hide' : 'Edit'} Search
          </motion.button>
        </div>

        <AnimatePresence>
          {showSearchForm && (
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                  <div className="relative">
                    <MapPin className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={formData.from}
                      onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Departure city"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <div className="relative">
                    <MapPin className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={formData.to}
                      onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Destination city"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departure</label>
                  <div className="relative">
                    <Calendar className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="date"
                      value={formData.departureDate}
                      onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Travelers</label>
                  <div className="relative">
                    <Users className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                    <select
                      value={formData.adults}
                      onChange={(e) => setFormData({ ...formData, adults: parseInt(e.target.value) })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {[1,2,3,4,5,6,7,8,9].map(num => (
                        <option key={num} value={num}>{num} {num === 1 ? 'Adult' : 'Adults'}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <motion.button
                type="submit"
                className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Search All Transport Options
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Search Results */}
      {searchParams.from && searchParams.to && !showSearchForm && (
        <TransportSearchResults
          searchParams={searchParams}
          onSelectTransport={onSelectTransport}
          selectedTransport={selectedTransport}
        />
      )}
    </div>
  );
}

// Local Transport View Component
function LocalTransportView({ destination }: { destination: string }) {
  return (
    <div className="space-y-6">
      <motion.div 
        className="bg-white rounded-xl shadow-sm border p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <LocalTransportOptions 
          destination={destination}
          onSelectOption={(option) => console.log('Selected local transport:', option)}
        />
      </motion.div>
    </div>
  );
}

// Price Tracker View Component
function PriceTrackerView({ selectedTransport, searchParams }: any) {
  if (!selectedTransport) {
    return (
      <motion.div 
        className="bg-white rounded-xl shadow-sm border p-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Transport Selected</h3>
        <p className="text-gray-600 mb-6">
          Select a transport option from the search results to track its price changes.
        </p>
        <motion.button
          onClick={() => window.dispatchEvent(new CustomEvent('changeView', { detail: 'search' }))}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Search Transport Options
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <PriceTracker
        transportOption={{
          id: selectedTransport.id,
          type: selectedTransport.type,
          provider: selectedTransport.airline || selectedTransport.provider,
          route: `${searchParams.from} → ${searchParams.to}`,
          currentPrice: selectedTransport.price,
          currency: selectedTransport.currency || 'USD',
        }}
        onPriceAlert={(alert) => console.log('Price alert created:', alert)}
      />
    </div>
  );
}