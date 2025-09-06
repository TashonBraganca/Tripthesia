"use client"

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Globe, Check } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { locales, Locale, supportedLocales } from '@/lib/i18n/config';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'modal' | 'inline';
  showFlag?: boolean;
  showNativeName?: boolean;
  placement?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  className?: string;
}

export function LanguageSelector({
  variant = 'dropdown',
  showFlag = true,
  showNativeName = true,
  placement = 'bottom-right',
  className = ''
}: LanguageSelectorProps) {
  const { locale, setLocale, isLoading, localeConfig } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const handleLocaleChange = async (newLocale: Locale) => {
    if (newLocale === locale || isChanging) return;

    try {
      setIsChanging(true);
      await setLocale(newLocale);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to change locale:', error);
    } finally {
      setIsChanging(false);
    }
  };

  const toggleDropdown = () => {
    if (!isChanging) {
      setIsOpen(!isOpen);
    }
  };

  const placementClasses = {
    'bottom-left': 'top-full left-0',
    'bottom-right': 'top-full right-0',
    'top-left': 'bottom-full left-0',
    'top-right': 'bottom-full right-0'
  };

  if (variant === 'dropdown') {
    return (
      <div className={`relative inline-block text-left ${className}`}>
        <button
          type="button"
          onClick={toggleDropdown}
          disabled={isChanging}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-contrast-high bg-transparent border border-navy-400/30 rounded-lg hover:bg-navy-800/50 hover:border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-navy-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          <Globe className="w-4 h-4" />
          {showFlag && <span className="text-base">{localeConfig.flag}</span>}
          {showNativeName && (
            <span className="hidden sm:inline-block">
              {localeConfig.nativeName}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
          {(isLoading || isChanging) && (
            <div className="w-3 h-3 border border-teal-400 border-t-transparent rounded-full animate-spin" />
          )}
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsOpen(false);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Close language selector"
              />

              {/* Dropdown */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15 }}
                className={`absolute z-20 mt-2 w-64 glass border border-navy-400/30 rounded-xl shadow-xl overflow-hidden ${placementClasses[placement]}`}
              >
                <div className="max-h-80 overflow-y-auto">
                  {supportedLocales.map((localeCode) => {
                    const localeInfo = locales[localeCode];
                    const isSelected = localeCode === locale;
                    
                    return (
                      <button
                        key={localeCode}
                        type="button"
                        onClick={() => handleLocaleChange(localeCode)}
                        disabled={isChanging || isSelected}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-navy-800/50 focus:bg-navy-800/50 focus:outline-none transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="text-lg">{localeInfo.flag}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-navy-50">
                            {localeInfo.name}
                          </div>
                          <div className="text-xs text-contrast-medium">
                            {localeInfo.nativeName}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-teal-400" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="border-t border-navy-400/30 px-4 py-2">
                  <p className="text-xs text-contrast-medium">
                    More languages coming soon
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {supportedLocales.map((localeCode) => {
          const localeInfo = locales[localeCode];
          const isSelected = localeCode === locale;
          
          return (
            <button
              key={localeCode}
              type="button"
              onClick={() => handleLocaleChange(localeCode)}
              disabled={isChanging || isSelected}
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                isSelected
                  ? 'bg-teal-500/20 border-teal-400 text-teal-300'
                  : 'bg-transparent border-navy-400/30 text-contrast-medium hover:bg-navy-800/50 hover:border-teal-400/50 hover:text-teal-400'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="text-base">{localeInfo.flag}</span>
              <span className="hidden sm:inline">
                {localeInfo.nativeName}
              </span>
              <span className="sm:hidden">
                {localeCode.toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // Modal variant
  return (
    <div className={className}>
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={isChanging}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-contrast-high bg-transparent border border-navy-400/30 rounded-lg hover:bg-navy-800/50 hover:border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Globe className="w-4 h-4" />
        {showFlag && <span className="text-base">{localeConfig.flag}</span>}
        {showNativeName && (
          <span className="hidden sm:inline-block">
            {localeConfig.nativeName}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-navy-900/80 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass border border-navy-400/30 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-navy-400/30">
                <h3 className="text-lg font-semibold text-navy-50 flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Select Language
                </h3>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {supportedLocales.map((localeCode) => {
                  const localeInfo = locales[localeCode];
                  const isSelected = localeCode === locale;
                  
                  return (
                    <button
                      key={localeCode}
                      type="button"
                      onClick={() => handleLocaleChange(localeCode)}
                      disabled={isChanging || isSelected}
                      className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-navy-800/50 focus:bg-navy-800/50 focus:outline-none transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="text-2xl">{localeInfo.flag}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-medium text-navy-50">
                          {localeInfo.name}
                        </div>
                        <div className="text-sm text-contrast-medium">
                          {localeInfo.nativeName}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-5 h-5 text-teal-400" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="px-6 py-4 border-t border-navy-400/30 text-center">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-contrast-medium hover:text-teal-400 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Quick language switcher for header/navbar
export function LanguageSwitcher({ className = '' }: { className?: string }) {
  return (
    <LanguageSelector
      variant="dropdown"
      showFlag={true}
      showNativeName={false}
      placement="bottom-right"
      className={className}
    />
  );
}

// Full language selection modal
export function LanguageModal({ 
  isOpen, 
  onClose,
  className = '' 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  className?: string;
}) {
  const { locale, setLocale, isLoading } = useI18n();
  const [isChanging, setIsChanging] = useState(false);

  const handleLocaleChange = async (newLocale: Locale) => {
    if (newLocale === locale || isChanging) return;

    try {
      setIsChanging(true);
      await setLocale(newLocale);
      onClose();
    } catch (error) {
      console.error('Failed to change locale:', error);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-navy-900/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`relative w-full max-w-md glass border border-navy-400/30 rounded-2xl shadow-2xl overflow-hidden ${className}`}
          >
            <div className="px-6 py-4 border-b border-navy-400/30">
              <h3 className="text-lg font-semibold text-navy-50 flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Choose Your Language
              </h3>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {supportedLocales.map((localeCode) => {
                const localeInfo = locales[localeCode];
                const isSelected = localeCode === locale;
                
                return (
                  <button
                    key={localeCode}
                    type="button"
                    onClick={() => handleLocaleChange(localeCode)}
                    disabled={isChanging || isSelected}
                    className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-navy-800/50 focus:bg-navy-800/50 focus:outline-none transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-2xl">{localeInfo.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-medium text-navy-50">
                        {localeInfo.name}
                      </div>
                      <div className="text-sm text-contrast-medium">
                        {localeInfo.nativeName}
                      </div>
                      <div className="text-xs text-contrast-medium/70 mt-1">
                        {localeInfo.regions.slice(0, 3).join(', ')}
                        {localeInfo.regions.length > 3 && '...'}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-teal-400" />
                    )}
                    {(isLoading || isChanging) && isSelected && (
                      <div className="w-4 h-4 border border-teal-400 border-t-transparent rounded-full animate-spin" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="px-6 py-4 border-t border-navy-400/30 flex justify-between items-center">
              <p className="text-xs text-contrast-medium">
                Missing your language? <span className="text-teal-400">Let us know!</span>
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-contrast-medium hover:text-teal-400 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}