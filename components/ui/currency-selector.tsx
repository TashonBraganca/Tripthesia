"use client"

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, DollarSign, Check } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { currencies, CurrencyCode, getCurrencyInfo } from '@/lib/currency/currency-converter';

interface CurrencySelectorProps {
  value: CurrencyCode;
  onChange: (currency: CurrencyCode) => void;
  disabled?: boolean;
  className?: string;
  showSymbol?: boolean;
  showName?: boolean;
  placement?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
}

// Helper functions
const getCurrencySymbol = (currency: CurrencyCode): string => {
  const info = getCurrencyInfo(currency);
  return info?.symbol || currency;
};

const getCurrencyName = (currency: CurrencyCode): string => {
  const info = getCurrencyInfo(currency);
  return info?.name || currency;
};

const supportedCurrencies = {
  major: ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD'] as CurrencyCode[],
  asian: ['CNY', 'HKD', 'SGD', 'KRW', 'INR', 'THB'] as CurrencyCode[],
  crypto: ['BTC', 'ETH', 'USDC'] as CurrencyCode[],
  other: ['BRL', 'MXN', 'AED', 'SEK', 'NOK'] as CurrencyCode[]
};

export function CurrencySelector({
  value,
  onChange,
  disabled = false,
  className = '',
  showSymbol = true,
  showName = false,
  placement = 'bottom-right'
}: CurrencySelectorProps) {
  const { formatCurrency } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const handleCurrencyChange = (currency: CurrencyCode) => {
    if (currency === value || disabled) return;
    onChange(currency);
    setIsOpen(false);
  };

  const placementClasses = {
    'bottom-left': 'top-full left-0',
    'bottom-right': 'top-full right-0',
    'top-left': 'bottom-full left-0',
    'top-right': 'bottom-full right-0'
  };

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-contrast-high bg-transparent border border-navy-400/30 rounded-lg hover:bg-navy-800/50 hover:border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-navy-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <DollarSign className="w-4 h-4" />
        {showSymbol && (
          <span className="font-semibold">{getCurrencySymbol(value)}</span>
        )}
        <span className="font-medium">{value}</span>
        {showName && (
          <span className="hidden sm:inline-block text-xs text-contrast-medium">
            {getCurrencyName(value)}
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
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
              aria-label="Close currency selector"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className={`absolute z-20 mt-2 w-80 glass border border-navy-400/30 rounded-xl shadow-xl overflow-hidden ${placementClasses[placement]}`}
            >
              <div className="px-4 py-3 border-b border-navy-400/30">
                <h4 className="text-sm font-medium text-navy-50">
                  Select Currency
                </h4>
              </div>

              <div className="max-h-64 overflow-y-auto">
                {Object.entries(supportedCurrencies).map(([category, currencies]) => (
                  <div key={category}>
                    <div className="px-4 py-2 bg-navy-800/30">
                      <span className="text-xs font-medium text-contrast-medium uppercase tracking-wider">
                        {category}
                      </span>
                    </div>
                    {currencies.map((currency) => {
                      const isSelected = currency === value;
                      
                      return (
                        <button
                          key={currency}
                          type="button"
                          onClick={() => handleCurrencyChange(currency)}
                          disabled={disabled || isSelected}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-navy-800/50 focus:bg-navy-800/50 focus:outline-none transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="text-lg font-semibold text-teal-400">
                            {getCurrencySymbol(currency)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-navy-50">
                              {currency}
                            </div>
                            <div className="text-xs text-contrast-medium">
                              {getCurrencyName(currency)}
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-teal-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="border-t border-navy-400/30 px-4 py-2">
                <p className="text-xs text-contrast-medium">
                  Rates updated every minute
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CurrencyDisplay({ 
  amount, 
  currency,
  className = '' 
}: { 
  amount: number; 
  currency: CurrencyCode;
  className?: string;
}) {
  const { formatNumber } = useI18n();

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span className="font-semibold text-teal-400">
        {getCurrencySymbol(currency)}
      </span>
      <span className="font-medium">
        {formatNumber(amount)}
      </span>
      <span className="text-xs text-contrast-medium">
        {currency}
      </span>
    </span>
  );
}