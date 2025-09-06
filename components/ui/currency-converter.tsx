"use client"

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { currencyConverter, CurrencyCode, getCurrencyInfo } from '@/lib/currency/currency-converter';
import { CurrencySelector } from './currency-selector';
import { useI18n } from '@/lib/i18n/context';

// Helper functions
const getCurrencySymbol = (currency: CurrencyCode): string => {
  const info = getCurrencyInfo(currency);
  return info?.symbol || currency;
};

const getCurrencyName = (currency: CurrencyCode): string => {
  const info = getCurrencyInfo(currency);
  return info?.name || currency;
};

interface CurrencyConverterProps {
  initialAmount?: number;
  fromCurrency?: CurrencyCode;
  toCurrency?: CurrencyCode;
  onConvert?: (result: { amount: number; fromCurrency: CurrencyCode; toCurrency: CurrencyCode; convertedAmount: number; rate: number }) => void;
  className?: string;
}

export function CurrencyConverter({
  initialAmount = 100,
  fromCurrency = 'USD',
  toCurrency = 'EUR',
  onConvert,
  className = ''
}: CurrencyConverterProps) {
  const { formatNumber } = useI18n();
  const [amount, setAmount] = useState(initialAmount);
  const [from, setFrom] = useState<CurrencyCode>(fromCurrency);
  const [to, setTo] = useState<CurrencyCode>(toCurrency);
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [rate, setRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const performConversion = async () => {
    if (!amount || amount <= 0 || from === to) {
      if (from === to) {
        setConvertedAmount(amount);
        setRate(1);
        setError(null);
        setLastUpdate(new Date());
      }
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await currencyConverter.convert(amount, from, to);
      
      setConvertedAmount(result.convertedAmount);
      setRate(result.exchangeRate);
      setLastUpdate(new Date());

      if (onConvert) {
        onConvert({
          amount,
          fromCurrency: from,
          toCurrency: to,
          convertedAmount: result.convertedAmount,
          rate: result.exchangeRate
        });
      }
    } catch (err) {
      console.error('Currency conversion failed:', err);
      setError(err instanceof Error ? err.message : 'Conversion failed');
      setConvertedAmount(null);
      setRate(null);
    } finally {
      setIsLoading(false);
    }
  };

  const swapCurrencies = () => {
    const newFrom = to;
    const newTo = from;
    setFrom(newFrom);
    setTo(newTo);
    
    if (convertedAmount && rate) {
      setAmount(convertedAmount);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performConversion();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [amount, from, to]);

  return (
    <div className={`p-6 glass rounded-2xl border border-navy-400/30 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-teal-500/20 rounded-lg">
          <ArrowLeftRight className="w-5 h-5 text-teal-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-navy-50">
            Currency Converter
          </h3>
          <p className="text-sm text-contrast-medium">
            Real-time exchange rates
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* From Currency */}
        <div className="space-y-2">
          <label htmlFor="from-amount-input" className="text-sm font-medium text-contrast-medium">
            From
          </label>
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                id="from-amount-input"
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="Enter amount"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 bg-navy-800/50 border border-navy-400/30 rounded-lg text-navy-50 placeholder-contrast-medium focus:border-teal-400 focus:ring-1 focus:ring-teal-400 focus:outline-none transition-all"
              />
            </div>
            <CurrencySelector
              value={from}
              onChange={setFrom}
              disabled={isLoading}
              showSymbol={true}
            />
          </div>
          {amount > 0 && (
            <p className="text-xs text-contrast-medium">
              {getCurrencySymbol(from)} {formatNumber(amount)} {getCurrencyName(from)}
            </p>
          )}
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={swapCurrencies}
            disabled={isLoading}
            className="p-2 bg-navy-800/50 hover:bg-navy-700/50 border border-navy-400/30 hover:border-teal-400/50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Swap currencies"
          >
            <motion.div
              animate={isLoading ? { rotate: 180 } : { rotate: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ArrowLeftRight className="w-4 h-4 text-teal-400" />
            </motion.div>
          </button>
        </div>

        {/* To Currency */}
        <div className="space-y-2">
          <label htmlFor="to-currency-display" className="text-sm font-medium text-contrast-medium">
            To
          </label>
          <div className="flex gap-3">
            <div className="flex-1">
              <div id="to-currency-display" className="px-4 py-3 bg-navy-800/30 border border-navy-400/30 rounded-lg">
                {isLoading ? (
                  <div className="flex items-center gap-2 text-contrast-medium">
                    <div className="w-4 h-4 border border-teal-400 border-t-transparent rounded-full animate-spin" />
                    Converting...
                  </div>
                ) : error ? (
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    Error
                  </div>
                ) : convertedAmount !== null ? (
                  <div className="text-navy-50 font-medium">
                    {formatNumber(convertedAmount)}
                  </div>
                ) : (
                  <div className="text-contrast-medium">
                    ---
                  </div>
                )}
              </div>
            </div>
            <CurrencySelector
              value={to}
              onChange={setTo}
              disabled={isLoading}
              showSymbol={true}
            />
          </div>
          {convertedAmount !== null && !error && (
            <p className="text-xs text-contrast-medium">
              {getCurrencySymbol(to)} {formatNumber(convertedAmount)} {getCurrencyName(to)}
            </p>
          )}
        </div>

        {/* Exchange Rate Info */}
        {rate && !error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-teal-500/10 border border-teal-400/30 rounded-lg"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-400" />
                <div>
                  <p className="text-sm font-medium text-navy-50">
                    1 {from} = {formatNumber(rate)} {to}
                  </p>
                  {lastUpdate && (
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-contrast-medium" />
                      <span className="text-xs text-contrast-medium">
                        Updated {lastUpdate.toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-500/10 border border-red-400/30 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <p className="text-sm text-red-400">
                {error}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export function QuickCurrencyConverter({
  amount,
  fromCurrency,
  toCurrency,
  className = ''
}: {
  amount: number;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  className?: string;
}) {
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const convert = async () => {
      try {
        setIsLoading(true);
        const result = await currencyConverter.convert(amount, fromCurrency, toCurrency);
        setConvertedAmount(result.convertedAmount);
      } catch (err) {
        console.error('Quick conversion failed:', err);
        setConvertedAmount(null);
      } finally {
        setIsLoading(false);
      }
    };

    convert();
  }, [amount, fromCurrency, toCurrency]);

  if (isLoading) {
    return (
      <div className={`inline-flex items-center gap-1 ${className}`}>
        <div className="w-3 h-3 border border-teal-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-contrast-medium">Converting...</span>
      </div>
    );
  }

  if (convertedAmount === null) {
    return (
      <div className={`inline-flex items-center gap-1 ${className}`}>
        <AlertCircle className="w-3 h-3 text-red-400" />
        <span className="text-xs text-red-400">Failed</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <span className="text-sm text-contrast-medium">≈</span>
      <span className="font-semibold text-teal-400">
        {getCurrencySymbol(toCurrency)}
      </span>
      <span className="font-medium text-navy-50">
        {convertedAmount.toLocaleString()}
      </span>
      <span className="text-xs text-contrast-medium">
        {toCurrency}
      </span>
    </div>
  );
}