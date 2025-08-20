'use client';

import { z } from 'zod';

// Currency definitions
export type CurrencyCode = 
  | 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'SGD' | 'JPY' 
  | 'INR' | 'CNY' | 'HKD' | 'NZD' | 'CHF' | 'SEK' | 'NOK' 
  | 'DKK' | 'PLN' | 'CZK' | 'HUF' | 'RON' | 'BGN' | 'HRK' 
  | 'RUB' | 'UAH' | 'TRY' | 'ZAR' | 'BRL' | 'MXN' | 'ARS' 
  | 'CLP' | 'COP' | 'PEN' | 'UYU' | 'KRW' | 'THB' | 'MYR' 
  | 'IDR' | 'PHP' | 'VND' | 'AED' | 'SAR' | 'QAR' | 'KWD' 
  | 'BHD' | 'OMR' | 'JOD' | 'LBP' | 'EGP' | 'MAD' | 'TND' 
  | 'NGN' | 'GHS' | 'KES' | 'UGX' | 'TZS' | 'ZMW';

export interface CurrencyInfo {
  code: CurrencyCode;
  name: string;
  symbol: string;
  symbolPosition: 'before' | 'after';
  decimalPlaces: number;
  thousandsSeparator: string;
  decimalSeparator: string;
  regions: string[];
  flag: string;
}

export interface ExchangeRates {
  base: CurrencyCode;
  rates: Record<CurrencyCode, number>;
  lastUpdated: string;
  source: string;
}

export interface CurrencyConversionResult {
  originalAmount: number;
  originalCurrency: CurrencyCode;
  convertedAmount: number;
  convertedCurrency: CurrencyCode;
  exchangeRate: number;
  lastUpdated: string;
}

// Comprehensive currency database
export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  // Major currencies
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    regions: ['United States', 'Puerto Rico', 'US Virgin Islands'],
    flag: '🇺🇸'
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    regions: ['European Union', 'Germany', 'France', 'Spain', 'Italy'],
    flag: '🇪🇺'
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    regions: ['United Kingdom', 'England', 'Scotland', 'Wales'],
    flag: '🇬🇧'
  },
  JPY: {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    symbolPosition: 'before',
    decimalPlaces: 0,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    regions: ['Japan'],
    flag: '🇯🇵'
  },
  CAD: {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    regions: ['Canada'],
    flag: '🇨🇦'
  },
  AUD: {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    regions: ['Australia'],
    flag: '🇦🇺'
  },
  CHF: {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: 'Fr',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: "'",
    decimalSeparator: '.',
    regions: ['Switzerland'],
    flag: '🇨🇭'
  },
  CNY: {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    regions: ['China'],
    flag: '🇨🇳'
  },
  INR: {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    regions: ['India'],
    flag: '🇮🇳'
  },
  
  // Regional currencies
  SGD: {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    regions: ['Singapore'],
    flag: '🇸🇬'
  },
  HKD: {
    code: 'HKD',
    name: 'Hong Kong Dollar',
    symbol: 'HK$',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    regions: ['Hong Kong'],
    flag: '🇭🇰'
  },
  NZD: {
    code: 'NZD',
    name: 'New Zealand Dollar',
    symbol: 'NZ$',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    regions: ['New Zealand'],
    flag: '🇳🇿'
  },
  
  // Nordic currencies
  SEK: {
    code: 'SEK',
    name: 'Swedish Krona',
    symbol: 'kr',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
    regions: ['Sweden'],
    flag: '🇸🇪'
  },
  NOK: {
    code: 'NOK',
    name: 'Norwegian Krone',
    symbol: 'kr',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
    regions: ['Norway'],
    flag: '🇳🇴'
  },
  DKK: {
    code: 'DKK',
    name: 'Danish Krone',
    symbol: 'kr',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
    regions: ['Denmark'],
    flag: '🇩🇰'
  },
  
  // Eastern European
  PLN: {
    code: 'PLN',
    name: 'Polish Złoty',
    symbol: 'zł',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
    regions: ['Poland'],
    flag: '🇵🇱'
  },
  CZK: {
    code: 'CZK',
    name: 'Czech Koruna',
    symbol: 'Kč',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
    regions: ['Czech Republic'],
    flag: '🇨🇿'
  },
  HUF: {
    code: 'HUF',
    name: 'Hungarian Forint',
    symbol: 'Ft',
    symbolPosition: 'after',
    decimalPlaces: 0,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
    regions: ['Hungary'],
    flag: '🇭🇺'
  },
  RON: {
    code: 'RON',
    name: 'Romanian Leu',
    symbol: 'lei',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
    regions: ['Romania'],
    flag: '🇷🇴'
  },
  BGN: {
    code: 'BGN',
    name: 'Bulgarian Lev',
    symbol: 'лв',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
    regions: ['Bulgaria'],
    flag: '🇧🇬'
  },
  HRK: {
    code: 'HRK',
    name: 'Croatian Kuna',
    symbol: 'kn',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
    regions: ['Croatia'],
    flag: '🇭🇷'
  },
  RUB: {
    code: 'RUB',
    name: 'Russian Ruble',
    symbol: '₽',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
    regions: ['Russia'],
    flag: '🇷🇺'
  },
  UAH: {
    code: 'UAH',
    name: 'Ukrainian Hryvnia',
    symbol: '₴',
    symbolPosition: 'after',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: ',',
    regions: ['Ukraine'],
    flag: '🇺🇦'
  },
  
  // Other important currencies
  TRY: {
    code: 'TRY',
    name: 'Turkish Lira',
    symbol: '₺',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
    regions: ['Turkey'],
    flag: '🇹🇷'
  },
  ZAR: {
    code: 'ZAR',
    name: 'South African Rand',
    symbol: 'R',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ' ',
    decimalSeparator: '.',
    regions: ['South Africa'],
    flag: '🇿🇦'
  },
  BRL: {
    code: 'BRL',
    name: 'Brazilian Real',
    symbol: 'R$',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
    regions: ['Brazil'],
    flag: '🇧🇷'
  },
  MXN: {
    code: 'MXN',
    name: 'Mexican Peso',
    symbol: '$',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    regions: ['Mexico'],
    flag: '🇲🇽'
  },
  ARS: {
    code: 'ARS',
    name: 'Argentine Peso',
    symbol: '$',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
    regions: ['Argentina'],
    flag: '🇦🇷'
  },
  CLP: {
    code: 'CLP',
    name: 'Chilean Peso',
    symbol: '$',
    symbolPosition: 'before',
    decimalPlaces: 0,
    thousandsSeparator: '.',
    decimalSeparator: ',',
    regions: ['Chile'],
    flag: '🇨🇱'
  },
  COP: {
    code: 'COP',
    name: 'Colombian Peso',
    symbol: '$',
    symbolPosition: 'before',
    decimalPlaces: 0,
    thousandsSeparator: '.',
    decimalSeparator: ',',
    regions: ['Colombia'],
    flag: '🇨🇴'
  },
  PEN: {
    code: 'PEN',
    name: 'Peruvian Sol',
    symbol: 'S/',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    regions: ['Peru'],
    flag: '🇵🇪'
  },
  UYU: {
    code: 'UYU',
    name: 'Uruguayan Peso',
    symbol: '$U',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
    regions: ['Uruguay'],
    flag: '🇺🇾'
  },
  
  // Asian currencies
  KRW: {
    code: 'KRW',
    name: 'South Korean Won',
    symbol: '₩',
    symbolPosition: 'before',
    decimalPlaces: 0,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    regions: ['South Korea'],
    flag: '🇰🇷'
  },
  THB: {
    code: 'THB',
    name: 'Thai Baht',
    symbol: '฿',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    regions: ['Thailand'],
    flag: '🇹🇭'
  },
  MYR: {
    code: 'MYR',
    name: 'Malaysian Ringgit',
    symbol: 'RM',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    regions: ['Malaysia'],
    flag: '🇲🇾'
  },
  IDR: {
    code: 'IDR',
    name: 'Indonesian Rupiah',
    symbol: 'Rp',
    symbolPosition: 'before',
    decimalPlaces: 0,
    thousandsSeparator: '.',
    decimalSeparator: ',',
    regions: ['Indonesia'],
    flag: '🇮🇩'
  },
  PHP: {
    code: 'PHP',
    name: 'Philippine Peso',
    symbol: '₱',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    regions: ['Philippines'],
    flag: '🇵🇭'
  },
  VND: {
    code: 'VND',
    name: 'Vietnamese Dong',
    symbol: '₫',
    symbolPosition: 'after',
    decimalPlaces: 0,
    thousandsSeparator: '.',
    decimalSeparator: ',',
    regions: ['Vietnam'],
    flag: '🇻🇳'
  },
  
  // Middle Eastern currencies
  AED: {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'د.إ',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    regions: ['United Arab Emirates'],
    flag: '🇦🇪'
  },
  SAR: {
    code: 'SAR',
    name: 'Saudi Riyal',
    symbol: 'ر.س',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    regions: ['Saudi Arabia'],
    flag: '🇸🇦'
  },
  QAR: {
    code: 'QAR',
    name: 'Qatari Riyal',
    symbol: 'ر.ق',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    regions: ['Qatar'],
    flag: '🇶🇦'
  },
  KWD: {
    code: 'KWD',
    name: 'Kuwaiti Dinar',
    symbol: 'د.ك',
    symbolPosition: 'before',
    decimalPlaces: 3,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    regions: ['Kuwait'],
    flag: '🇰🇼'
  },
  BHD: {
    code: 'BHD',
    name: 'Bahraini Dinar',
    symbol: 'د.ب',
    symbolPosition: 'before',
    decimalPlaces: 3,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    regions: ['Bahrain'],
    flag: '🇧🇭'
  },
  OMR: {
    code: 'OMR',
    name: 'Omani Rial',
    symbol: 'ر.ع.',
    symbolPosition: 'before',
    decimalPlaces: 3,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    regions: ['Oman'],
    flag: '🇴🇲'
  },
  JOD: {
    code: 'JOD',
    name: 'Jordanian Dinar',
    symbol: 'د.ا',
    symbolPosition: 'before',
    decimalPlaces: 3,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    regions: ['Jordan'],
    flag: '🇯🇴'
  },
  LBP: {
    code: 'LBP',
    name: 'Lebanese Pound',
    symbol: 'ل.ل',
    symbolPosition: 'before',
    decimalPlaces: 0,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    regions: ['Lebanon'],
    flag: '🇱🇧'
  },
  
  // African currencies
  EGP: {
    code: 'EGP',
    name: 'Egyptian Pound',
    symbol: 'ج.م',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    regions: ['Egypt'],
    flag: '🇪🇬'
  },
  MAD: {
    code: 'MAD',
    name: 'Moroccan Dirham',
    symbol: 'د.م.',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    regions: ['Morocco'],
    flag: '🇲🇦'
  },
  TND: {
    code: 'TND',
    name: 'Tunisian Dinar',
    symbol: 'د.ت',
    symbolPosition: 'before',
    decimalPlaces: 3,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    regions: ['Tunisia'],
    flag: '🇹🇳'
  },
  NGN: {
    code: 'NGN',
    name: 'Nigerian Naira',
    symbol: '₦',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    regions: ['Nigeria'],
    flag: '🇳🇬'
  },
  GHS: {
    code: 'GHS',
    name: 'Ghanaian Cedi',
    symbol: '₵',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    regions: ['Ghana'],
    flag: '🇬🇭'
  },
  KES: {
    code: 'KES',
    name: 'Kenyan Shilling',
    symbol: 'KSh',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    regions: ['Kenya'],
    flag: '🇰🇪'
  },
  UGX: {
    code: 'UGX',
    name: 'Ugandan Shilling',
    symbol: 'USh',
    symbolPosition: 'before',
    decimalPlaces: 0,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    regions: ['Uganda'],
    flag: '🇺🇬'
  },
  TZS: {
    code: 'TZS',
    name: 'Tanzanian Shilling',
    symbol: 'TSh',
    symbolPosition: 'before',
    decimalPlaces: 0,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    regions: ['Tanzania'],
    flag: '🇹🇿'
  },
  ZMW: {
    code: 'ZMW',
    name: 'Zambian Kwacha',
    symbol: 'ZK',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    regions: ['Zambia'],
    flag: '🇿🇲'
  }
};

// Regional currency preferences
export const REGIONAL_CURRENCIES: Record<string, CurrencyCode[]> = {
  'North America': ['USD', 'CAD', 'MXN'],
  'Europe': ['EUR', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF'],
  'Asia-Pacific': ['JPY', 'CNY', 'SGD', 'HKD', 'AUD', 'NZD', 'KRW', 'THB', 'MYR', 'IDR', 'PHP', 'VND'],
  'Middle East': ['AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD'],
  'Africa': ['ZAR', 'EGP', 'MAD', 'NGN', 'GHS', 'KES'],
  'South America': ['BRL', 'ARS', 'CLP', 'COP', 'PEN', 'UYU'],
  'India': ['INR'],
};

// Multi-currency service class
class MultiCurrencyService {
  private exchangeRates: ExchangeRates | null = null;
  private lastUpdate: Date | null = null;
  private updateInterval = 3600000; // 1 hour in milliseconds
  private rateLimitCount = 0;
  private rateLimitResetTime = 0;

  /**
   * Initialize the service with base currency and fetch initial rates
   */
  async initialize(baseCurrency: CurrencyCode = 'USD'): Promise<void> {
    try {
      await this.fetchExchangeRates(baseCurrency);
    } catch (error) {
      console.error('Failed to initialize multi-currency service:', error);
      // Load from localStorage as fallback
      this.loadFromCache();
    }
  }

  /**
   * Fetch live exchange rates from multiple sources
   */
  async fetchExchangeRates(baseCurrency: CurrencyCode = 'USD'): Promise<ExchangeRates> {
    // Check rate limiting
    if (this.rateLimitCount >= 100 && Date.now() < this.rateLimitResetTime) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    try {
      // Primary API: ExchangeRate-API (free tier: 1500 requests/month)
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.rates) {
        throw new Error('Invalid response format from exchange rate API');
      }

      this.exchangeRates = {
        base: baseCurrency,
        rates: data.rates,
        lastUpdated: new Date().toISOString(),
        source: 'exchangerate-api.com'
      };

      this.lastUpdate = new Date();
      this.rateLimitCount++;
      
      // Save to localStorage
      this.saveToCache();
      
      return this.exchangeRates;

    } catch (error) {
      console.error('Primary exchange rate API failed:', error);
      
      // Fallback to secondary API
      try {
        return await this.fetchFromFallbackAPI(baseCurrency);
      } catch (fallbackError) {
        console.error('Fallback exchange rate API failed:', fallbackError);
        
        // Use cached data if available
        if (this.exchangeRates) {
          console.warn('Using cached exchange rates');
          return this.exchangeRates;
        }
        
        throw new Error('All exchange rate APIs unavailable and no cached data');
      }
    }
  }

  /**
   * Fallback API for exchange rates
   */
  private async fetchFromFallbackAPI(baseCurrency: CurrencyCode): Promise<ExchangeRates> {
    // Secondary API: Fixer.io (requires API key but has higher limits)
    const apiKey = process.env.NEXT_PUBLIC_FIXER_API_KEY;
    
    if (!apiKey) {
      // Use mock rates for development
      return this.getMockRates(baseCurrency);
    }

    const response = await fetch(
      `https://api.fixer.io/latest?access_key=${apiKey}&base=${baseCurrency}`
    );

    if (!response.ok) {
      throw new Error(`Fixer API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.rates) {
      throw new Error('Invalid response from Fixer API');
    }

    this.exchangeRates = {
      base: baseCurrency,
      rates: data.rates,
      lastUpdated: new Date().toISOString(),
      source: 'fixer.io'
    };

    this.saveToCache();
    return this.exchangeRates;
  }

  /**
   * Generate mock exchange rates for development
   */
  private getMockRates(baseCurrency: CurrencyCode): ExchangeRates {
    // Mock rates based on approximate real-world values (as of 2024)
    const mockRates: Record<CurrencyCode, number> = {
      USD: baseCurrency === 'USD' ? 1 : 1.0,
      EUR: baseCurrency === 'EUR' ? 1 : 0.85,
      GBP: baseCurrency === 'GBP' ? 1 : 0.78,
      JPY: baseCurrency === 'JPY' ? 1 : 148.0,
      CAD: baseCurrency === 'CAD' ? 1 : 1.35,
      AUD: baseCurrency === 'AUD' ? 1 : 1.50,
      CHF: baseCurrency === 'CHF' ? 1 : 0.88,
      CNY: baseCurrency === 'CNY' ? 1 : 7.25,
      INR: baseCurrency === 'INR' ? 1 : 83.0,
      SGD: baseCurrency === 'SGD' ? 1 : 1.35,
      HKD: baseCurrency === 'HKD' ? 1 : 7.80,
      NZD: baseCurrency === 'NZD' ? 1 : 1.65,
      SEK: baseCurrency === 'SEK' ? 1 : 10.5,
      NOK: baseCurrency === 'NOK' ? 1 : 10.8,
      DKK: baseCurrency === 'DKK' ? 1 : 6.35,
      PLN: baseCurrency === 'PLN' ? 1 : 4.25,
      CZK: baseCurrency === 'CZK' ? 1 : 23.5,
      HUF: baseCurrency === 'HUF' ? 1 : 365.0,
      RON: baseCurrency === 'RON' ? 1 : 4.65,
      BGN: baseCurrency === 'BGN' ? 1 : 1.66,
      HRK: baseCurrency === 'HRK' ? 1 : 6.42,
      RUB: baseCurrency === 'RUB' ? 1 : 92.0,
      UAH: baseCurrency === 'UAH' ? 1 : 37.5,
      TRY: baseCurrency === 'TRY' ? 1 : 28.5,
      ZAR: baseCurrency === 'ZAR' ? 1 : 18.2,
      BRL: baseCurrency === 'BRL' ? 1 : 5.15,
      MXN: baseCurrency === 'MXN' ? 1 : 18.8,
      ARS: baseCurrency === 'ARS' ? 1 : 850.0,
      CLP: baseCurrency === 'CLP' ? 1 : 920.0,
      COP: baseCurrency === 'COP' ? 1 : 4200.0,
      PEN: baseCurrency === 'PEN' ? 1 : 3.65,
      UYU: baseCurrency === 'UYU' ? 1 : 39.5,
      KRW: baseCurrency === 'KRW' ? 1 : 1325.0,
      THB: baseCurrency === 'THB' ? 1 : 36.8,
      MYR: baseCurrency === 'MYR' ? 1 : 4.72,
      IDR: baseCurrency === 'IDR' ? 1 : 15800.0,
      PHP: baseCurrency === 'PHP' ? 1 : 56.5,
      VND: baseCurrency === 'VND' ? 1 : 24500.0,
      AED: baseCurrency === 'AED' ? 1 : 3.67,
      SAR: baseCurrency === 'SAR' ? 1 : 3.75,
      QAR: baseCurrency === 'QAR' ? 1 : 3.64,
      KWD: baseCurrency === 'KWD' ? 1 : 0.31,
      BHD: baseCurrency === 'BHD' ? 1 : 0.38,
      OMR: baseCurrency === 'OMR' ? 1 : 0.38,
      JOD: baseCurrency === 'JOD' ? 1 : 0.71,
      LBP: baseCurrency === 'LBP' ? 1 : 15000.0,
      EGP: baseCurrency === 'EGP' ? 1 : 31.0,
      MAD: baseCurrency === 'MAD' ? 1 : 9.85,
      TND: baseCurrency === 'TND' ? 1 : 3.15,
      NGN: baseCurrency === 'NGN' ? 1 : 825.0,
      GHS: baseCurrency === 'GHS' ? 1 : 12.8,
      KES: baseCurrency === 'KES' ? 1 : 155.0,
      UGX: baseCurrency === 'UGX' ? 1 : 3750.0,
      TZS: baseCurrency === 'TZS' ? 1 : 2520.0,
      ZMW: baseCurrency === 'ZMW' ? 1 : 24.5,
    };

    // Adjust rates based on base currency
    const adjustedRates: Record<CurrencyCode, number> = {} as Record<CurrencyCode, number>;
    const baseRate = mockRates[baseCurrency];
    
    Object.entries(mockRates).forEach(([code, rate]) => {
      adjustedRates[code as CurrencyCode] = rate / baseRate;
    });

    return {
      base: baseCurrency,
      rates: adjustedRates,
      lastUpdated: new Date().toISOString(),
      source: 'mock-data'
    };
  }

  /**
   * Convert amount between currencies
   */
  convert(
    amount: number,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode
  ): CurrencyConversionResult | null {
    if (!this.exchangeRates) {
      console.error('Exchange rates not available');
      return null;
    }

    if (fromCurrency === toCurrency) {
      return {
        originalAmount: amount,
        originalCurrency: fromCurrency,
        convertedAmount: amount,
        convertedCurrency: toCurrency,
        exchangeRate: 1,
        lastUpdated: this.exchangeRates.lastUpdated
      };
    }

    const fromRate = this.exchangeRates.rates[fromCurrency];
    const toRate = this.exchangeRates.rates[toCurrency];

    if (!fromRate || !toRate) {
      console.error(`Exchange rate not found for ${fromCurrency} or ${toCurrency}`);
      return null;
    }

    // Convert via base currency
    const baseAmount = amount / fromRate;
    const convertedAmount = baseAmount * toRate;
    const exchangeRate = toRate / fromRate;

    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: convertedAmount,
      convertedCurrency: toCurrency,
      exchangeRate,
      lastUpdated: this.exchangeRates.lastUpdated
    };
  }

  /**
   * Format currency amount with proper localization
   */
  formatAmount(amount: number, currencyCode: CurrencyCode, locale?: string): string {
    const currency = CURRENCIES[currencyCode];
    if (!currency) {
      return `${amount} ${currencyCode}`;
    }

    // Determine locale based on currency if not provided
    if (!locale) {
      const localeMap: Record<CurrencyCode, string> = {
        USD: 'en-US',
        EUR: 'de-DE',
        GBP: 'en-GB',
        JPY: 'ja-JP',
        CNY: 'zh-CN',
        INR: 'en-IN',
        CAD: 'en-CA',
        AUD: 'en-AU',
        CHF: 'de-CH',
        SEK: 'sv-SE',
        NOK: 'nb-NO',
        DKK: 'da-DK',
        PLN: 'pl-PL',
        CZK: 'cs-CZ',
        HUF: 'hu-HU',
        // Add more as needed
      } as Record<CurrencyCode, string>;
      
      locale = localeMap[currencyCode] || 'en-US';
    }

    // Round to appropriate decimal places
    const roundedAmount = Number(amount.toFixed(currency.decimalPlaces));

    try {
      // Use Intl.NumberFormat for proper localization
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: currency.decimalPlaces,
        maximumFractionDigits: currency.decimalPlaces,
      }).format(roundedAmount);
    } catch (error) {
      // Fallback to custom formatting
      return this.formatAmountFallback(roundedAmount, currency);
    }
  }

  /**
   * Fallback formatting when Intl.NumberFormat is not available
   */
  private formatAmountFallback(amount: number, currency: CurrencyInfo): string {
    const parts = amount.toFixed(currency.decimalPlaces).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousandsSeparator);
    const decimalPart = parts[1];

    const formattedNumber = decimalPart 
      ? `${integerPart}${currency.decimalSeparator}${decimalPart}`
      : integerPart;

    return currency.symbolPosition === 'before'
      ? `${currency.symbol}${formattedNumber}`
      : `${formattedNumber} ${currency.symbol}`;
  }

  /**
   * Get user's preferred currency based on location
   */
  async detectUserCurrency(): Promise<CurrencyCode> {
    try {
      // Try to get location from browser
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.currency && CURRENCIES[data.currency as CurrencyCode]) {
        return data.currency as CurrencyCode;
      }
    } catch (error) {
      console.warn('Failed to detect user currency:', error);
    }

    // Fallback: use browser locale
    try {
      const locale = navigator.language || 'en-US';
      const currencyMap: Record<string, CurrencyCode> = {
        'en-US': 'USD',
        'en-GB': 'GBP',
        'de': 'EUR',
        'de-DE': 'EUR',
        'fr': 'EUR',
        'fr-FR': 'EUR',
        'es': 'EUR',
        'es-ES': 'EUR',
        'it': 'EUR',
        'it-IT': 'EUR',
        'ja': 'JPY',
        'ja-JP': 'JPY',
        'zh': 'CNY',
        'zh-CN': 'CNY',
        'zh-TW': 'TWD',
        'ko': 'KRW',
        'ko-KR': 'KRW',
        'en-CA': 'CAD',
        'en-AU': 'AUD',
        'en-IN': 'INR',
        'sv': 'SEK',
        'sv-SE': 'SEK',
        'no': 'NOK',
        'nb-NO': 'NOK',
        'da': 'DKK',
        'da-DK': 'DKK',
        'pl': 'PLN',
        'pl-PL': 'PLN',
        'cs': 'CZK',
        'cs-CZ': 'CZK',
        'hu': 'HUF',
        'hu-HU': 'HUF',
      };

      return currencyMap[locale] || currencyMap[locale.split('-')[0]] || 'USD';
    } catch (error) {
      console.warn('Failed to detect locale-based currency:', error);
      return 'USD';
    }
  }

  /**
   * Check if exchange rates need updating
   */
  needsUpdate(): boolean {
    if (!this.lastUpdate || !this.exchangeRates) return true;
    return Date.now() - this.lastUpdate.getTime() > this.updateInterval;
  }

  /**
   * Get supported currencies for a specific region
   */
  getCurrenciesForRegion(region: string): CurrencyCode[] {
    return REGIONAL_CURRENCIES[region] || [];
  }

  /**
   * Get all supported currencies
   */
  getAllCurrencies(): CurrencyInfo[] {
    return Object.values(CURRENCIES);
  }

  /**
   * Get currency information
   */
  getCurrencyInfo(currencyCode: CurrencyCode): CurrencyInfo | null {
    return CURRENCIES[currencyCode] || null;
  }

  /**
   * Save exchange rates to localStorage
   */
  private saveToCache(): void {
    if (!this.exchangeRates) return;
    
    try {
      localStorage.setItem('tripthesia_exchange_rates', JSON.stringify({
        ...this.exchangeRates,
        cachedAt: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to cache exchange rates:', error);
    }
  }

  /**
   * Load exchange rates from localStorage
   */
  private loadFromCache(): void {
    try {
      const cached = localStorage.getItem('tripthesia_exchange_rates');
      if (cached) {
        const data = JSON.parse(cached);
        
        // Check if cache is still valid (24 hours)
        if (Date.now() - data.cachedAt < 86400000) {
          this.exchangeRates = {
            base: data.base,
            rates: data.rates,
            lastUpdated: data.lastUpdated,
            source: data.source + ' (cached)'
          };
          
          this.lastUpdate = new Date(data.cachedAt);
          console.log('Loaded exchange rates from cache');
        }
      }
    } catch (error) {
      console.warn('Failed to load cached exchange rates:', error);
    }
  }

  /**
   * Clear cached exchange rates
   */
  clearCache(): void {
    try {
      localStorage.removeItem('tripthesia_exchange_rates');
      this.exchangeRates = null;
      this.lastUpdate = null;
    } catch (error) {
      console.warn('Failed to clear exchange rate cache:', error);
    }
  }

  /**
   * Get exchange rate between two currencies
   */
  getExchangeRate(fromCurrency: CurrencyCode, toCurrency: CurrencyCode): number | null {
    const conversion = this.convert(1, fromCurrency, toCurrency);
    return conversion?.exchangeRate || null;
  }

  /**
   * Get multiple conversions for price comparison
   */
  getMultiCurrencyPrices(
    amount: number,
    baseCurrency: CurrencyCode,
    targetCurrencies: CurrencyCode[]
  ): Record<CurrencyCode, CurrencyConversionResult | null> {
    const results: Record<CurrencyCode, CurrencyConversionResult | null> = {} as Record<CurrencyCode, CurrencyConversionResult | null>;
    
    targetCurrencies.forEach(currency => {
      results[currency] = this.convert(amount, baseCurrency, currency);
    });
    
    return results;
  }
}

// Export singleton instance
export const currencyService = new MultiCurrencyService();

// Helper functions
export const formatCurrency = (amount: number, currencyCode: CurrencyCode, locale?: string): string => {
  return currencyService.formatAmount(amount, currencyCode, locale);
};

export const convertCurrency = (
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): CurrencyConversionResult | null => {
  return currencyService.convert(amount, fromCurrency, toCurrency);
};

export const detectUserCurrency = (): Promise<CurrencyCode> => {
  return currencyService.detectUserCurrency();
};

export const getCurrencyInfo = (currencyCode: CurrencyCode): CurrencyInfo | null => {
  return currencyService.getCurrencyInfo(currencyCode);
};

// Export types and constants
export type { CurrencyInfo, ExchangeRates, CurrencyConversionResult };
export { CURRENCIES, REGIONAL_CURRENCIES };
export default currencyService;