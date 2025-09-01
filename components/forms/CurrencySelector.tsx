'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MapPin, Loader2, RefreshCw } from 'lucide-react';
import { useCurrencySelector } from '@/hooks/useGeolocationCurrency';
import { CurrencyCode, currencies, CurrencyInfo } from '@/lib/currency/currency-converter';

interface CurrencySelectorProps {
  value: CurrencyCode;
  onChange: (currency: CurrencyCode) => void;
  className?: string;
  showLocationInfo?: boolean;
  autoDetect?: boolean;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  value,
  onChange,
  className = '',
  showLocationInfo = true,
  autoDetect = true
}) => {
  const {
    suggestedCurrency,
    locationInfo,
    isDetecting,
    isOpen,
    setIsOpen,
    searchQuery,
    setSearchQuery,
    detectCurrency,
    setCurrency
  } = useCurrencySelector();

  const filteredCurrencies = Object.entries(currencies).filter(([code, info]) =>
    code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    info.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCurrencySelect = (currency: CurrencyCode) => {
    onChange(currency);
    setCurrency(currency);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleAutoDetect = async () => {
    await detectCurrency();
    if (suggestedCurrency) {
      onChange(suggestedCurrency);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main selector button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-3 bg-navy-800/50 border border-navy-600/30 rounded-xl backdrop-blur-sm hover:border-teal-400/30 transition-all duration-200 group"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
            <span className="text-sm font-bold text-teal-400">
              {currencies[value]?.symbol || value}
            </span>
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-navy-100">
              {value} - {currencies[value]?.name || 'Unknown Currency'}
            </div>
            {showLocationInfo && locationInfo && !isDetecting && (
              <div className="text-xs text-navy-400 flex items-center space-x-1">
                <MapPin size={10} />
                <span>Detected from {locationInfo}</span>
              </div>
            )}
            {isDetecting && (
              <div className="text-xs text-teal-400 flex items-center space-x-1">
                <Loader2 size={10} className="animate-spin" />
                <span>Detecting location...</span>
              </div>
            )}
          </div>
        </div>
        <ChevronDown 
          size={16} 
          className={`text-navy-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-navy-800/95 backdrop-blur-md border border-navy-600/50 rounded-xl shadow-2xl z-[999999] max-h-80 overflow-hidden"
          >
            {/* Search input */}
            <div className="p-4 border-b border-navy-600/30">
              <input
                type="text"
                placeholder="Search currencies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-navy-700/50 border border-navy-600/30 rounded-lg text-sm text-navy-100 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/30"
                autoFocus
              />
            </div>

            {/* Auto-detect option */}
            {autoDetect && (
              <div className="p-2 border-b border-navy-600/30">
                <button
                  type="button"
                  onClick={handleAutoDetect}
                  disabled={isDetecting}
                  className="flex items-center space-x-3 w-full px-3 py-2 text-left hover:bg-navy-700/50 rounded-lg transition-colors duration-150 disabled:opacity-50"
                >
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
                    {isDetecting ? (
                      <Loader2 size={14} className="animate-spin text-teal-400" />
                    ) : (
                      <RefreshCw size={14} className="text-teal-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-navy-100">
                      Auto-detect from location
                    </div>
                    <div className="text-xs text-navy-400">
                      {isDetecting ? 'Detecting...' : 'Use GPS or IP location'}
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Currency list */}
            <div className="max-h-60 overflow-y-auto">
              {filteredCurrencies.length > 0 ? (
                filteredCurrencies.map(([code, info]: [string, CurrencyInfo]) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleCurrencySelect(code as CurrencyCode)}
                    className={`flex items-center space-x-3 w-full px-4 py-3 text-left hover:bg-navy-700/50 transition-colors duration-150 ${
                      code === value ? 'bg-teal-500/10 border-r-2 border-teal-400' : ''
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-navy-700/50 flex items-center justify-center">
                      <span className="text-sm font-bold text-navy-200">
                        {info.symbol}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-navy-100">
                        {code} - {info.name}
                      </div>
                      {code === suggestedCurrency && (
                        <div className="text-xs text-teal-400">
                          Suggested for your location
                        </div>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-navy-400">No currencies found</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside handler */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[999998]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default CurrencySelector;