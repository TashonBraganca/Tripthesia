/**
 * Currency Selector Component
 * Global multi-currency support with live exchange rates
 */

"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronDown, Globe, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  currencyService, 
  Currency, 
  SUPPORTED_CURRENCIES,
  formatCurrency,
  detectUserCurrency,
  getExchangeRate
} from '@/lib/currency-service';
import { trackEvent } from '@/lib/monitoring';

interface CurrencySelectorProps {
  value: Currency;
  onChange: (currency: Currency) => void;
  className?: string;
  showExchangeRates?: boolean;
  showFlag?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

export function CurrencySelector({
  value,
  onChange,
  className,
  showExchangeRates = false,
  showFlag = true,
  size = 'default'
}: CurrencySelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const currencies = currencyService.getSupportedCurrencies();

  // Load exchange rates if needed
  useEffect(() => {
    if (showExchangeRates) {
      loadExchangeRates();
    }
  }, [showExchangeRates, value]);

  const loadExchangeRates = async () => {
    try {
      const rates: Record<string, number> = {};
      
      // Get rates for a few major currencies for comparison
      const majorCurrencies: Currency[] = ['USD', 'EUR', 'GBP', 'JPY'];
      
      for (const currency of majorCurrencies) {
        if (currency !== value) {
          rates[currency] = getExchangeRate(value, currency);
        }
      }
      
      setExchangeRates(rates);
      setLastUpdated(currencyService.getLastUpdateTime());
    } catch (error) {
      console.error('Failed to load exchange rates:', error);
    }
  };

  const handleAutoDetect = async () => {
    setIsDetecting(true);
    
    try {
      const detectedCurrency = await detectUserCurrency();
      
      if (detectedCurrency !== value) {
        onChange(detectedCurrency);
        trackEvent('currency_auto_detected', {
          previous_currency: value,
          detected_currency: detectedCurrency
        });
      }
    } catch (error) {
      console.error('Currency detection failed:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleCurrencyChange = (newCurrency: Currency) => {
    if (newCurrency !== value) {
      onChange(newCurrency);
      trackEvent('currency_changed', {
        previous_currency: value,
        new_currency: newCurrency,
        method: 'manual_select'
      });
    }
    setOpen(false);
  };

  const filteredCurrencies = currencies.filter(currency =>
    currency.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    currency.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    currency.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCurrency = SUPPORTED_CURRENCIES[value];
  
  const sizeClasses = {
    sm: 'h-8 text-sm px-2',
    default: 'h-10 px-3',
    lg: 'h-12 text-lg px-4'
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", sizeClasses[size], className)}
        >
          <div className="flex items-center gap-2">
            {showFlag && <span className="text-sm">{selectedCurrency.flag}</span>}
            <span className="font-medium">{selectedCurrency.symbol}</span>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {value}
            </span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <Command>
          <div className="flex items-center border-b px-3 py-2">
            <Globe className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Search currencies..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="flex-1"
            />
          </div>

          {/* Auto-detect option */}
          <div className="p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAutoDetect}
              disabled={isDetecting}
              className="w-full justify-start"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              {isDetecting ? 'Detecting...' : 'Auto-detect my currency'}
            </Button>
          </div>

          <Separator />

          <CommandEmpty>No currencies found.</CommandEmpty>
          
          <CommandGroup className="max-h-64 overflow-auto">
            {filteredCurrencies.map((currency) => (
              <CommandItem
                key={currency.code}
                value={currency.code}
                onSelect={() => handleCurrencyChange(currency.code)}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    {showFlag && (
                      <span className="text-lg">{currency.flag}</span>
                    )}
                    <div>
                      <div className="font-medium">
                        {currency.symbol} {currency.code}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {currency.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {currency.region}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {showExchangeRates && exchangeRates[currency.code] && (
                      <Badge variant="secondary" className="text-xs">
                        {exchangeRates[currency.code].toFixed(4)}
                      </Badge>
                    )}
                    <Check
                      className={cn(
                        "h-4 w-4",
                        value === currency.code ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>

          {/* Exchange rate info */}
          {showExchangeRates && Object.keys(exchangeRates).length > 0 && (
            <>
              <Separator />
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    Rates updated: {lastUpdated?.toLocaleTimeString() || 'Never'}
                  </span>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  1 {value} = rates shown above
                </div>
              </div>
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Currency converter component
interface CurrencyConverterProps {
  className?: string;
}

export function CurrencyConverter({ className }: CurrencyConverterProps) {
  const [fromCurrency, setFromCurrency] = useState<Currency>('USD');
  const [toCurrency, setToCurrency] = useState<Currency>('EUR');
  const [fromAmount, setFromAmount] = useState<string>('100');
  const [toAmount, setToAmount] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);

  // Auto-convert when inputs change
  useEffect(() => {
    const convertAmount = async () => {
      const amount = parseFloat(fromAmount);
      if (isNaN(amount) || amount <= 0) {
        setToAmount('');
        return;
      }

      setIsConverting(true);
      
      try {
        const converted = await currencyService.convert({
          amount,
          from: fromCurrency,
          to: toCurrency
        });
        
        setToAmount(converted.toFixed(2));
      } catch (error) {
        setToAmount('Error');
        console.error('Conversion failed:', error);
      } finally {
        setIsConverting(false);
      }
    };

    const timeout = setTimeout(convertAmount, 300); // Debounce
    return () => clearTimeout(timeout);
  }, [fromAmount, fromCurrency, toCurrency]);

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setFromAmount(toAmount);
    
    trackEvent('currency_swap', {
      from_currency: fromCurrency,
      to_currency: toCurrency
    });
  };

  return (
    <div className={cn("space-y-4 p-4 border rounded-lg", className)}>
      <div className="text-center">
        <h3 className="font-semibold">Currency Converter</h3>
        <p className="text-sm text-muted-foreground">Live exchange rates</p>
      </div>

      <div className="space-y-3">
        {/* From Currency */}
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
            placeholder="Amount"
            className="flex-1"
            min="0"
            step="0.01"
          />
          <CurrencySelector
            value={fromCurrency}
            onChange={setFromCurrency}
            size="sm"
          />
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={swapCurrencies}
            className="rounded-full w-8 h-8 p-0"
          >
            ⇅
          </Button>
        </div>

        {/* To Currency */}
        <div className="flex items-center gap-2">
          <Input
            value={isConverting ? 'Converting...' : toAmount}
            placeholder="Converted amount"
            className="flex-1"
            readOnly
          />
          <CurrencySelector
            value={toCurrency}
            onChange={setToCurrency}
            size="sm"
          />
        </div>

        {/* Exchange Rate Display */}
        {toAmount && !isConverting && fromAmount && (
          <div className="text-center text-sm text-muted-foreground">
            1 {fromCurrency} = {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(4)} {toCurrency}
          </div>
        )}
      </div>
    </div>
  );
}

// Hook for using currency in components
export function useCurrency() {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeCurrency = async () => {
      try {
        // Try to get saved currency from localStorage
        const savedCurrency = localStorage.getItem('preferred_currency') as Currency;
        
        if (savedCurrency && SUPPORTED_CURRENCIES[savedCurrency]) {
          setCurrency(savedCurrency);
        } else {
          // Auto-detect user's currency
          const detectedCurrency = await detectUserCurrency();
          setCurrency(detectedCurrency);
          localStorage.setItem('preferred_currency', detectedCurrency);
        }
      } catch (error) {
        console.error('Failed to initialize currency:', error);
        setCurrency('USD'); // Fallback
      } finally {
        setIsLoading(false);
      }
    };

    initializeCurrency();
  }, []);

  const updateCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    localStorage.setItem('preferred_currency', newCurrency);
  };

  const formatAmount = (amount: number) => {
    return formatCurrency(amount, currency);
  };

  const convertFrom = async (amount: number, fromCurrency: Currency) => {
    return currencyService.convert({
      amount,
      from: fromCurrency,
      to: currency
    });
  };

  return {
    currency,
    setCurrency: updateCurrency,
    formatAmount,
    convertFrom,
    isLoading,
    currencyInfo: SUPPORTED_CURRENCIES[currency]
  };
}