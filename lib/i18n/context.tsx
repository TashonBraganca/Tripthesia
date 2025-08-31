"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Locale, defaultLocale, detectSmartLocale, getLocaleConfig, LocaleConfig } from './config';
import { TranslationKey, TranslationValues, Translations, loadTranslations, getTranslation, getPluralization } from './translations';

interface I18nContextType {
  locale: Locale;
  translations: Translations;
  isLoading: boolean;
  error: string | null;
  localeConfig: LocaleConfig;
  
  // Actions
  setLocale: (locale: Locale) => Promise<void>;
  t: (key: TranslationKey, values?: TranslationValues) => string;
  tp: (key: TranslationKey, count: number, values?: TranslationValues) => string;
  formatNumber: (number: number) => string;
  formatCurrency: (amount: number, currencyCode?: string) => string;
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
  fallbackLocale?: Locale;
}

export function I18nProvider({ 
  children, 
  initialLocale,
  fallbackLocale = defaultLocale 
}: I18nProviderProps) {
  const [locale, setCurrentLocale] = useState<Locale>(initialLocale || defaultLocale);
  const [translations, setTranslations] = useState<Translations>({} as Translations);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const localeConfig = getLocaleConfig(locale);

  // Initialize locale on mount
  useEffect(() => {
    const initializeLocale = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Detect locale if not provided
        let targetLocale = initialLocale;
        
        if (!targetLocale) {
          // Try to get from localStorage
          const savedLocale = localStorage.getItem('tripthesia-locale');
          if (savedLocale) {
            targetLocale = savedLocale as Locale;
          } else {
            // Smart detection
            targetLocale = detectSmartLocale({
              browserLanguage: navigator.language,
              // You could also pass user's country from IP geolocation
            });
          }
        }

        await loadLocaleTranslations(targetLocale);
      } catch (err) {
        console.error('Failed to initialize locale:', err);
        setError(err instanceof Error ? err.message : 'Failed to load translations');
        
        // Fallback to default locale
        if (locale !== fallbackLocale) {
          await loadLocaleTranslations(fallbackLocale);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeLocale();
  }, []); // Run only on mount

  const loadLocaleTranslations = async (newLocale: Locale) => {
    try {
      const newTranslations = await loadTranslations(newLocale);
      setTranslations(newTranslations);
      setCurrentLocale(newLocale);
      
      // Save to localStorage
      localStorage.setItem('tripthesia-locale', newLocale);
      
      // Update document language and direction
      document.documentElement.lang = newLocale;
      document.documentElement.dir = getLocaleConfig(newLocale).rtl ? 'rtl' : 'ltr';
      
    } catch (err) {
      console.error(`Failed to load translations for ${newLocale}:`, err);
      throw err;
    }
  };

  const setLocale = async (newLocale: Locale) => {
    if (newLocale === locale) return;
    
    try {
      setIsLoading(true);
      setError(null);
      await loadLocaleTranslations(newLocale);
    } catch (err) {
      console.error('Failed to change locale:', err);
      setError(err instanceof Error ? err.message : 'Failed to change language');
    } finally {
      setIsLoading(false);
    }
  };

  const t = (key: TranslationKey, values?: TranslationValues): string => {
    return getTranslation(translations, key, values);
  };

  const tp = (key: TranslationKey, count: number, values?: TranslationValues): string => {
    return getPluralization(translations, key, count, values);
  };

  const formatNumber = (number: number): string => {
    return new Intl.NumberFormat(locale).format(number);
  };

  const formatCurrency = (amount: number, currencyCode?: string): string => {
    const currency = currencyCode || localeConfig.currency.code;
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      currencyDisplay: 'symbol'
    }).format(amount);
  };

  const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };

    return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(date);
  };

  const contextValue: I18nContextType = {
    locale,
    translations,
    isLoading,
    error,
    localeConfig,
    setLocale,
    t,
    tp,
    formatNumber,
    formatCurrency,
    formatDate
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

// Hook to use i18n context
export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  
  return context;
}

// Hook for translation only (lighter than full context)
export function useTranslation() {
  const { t, tp, locale, isLoading } = useI18n();
  
  return {
    t,
    tp,
    locale,
    isLoading
  };
}

// Hook for formatting functions
export function useFormatting() {
  const { formatNumber, formatCurrency, formatDate, locale, localeConfig } = useI18n();
  
  return {
    formatNumber,
    formatCurrency, 
    formatDate,
    locale,
    localeConfig
  };
}

// HOC for components that need translations
export function withTranslation<P extends object>(
  Component: React.ComponentType<P & { t: I18nContextType['t'] }>
) {
  return function TranslatedComponent(props: P) {
    const { t } = useTranslation();
    return <Component {...props} t={t} />;
  };
}