'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  detectCurrencyFromLocation, 
  getUserPreferredCurrency,
  currencyPreferences,
  GeolocationCurrencyResult 
} from '@/lib/services/geolocation-currency';
import { CurrencyCode } from '@/lib/currency/currency-converter';

interface UseGeolocationCurrencyOptions {
  autoDetect?: boolean;
  forceRefresh?: boolean;
  onDetectionComplete?: (result: GeolocationCurrencyResult) => void;
  onError?: (error: string) => void;
}

interface UseGeolocationCurrencyReturn {
  currency: CurrencyCode;
  location: GeolocationCurrencyResult['location'];
  detectionMethod: GeolocationCurrencyResult['method'];
  isDetecting: boolean;
  isSuccess: boolean;
  error: string | null;
  detectCurrency: () => Promise<void>;
  setCurrency: (currency: CurrencyCode) => void;
  clearPreferences: () => void;
}

export function useGeolocationCurrency(options: UseGeolocationCurrencyOptions = {}): UseGeolocationCurrencyReturn {
  const {
    autoDetect = true,
    forceRefresh = false,
    onDetectionComplete,
    onError
  } = options;

  const [currency, setCurrencyState] = useState<CurrencyCode>('USD');
  const [location, setLocation] = useState<GeolocationCurrencyResult['location']>(null);
  const [detectionMethod, setDetectionMethod] = useState<GeolocationCurrencyResult['method']>('default');
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectCurrency = useCallback(async () => {
    if (isDetecting) return;

    setIsDetecting(true);
    setError(null);

    try {
      const result = await getUserPreferredCurrency(forceRefresh);
      
      setCurrencyState(result.currency);
      setLocation(result.location);
      setDetectionMethod(result.method);
      setIsSuccess(result.success);

      if (result.error) {
        setError(result.error);
        onError?.(result.error);
      }

      onDetectionComplete?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Currency detection failed';
      setError(errorMessage);
      setIsSuccess(false);
      onError?.(errorMessage);
    } finally {
      setIsDetecting(false);
    }
  }, [forceRefresh, isDetecting, onDetectionComplete, onError]);

  const setCurrency = useCallback((newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency);
    currencyPreferences.save(newCurrency, 'manual');
    setDetectionMethod('manual' as any);
    setIsSuccess(true);
    setError(null);
  }, []);

  const clearPreferences = useCallback(() => {
    currencyPreferences.clear();
    setCurrencyState('USD');
    setLocation(null);
    setDetectionMethod('default');
    setIsSuccess(false);
    setError(null);
  }, []);

  // Auto-detect on mount
  useEffect(() => {
    if (autoDetect) {
      // Check cached preferences first
      const cached = currencyPreferences.load();
      if (cached.currency && !currencyPreferences.shouldRefresh()) {
        setCurrencyState(cached.currency);
        setDetectionMethod((cached.method as any) || 'cached');
        setIsSuccess(true);
        return;
      }

      // Detect new currency
      detectCurrency();
    }
  }, [autoDetect, detectCurrency]);

  return {
    currency,
    location,
    detectionMethod,
    isDetecting,
    isSuccess,
    error,
    detectCurrency,
    setCurrency,
    clearPreferences
  };
}

// Specialized hook for currency selection components
export function useCurrencySelector() {
  const {
    currency,
    location,
    isDetecting,
    isSuccess,
    detectCurrency,
    setCurrency
  } = useGeolocationCurrency();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get suggested currency based on location
  const suggestedCurrency = location?.currency || currency;
  const locationInfo = location ? `${location.city || location.region}, ${location.country}` : null;

  return {
    currency,
    suggestedCurrency,
    locationInfo,
    isDetecting,
    isSuccess,
    isOpen,
    setIsOpen,
    searchQuery,
    setSearchQuery,
    detectCurrency,
    setCurrency
  };
}

export default useGeolocationCurrency;