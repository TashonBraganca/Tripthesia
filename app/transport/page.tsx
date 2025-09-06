"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Calendar, Users, Plane, Train, Car, Filter, Star, Search, Clock, CreditCard, Shield } from 'lucide-react';
import Link from 'next/link';
import { TopographicalGrid } from '@/components/backgrounds/TopographicalGrid';
import { AnimatedButton } from '@/components/effects/AnimatedButton';
import { InteractiveCard } from '@/components/effects/InteractiveCard';
import { LocationAutocompleteLazy as LocationAutocomplete } from '@/components/forms/LocationAutocompleteLazy';
import { CurrencySelectorLazy as CurrencySelector } from '@/components/forms/CurrencySelectorLazy';
import { LocationData } from '@/lib/data/locations';
import { CurrencyCode } from '@/lib/currency/currency-converter';
import { useGeolocationCurrency } from '@/hooks/useGeolocationCurrency';
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
      <div className="relative min-h-screen bg-navy-950 flex items-center justify-center overflow-hidden">
        <TopographicalGrid 
          density="light" 
          animation={true} 
          parallax={false}
          theme="dark"
          className="absolute inset-0"
        />
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto mb-4"></div>
          <p className="text-lg text-navy-100">Loading transport options...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="relative min-h-screen bg-navy-950 flex items-center justify-center overflow-hidden">
        <TopographicalGrid 
          density="normal" 
          animation={true} 
          parallax={true}
          theme="dark"
          className="absolute inset-0"
        />
        <div className="relative z-10 text-center max-w-md mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Plane className="h-16 w-16 text-teal-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-navy-100 mb-4">Sign in to search transport</h1>
            <p className="text-navy-300 mb-6">Access comprehensive transport search with price tracking and booking.</p>
            <Link href="/sign-in">
              <AnimatedButton variant="primary" size="lg">
                Sign In
              </AnimatedButton>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-navy-950 overflow-hidden">
      {/* Background */}
      <TopographicalGrid 
        density="light" 
        animation={true} 
        parallax={true}
        theme="dark"
        className="absolute inset-0"
      />
      
      {/* Header */}
      <motion.div 
        className="relative z-10 glass backdrop-blur-md border-b border-navy-700/50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/trips" className="flex items-center text-navy-300 hover:text-navy-100 transition-colors duration-200">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Trips
              </Link>
              <div className="h-6 w-px bg-navy-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-navy-100 to-teal-300 bg-clip-text text-transparent">Transport Booking</h1>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-navy-300">
              <span>Welcome,</span>
              <span className="font-medium text-teal-300">{user.firstName}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div 
        className="relative z-10 glass backdrop-blur-md border-b border-navy-700/50"
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
                      ? 'border-teal-400 text-teal-300'
                      : 'border-transparent text-navy-400 hover:text-navy-200 hover:border-navy-500'
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
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
  const [formData, setFormData] = useState({
    from: null as LocationData | null,
    to: null as LocationData | null,
    departureDate: '',
    returnDate: '',
    adults: 1,
    currency: 'USD',
    ...searchParams
  });
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.from && formData.to && formData.departureDate) {
      setIsSearching(true);
      try {
        await onSearch(formData);
        setShowSearchForm(false);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }
  };

  const isFormValid = formData.from && formData.to && formData.departureDate;

  return (
    <div className="space-y-6">
      {/* Modern Search Interface */}
      <InteractiveCard
        variant="glass"
        className="p-8 border-navy-700/50 bg-navy-800/30"
        particles={false}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-teal-400/20">
              <Search className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-navy-100">Find Your Perfect Flight</h2>
              <p className="text-navy-400">Compare flights, trains, and buses in one place</p>
            </div>
          </div>
          {!showSearchForm && (
            <AnimatedButton
              onClick={() => setShowSearchForm(true)}
              variant="outline"
              size="sm"
              className="border-teal-400/50 text-teal-300 hover:bg-teal-400/10"
            >
              Edit Search
            </AnimatedButton>
          )}
        </div>

        <AnimatePresence>
          {showSearchForm && (
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Location Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="departure-input" className="block text-sm font-medium text-navy-200">Departure</label>
                  <LocationAutocomplete
                    id="departure-input"
                    variant="departure"
                    value={formData.from}
                    onChange={(location) => setFormData({ ...formData, from: location })}
                    placeholder="From where?"
                    className="w-full"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="destination-input" className="block text-sm font-medium text-navy-200">Destination</label>
                  <LocationAutocomplete
                    id="destination-input"
                    variant="destination"
                    value={formData.to}
                    onChange={(location) => setFormData({ ...formData, to: location })}
                    placeholder="Where to?"
                    className="w-full"
                    required
                  />
                </div>
              </div>
              
              {/* Travel Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label htmlFor="departure-date-input" className="block text-sm font-medium text-navy-200">Departure Date</label>
                  <div className="relative">
                    <Calendar className="h-4 w-4 absolute left-3 top-3 text-teal-400 z-10" />
                    <input
                      id="departure-date-input"
                      type="date"
                      value={formData.departureDate}
                      onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                      className="w-full pl-10 pr-3 py-3 bg-navy-800/50 border border-navy-600 rounded-xl text-navy-100 placeholder-navy-400 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 focus:outline-none transition-all duration-200"
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="return-date-input" className="block text-sm font-medium text-navy-200">Return Date (Optional)</label>
                  <div className="relative">
                    <Calendar className="h-4 w-4 absolute left-3 top-3 text-teal-400 z-10" />
                    <input
                      id="return-date-input"
                      type="date"
                      value={formData.returnDate}
                      onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                      className="w-full pl-10 pr-3 py-3 bg-navy-800/50 border border-navy-600 rounded-xl text-navy-100 placeholder-navy-400 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 focus:outline-none transition-all duration-200"
                      min={formData.departureDate || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="travelers-input" className="block text-sm font-medium text-navy-200">Travelers</label>
                  <div className="relative">
                    <Users className="h-4 w-4 absolute left-3 top-3 text-teal-400 z-10" />
                    <select
                      id="travelers-input"
                      value={formData.adults}
                      onChange={(e) => setFormData({ ...formData, adults: parseInt(e.target.value) })}
                      className="w-full pl-10 pr-3 py-3 bg-navy-800/50 border border-navy-600 rounded-xl text-navy-100 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 focus:outline-none transition-all duration-200 appearance-none"
                    >
                      {[1,2,3,4,5,6,7,8,9].map(num => (
                        <option key={num} value={num} className="bg-navy-800 text-navy-100">
                          {num} {num === 1 ? 'Adult' : 'Adults'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Currency Selection */}
              <div className="space-y-2">
                <label htmlFor="currency-input" className="block text-sm font-medium text-navy-200">Currency</label>
                <CurrencySelector
                  id="currency-input"
                  value={formData.currency as CurrencyCode}
                  onChange={(currency) => setFormData({ ...formData, currency })}
                  showLocationInfo={true}
                  autoDetect={true}
                  className="max-w-md"
                />
              </div>
              
              {/* Search Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-navy-700/50">
                <div className="flex items-center space-x-4">
                  <AnimatedButton
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    variant="ghost"
                    size="sm"
                    className="text-navy-300 hover:text-navy-100"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </AnimatedButton>
                  
                  <div className="flex items-center space-x-2 text-sm text-navy-400">
                    <Shield className="w-4 h-4" />
                    <span>Secure booking guaranteed</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <AnimatedButton
                    type="button"
                    onClick={() => setShowSearchForm(false)}
                    variant="ghost"
                    size="lg"
                    className="text-navy-300 hover:text-navy-100"
                  >
                    Cancel
                  </AnimatedButton>
                  
                  <AnimatedButton
                    type="submit"
                    disabled={!isFormValid || isSearching}
                    variant="primary"
                    size="lg"
                    className="px-8 py-3 bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-navy-900 font-semibold min-w-[200px]"
                  >
                    {isSearching ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-navy-900 border-t-transparent"></div>
                        <span>Searching...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Search className="w-4 h-4" />
                        <span>Search Flights</span>
                      </div>
                    )}
                  </AnimatedButton>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
        
        {/* Quick Search Summary */}
        {!showSearchForm && (formData.from || formData.to) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-navy-800/20 rounded-xl border border-navy-700/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-teal-400" />
                  <span className="text-navy-200">
                    {formData.from?.name || 'Select departure'} → {formData.to?.name || 'Select destination'}
                  </span>
                </div>
                
                {formData.departureDate && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-teal-400" />
                    <span className="text-navy-200">
                      {new Date(formData.departureDate).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-teal-400" />
                  <span className="text-navy-200">{formData.adults} {formData.adults === 1 ? 'Adult' : 'Adults'}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 text-xs text-navy-400">
                <Clock className="w-3 h-3" />
                <span>Last searched: Just now</span>
              </div>
            </div>
          </motion.div>
        )}
      </InteractiveCard>

      {/* Search Results */}
      {formData.from && formData.to && formData.departureDate && !showSearchForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <TransportSearchResults
            searchParams={{
              from: formData.from.name,
              to: formData.to.name,
              departureDate: formData.departureDate,
              returnDate: formData.returnDate,
              adults: formData.adults,
              currency: formData.currency
            }}
            onSelectTransport={onSelectTransport}
            selectedTransport={selectedTransport}
          />
        </motion.div>
      )}
    </div>
  );
}

// Local Transport View Component
function LocalTransportView({ destination }: { destination: string }) {
  return (
    <div className="space-y-6">
      <InteractiveCard
        variant="glass"
        className="p-8 border-navy-700/50 bg-navy-800/30"
        particles={false}
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 rounded-lg bg-emerald-400/20">
            <Car className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-navy-100">Local Transportation</h2>
            <p className="text-navy-400">Ground transport options in {destination}</p>
          </div>
        </div>
        
        <LocalTransportOptions 
          destination={destination}
          onSelectOption={(option) => console.log('Selected local transport:', option)}
        />
      </InteractiveCard>
    </div>
  );
}

// Price Tracker View Component
function PriceTrackerView({ selectedTransport, searchParams }: any) {
  if (!selectedTransport) {
    return (
      <InteractiveCard
        variant="glass"
        className="p-12 text-center border-navy-700/50 bg-navy-800/30"
        particles={true}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Star className="h-16 w-16 text-amber-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-navy-100 mb-2">No Transport Selected</h3>
          <p className="text-navy-400 mb-6 max-w-md mx-auto">
            Select a transport option from the search results to track its price changes and get alerts.
          </p>
          <AnimatedButton
            onClick={() => window.dispatchEvent(new CustomEvent('changeView', { detail: 'search' }))}
            variant="primary"
            size="lg"
          >
            <Search className="w-4 h-4 mr-2" />
            Search Transport Options
          </AnimatedButton>
        </motion.div>
      </InteractiveCard>
    );
  }

  return (
    <div className="space-y-6">
      <InteractiveCard
        variant="glass"
        className="p-8 border-navy-700/50 bg-navy-800/30"
        particles={false}
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 rounded-lg bg-amber-400/20">
            <Star className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-navy-100">Price Tracker</h2>
            <p className="text-navy-400">Monitor price changes and get alerts</p>
          </div>
        </div>
        
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
      </InteractiveCard>
    </div>
  );
}