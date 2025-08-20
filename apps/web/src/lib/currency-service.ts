/**
 * Global Multi-Currency Support Service
 * Live exchange rates and regional payment methods
 */

import { z } from 'zod';
import { trackEvent, trackError } from './monitoring';

// Supported currencies with regional information
export const SUPPORTED_CURRENCIES = {
  USD: { name: 'US Dollar', symbol: '$', region: 'North America', flag: '🇺🇸' },
  EUR: { name: 'Euro', symbol: '€', region: 'Europe', flag: '🇪🇺' },
  GBP: { name: 'British Pound', symbol: '£', region: 'United Kingdom', flag: '🇬🇧' },
  CAD: { name: 'Canadian Dollar', symbol: 'C$', region: 'Canada', flag: '🇨🇦' },
  AUD: { name: 'Australian Dollar', symbol: 'A$', region: 'Australia', flag: '🇦🇺' },
  JPY: { name: 'Japanese Yen', symbol: '¥', region: 'Japan', flag: '🇯🇵' },
  SGD: { name: 'Singapore Dollar', symbol: 'S$', region: 'Singapore', flag: '🇸🇬' },
  INR: { name: 'Indian Rupee', symbol: '₹', region: 'India', flag: '🇮🇳' },
  CHF: { name: 'Swiss Franc', symbol: 'CHF', region: 'Switzerland', flag: '🇨🇭' },
  SEK: { name: 'Swedish Krona', symbol: 'kr', region: 'Sweden', flag: '🇸🇪' },
  NOK: { name: 'Norwegian Krone', symbol: 'kr', region: 'Norway', flag: '🇳🇴' },
  DKK: { name: 'Danish Krone', symbol: 'kr', region: 'Denmark', flag: '🇩🇰' },
  CNY: { name: 'Chinese Yuan', symbol: '¥', region: 'China', flag: '🇨🇳' },
  KRW: { name: 'South Korean Won', symbol: '₩', region: 'South Korea', flag: '🇰🇷' },
  BRL: { name: 'Brazilian Real', symbol: 'R$', region: 'Brazil', flag: '🇧🇷' },
  MXN: { name: 'Mexican Peso', symbol: '$', region: 'Mexico', flag: '🇲🇽' }
} as const;

export type Currency = keyof typeof SUPPORTED_CURRENCIES;

// Exchange rate schema
const ExchangeRateSchema = z.object({
  base: z.string(),
  rates: z.record(z.number()),
  timestamp: z.number(),
  source: z.string()
});

export type ExchangeRate = z.infer<typeof ExchangeRateSchema>;

// Currency conversion schema
const ConversionRequestSchema = z.object({
  amount: z.number().positive(),
  from: z.string(),
  to: z.string()
});

export type ConversionRequest = z.infer<typeof ConversionRequestSchema>;

/**
 * Currency Service Class
 * Handles all currency operations including live rates and conversions
 */
export class CurrencyService {
  private static instance: CurrencyService;
  private exchangeRates: Map<string, ExchangeRate> = new Map();
  private lastUpdate: number = 0;
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.initializeRates();
  }

  public static getInstance(): CurrencyService {
    if (!CurrencyService.instance) {
      CurrencyService.instance = new CurrencyService();
    }
    return CurrencyService.instance;
  }

  /**
   * Initialize exchange rates and start periodic updates
   */
  private async initializeRates() {
    await this.updateExchangeRates();
    
    // Update rates every 5 minutes
    this.updateInterval = setInterval(() => {
      this.updateExchangeRates();
    }, this.CACHE_DURATION);
  }

  /**
   * Fetch live exchange rates from multiple sources
   */
  private async updateExchangeRates(): Promise<void> {
    try {
      // Try multiple exchange rate APIs for redundancy
      const sources = [
        () => this.fetchFromExchangeRatesAPI(),
        () => this.fetchFromCurrencyAPI(),
        () => this.fetchFromFixer()
      ];

      for (const fetchSource of sources) {
        try {
          const rates = await fetchSource();
          if (rates) {
            this.exchangeRates.set(rates.base, rates);
            this.lastUpdate = Date.now();
            
            trackEvent('exchange_rates_updated', {
              source: rates.source,
              base_currency: rates.base,
              rates_count: Object.keys(rates.rates).length
            });
            
            break; // Success, no need to try other sources
          }
        } catch (error) {
          console.warn('Failed to fetch from source, trying next...', error);
          continue;
        }
      }
    } catch (error) {
      trackError(error instanceof Error ? error : new Error(String(error)), {
        service: 'currency_service',
        operation: 'update_exchange_rates'
      });
    }
  }

  /**
   * Fetch rates from ExchangeRates-API (free tier)
   */
  private async fetchFromExchangeRatesAPI(): Promise<ExchangeRate | null> {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      
      return {
        base: 'USD',
        rates: data.rates,
        timestamp: Date.now(),
        source: 'exchangerate-api'
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Fetch rates from Currency API (fallback)
   */
  private async fetchFromCurrencyAPI(): Promise<ExchangeRate | null> {
    try {
      const response = await fetch('https://api.currencyapi.com/v3/latest?apikey=YOUR_API_KEY&base_currency=USD');
      const data = await response.json();
      
      if (data.data) {
        const rates: Record<string, number> = {};
        Object.entries(data.data).forEach(([key, value]: [string, any]) => {
          rates[key] = value.value;
        });

        return {
          base: 'USD',
          rates,
          timestamp: Date.now(),
          source: 'currencyapi'
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Fetch rates from Fixer (premium fallback)
   */
  private async fetchFromFixer(): Promise<ExchangeRate | null> {
    try {
      const apiKey = process.env.FIXER_API_KEY;
      if (!apiKey) return null;

      const response = await fetch(`https://api.fixer.io/v1/latest?access_key=${apiKey}&base=USD`);
      const data = await response.json();
      
      if (data.success) {
        return {
          base: 'USD',
          rates: data.rates,
          timestamp: Date.now(),
          source: 'fixer'
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Convert amount between currencies
   */
  public async convert(request: ConversionRequest): Promise<number> {
    try {
      ConversionRequestSchema.parse(request);
      
      const { amount, from, to } = request;
      
      // Same currency, no conversion needed
      if (from === to) {
        return amount;
      }

      // Get exchange rates (base USD)
      const rates = this.exchangeRates.get('USD');
      if (!rates) {
        throw new Error('Exchange rates not available');
      }

      let convertedAmount: number;

      if (from === 'USD') {
        // Converting from USD to target currency
        convertedAmount = amount * (rates.rates[to] || 1);
      } else if (to === 'USD') {
        // Converting to USD from source currency
        convertedAmount = amount / (rates.rates[from] || 1);
      } else {
        // Converting between two non-USD currencies
        const usdAmount = amount / (rates.rates[from] || 1);
        convertedAmount = usdAmount * (rates.rates[to] || 1);
      }

      trackEvent('currency_conversion', {
        from_currency: from,
        to_currency: to,
        original_amount: amount,
        converted_amount: convertedAmount,
        exchange_rate: convertedAmount / amount
      });

      return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places

    } catch (error) {
      trackError(error instanceof Error ? error : new Error(String(error)), {
        service: 'currency_service',
        operation: 'convert',
        request
      });
      
      // Return original amount as fallback
      return request.amount;
    }
  }

  /**
   * Format amount with currency symbol and locale
   */
  public formatAmount(amount: number, currency: Currency, locale?: string): string {
    try {
      const currencyInfo = SUPPORTED_CURRENCIES[currency];
      if (!currencyInfo) {
        return amount.toString();
      }

      // Determine locale based on currency if not provided
      if (!locale) {
        const localeMap: Record<Currency, string> = {
          USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB', CAD: 'en-CA',
          AUD: 'en-AU', JPY: 'ja-JP', SGD: 'en-SG', INR: 'en-IN',
          CHF: 'de-CH', SEK: 'sv-SE', NOK: 'nb-NO', DKK: 'da-DK',
          CNY: 'zh-CN', KRW: 'ko-KR', BRL: 'pt-BR', MXN: 'es-MX'
        };
        locale = localeMap[currency] || 'en-US';
      }

      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: currency === 'JPY' || currency === 'KRW' ? 0 : 2,
        maximumFractionDigits: currency === 'JPY' || currency === 'KRW' ? 0 : 2
      }).format(amount);

    } catch (error) {
      // Fallback to simple format
      const symbol = SUPPORTED_CURRENCIES[currency]?.symbol || '';
      return `${symbol}${amount.toLocaleString()}`;
    }
  }

  /**
   * Get current exchange rate between two currencies
   */
  public getExchangeRate(from: Currency, to: Currency): number {
    if (from === to) return 1;

    const rates = this.exchangeRates.get('USD');
    if (!rates) return 1;

    if (from === 'USD') {
      return rates.rates[to] || 1;
    } else if (to === 'USD') {
      return 1 / (rates.rates[from] || 1);
    } else {
      const usdRate = 1 / (rates.rates[from] || 1);
      return usdRate * (rates.rates[to] || 1);
    }
  }

  /**
   * Detect user's preferred currency based on location
   */
  public async detectUserCurrency(): Promise<Currency> {
    try {
      // Try to get user's location from IP
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      const countryToCurrency: Record<string, Currency> = {
        'US': 'USD', 'CA': 'CAD', 'GB': 'GBP', 'AU': 'AUD',
        'JP': 'JPY', 'SG': 'SGD', 'IN': 'INR', 'CH': 'CHF',
        'SE': 'SEK', 'NO': 'NOK', 'DK': 'DKK', 'CN': 'CNY',
        'KR': 'KRW', 'BR': 'BRL', 'MX': 'MXN'
      };

      const detectedCurrency = countryToCurrency[data.country_code] || 'USD';
      
      // Check if it's in EU for EUR
      const euCountries = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE', 'FI', 'GR', 'LU', 'MT', 'CY', 'SK', 'SI', 'LV', 'LT', 'EE'];
      if (euCountries.includes(data.country_code)) {
        return 'EUR';
      }

      trackEvent('currency_detected', {
        detected_currency: detectedCurrency,
        user_country: data.country_code,
        user_ip: data.ip
      });

      return detectedCurrency;

    } catch (error) {
      // Fallback to USD
      return 'USD';
    }
  }

  /**
   * Get all supported currencies with their info
   */
  public getSupportedCurrencies(): Array<{ code: Currency; name: string; symbol: string; region: string; flag: string }> {
    return Object.entries(SUPPORTED_CURRENCIES).map(([code, info]) => ({
      code: code as Currency,
      ...info
    }));
  }

  /**
   * Check if exchange rates are stale and need updating
   */
  public isStale(): boolean {
    return Date.now() - this.lastUpdate > this.CACHE_DURATION;
  }

  /**
   * Get last update timestamp
   */
  public getLastUpdateTime(): Date {
    return new Date(this.lastUpdate);
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

// Export singleton instance
export const currencyService = CurrencyService.getInstance();

// Utility functions for easy access
export const formatCurrency = (amount: number, currency: Currency, locale?: string) => {
  return currencyService.formatAmount(amount, currency, locale);
};

export const convertCurrency = async (amount: number, from: Currency, to: Currency) => {
  return currencyService.convert({ amount, from, to });
};

export const detectUserCurrency = () => {
  return currencyService.detectUserCurrency();
};

export const getExchangeRate = (from: Currency, to: Currency) => {
  return currencyService.getExchangeRate(from, to);
};