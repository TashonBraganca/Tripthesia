/**
 * Currency Conversion System for Tripthesia
 * Real-time exchange rates and multi-currency support
 */

import { Locale } from '../i18n/config';

export type CurrencyCode = 
  // Major currencies
  | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CHF' | 'CAD' | 'AUD' | 'NZD'
  // Asian currencies
  | 'CNY' | 'HKD' | 'SGD' | 'KRW' | 'TWD' | 'THB' | 'MYR' | 'IDR' | 'PHP' | 'VND' | 'INR' | 'PKR' | 'BDT' | 'LKR'
  // European currencies
  | 'SEK' | 'NOK' | 'DKK' | 'PLN' | 'CZK' | 'HUF' | 'RON' | 'BGN' | 'HRK' | 'ISK'
  // Middle East & Africa
  | 'AED' | 'SAR' | 'QAR' | 'KWD' | 'BHD' | 'OMR' | 'JOD' | 'ILS' | 'TRY' | 'EGP' | 'ZAR' | 'MAD' | 'TND'
  // Latin America
  | 'BRL' | 'MXN' | 'ARS' | 'CLP' | 'COP' | 'PEN' | 'UYU' | 'BOB' | 'PYG' | 'VES'
  // Other
  | 'RUB' | 'UAH' | 'BYN' | 'KZT' | 'UZS' | 'GEL' | 'AMD' | 'AZN'
  // Cryptocurrencies
  | 'BTC' | 'ETH' | 'USDC' | 'USDT';

export interface CurrencyInfo {
  code: CurrencyCode;
  name: string;
  symbol: string;
  symbolPosition: 'before' | 'after';
  decimals: number;
  thousandSeparator: string;
  decimalSeparator: string;
  countries: string[];
  locale: string;
  crypto: boolean;
  active: boolean;
}

export const currencies: Record<CurrencyCode, CurrencyInfo> = {
  // Major currencies
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    countries: ['US', 'EC', 'ZW', 'SV', 'PA'],
    locale: 'en-US',
    crypto: false,
    active: true
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    symbolPosition: 'after',
    decimals: 2,
    thousandSeparator: ' ',
    decimalSeparator: ',',
    countries: ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'FI', 'IE', 'LU', 'SK', 'SI', 'EE', 'LV', 'LT', 'CY', 'MT'],
    locale: 'de-DE',
    crypto: false,
    active: true
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    countries: ['GB', 'GG', 'JE', 'IM'],
    locale: 'en-GB',
    crypto: false,
    active: true
  },
  JPY: {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    symbolPosition: 'before',
    decimals: 0,
    thousandSeparator: ',',
    decimalSeparator: '.',
    countries: ['JP'],
    locale: 'ja-JP',
    crypto: false,
    active: true
  },
  CHF: {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: 'CHF',
    symbolPosition: 'after',
    decimals: 2,
    thousandSeparator: "'",
    decimalSeparator: '.',
    countries: ['CH', 'LI'],
    locale: 'de-CH',
    crypto: false,
    active: true
  },
  CAD: {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    countries: ['CA'],
    locale: 'en-CA',
    crypto: false,
    active: true
  },
  AUD: {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    countries: ['AU', 'CX', 'CC', 'HM', 'KI', 'NR', 'NF', 'TV'],
    locale: 'en-AU',
    crypto: false,
    active: true
  },
  NZD: {
    code: 'NZD',
    name: 'New Zealand Dollar',
    symbol: 'NZ$',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    countries: ['NZ', 'CK', 'NU', 'PN', 'TK'],
    locale: 'en-NZ',
    crypto: false,
    active: true
  },

  // Asian currencies
  CNY: {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    countries: ['CN'],
    locale: 'zh-CN',
    crypto: false,
    active: true
  },
  INR: {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    countries: ['IN'],
    locale: 'en-IN',
    crypto: false,
    active: true
  },
  SGD: {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    countries: ['SG'],
    locale: 'en-SG',
    crypto: false,
    active: true
  },
  HKD: {
    code: 'HKD',
    name: 'Hong Kong Dollar',
    symbol: 'HK$',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    countries: ['HK'],
    locale: 'en-HK',
    crypto: false,
    active: true
  },
  KRW: {
    code: 'KRW',
    name: 'South Korean Won',
    symbol: '₩',
    symbolPosition: 'before',
    decimals: 0,
    thousandSeparator: ',',
    decimalSeparator: '.',
    countries: ['KR'],
    locale: 'ko-KR',
    crypto: false,
    active: true
  },
  THB: {
    code: 'THB',
    name: 'Thai Baht',
    symbol: '฿',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    countries: ['TH'],
    locale: 'th-TH',
    crypto: false,
    active: true
  },
  MYR: {
    code: 'MYR',
    name: 'Malaysian Ringgit',
    symbol: 'RM',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    countries: ['MY'],
    locale: 'ms-MY',
    crypto: false,
    active: true
  },
  IDR: {
    code: 'IDR',
    name: 'Indonesian Rupiah',
    symbol: 'Rp',
    symbolPosition: 'before',
    decimals: 0,
    thousandSeparator: '.',
    decimalSeparator: ',',
    countries: ['ID'],
    locale: 'id-ID',
    crypto: false,
    active: true
  },
  PHP: {
    code: 'PHP',
    name: 'Philippine Peso',
    symbol: '₱',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    countries: ['PH'],
    locale: 'en-PH',
    crypto: false,
    active: true
  },
  VND: {
    code: 'VND',
    name: 'Vietnamese Dong',
    symbol: '₫',
    symbolPosition: 'after',
    decimals: 0,
    thousandSeparator: '.',
    decimalSeparator: ',',
    countries: ['VN'],
    locale: 'vi-VN',
    crypto: false,
    active: true
  },
  TWD: {
    code: 'TWD',
    name: 'Taiwan Dollar',
    symbol: 'NT$',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    countries: ['TW'],
    locale: 'zh-TW',
    crypto: false,
    active: true
  },
  PKR: {
    code: 'PKR',
    name: 'Pakistani Rupee',
    symbol: '₨',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    countries: ['PK'],
    locale: 'ur-PK',
    crypto: false,
    active: true
  },
  BDT: {
    code: 'BDT',
    name: 'Bangladeshi Taka',
    symbol: '৳',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    countries: ['BD'],
    locale: 'bn-BD',
    crypto: false,
    active: true
  },
  LKR: {
    code: 'LKR',
    name: 'Sri Lankan Rupee',
    symbol: 'Rs',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    countries: ['LK'],
    locale: 'si-LK',
    crypto: false,
    active: true
  },

  // European currencies
  SEK: {
    code: 'SEK',
    name: 'Swedish Krona',
    symbol: 'kr',
    symbolPosition: 'after',
    decimals: 2,
    thousandSeparator: ' ',
    decimalSeparator: ',',
    countries: ['SE'],
    locale: 'sv-SE',
    crypto: false,
    active: true
  },
  NOK: {
    code: 'NOK',
    name: 'Norwegian Krone',
    symbol: 'kr',
    symbolPosition: 'after',
    decimals: 2,
    thousandSeparator: ' ',
    decimalSeparator: ',',
    countries: ['NO', 'SJ', 'BV'],
    locale: 'nb-NO',
    crypto: false,
    active: true
  },
  DKK: {
    code: 'DKK',
    name: 'Danish Krone',
    symbol: 'kr',
    symbolPosition: 'after',
    decimals: 2,
    thousandSeparator: '.',
    decimalSeparator: ',',
    countries: ['DK', 'FO', 'GL'],
    locale: 'da-DK',
    crypto: false,
    active: true
  },
  PLN: {
    code: 'PLN',
    name: 'Polish Zloty',
    symbol: 'zł',
    symbolPosition: 'after',
    decimals: 2,
    thousandSeparator: ' ',
    decimalSeparator: ',',
    countries: ['PL'],
    locale: 'pl-PL',
    crypto: false,
    active: true
  },
  CZK: {
    code: 'CZK',
    name: 'Czech Koruna',
    symbol: 'Kč',
    symbolPosition: 'after',
    decimals: 2,
    thousandSeparator: ' ',
    decimalSeparator: ',',
    countries: ['CZ'],
    locale: 'cs-CZ',
    crypto: false,
    active: true
  },
  HUF: {
    code: 'HUF',
    name: 'Hungarian Forint',
    symbol: 'Ft',
    symbolPosition: 'after',
    decimals: 0,
    thousandSeparator: ' ',
    decimalSeparator: ',',
    countries: ['HU'],
    locale: 'hu-HU',
    crypto: false,
    active: true
  },
  RON: {
    code: 'RON',
    name: 'Romanian Leu',
    symbol: 'lei',
    symbolPosition: 'after',
    decimals: 2,
    thousandSeparator: '.',
    decimalSeparator: ',',
    countries: ['RO'],
    locale: 'ro-RO',
    crypto: false,
    active: true
  },
  BGN: {
    code: 'BGN',
    name: 'Bulgarian Lev',
    symbol: 'лв',
    symbolPosition: 'after',
    decimals: 2,
    thousandSeparator: ' ',
    decimalSeparator: ',',
    countries: ['BG'],
    locale: 'bg-BG',
    crypto: false,
    active: true
  },
  HRK: {
    code: 'HRK',
    name: 'Croatian Kuna',
    symbol: 'kn',
    symbolPosition: 'after',
    decimals: 2,
    thousandSeparator: '.',
    decimalSeparator: ',',
    countries: ['HR'],
    locale: 'hr-HR',
    crypto: false,
    active: true
  },
  ISK: {
    code: 'ISK',
    name: 'Icelandic Krona',
    symbol: 'kr',
    symbolPosition: 'after',
    decimals: 0,
    thousandSeparator: '.',
    decimalSeparator: ',',
    countries: ['IS'],
    locale: 'is-IS',
    crypto: false,
    active: true
  },

  // Middle East & Africa
  AED: {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'د.إ',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    countries: ['AE'],
    locale: 'ar-AE',
    crypto: false,
    active: true
  },
  SAR: {
    code: 'SAR',
    name: 'Saudi Riyal',
    symbol: 'ر.س',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    countries: ['SA'],
    locale: 'ar-SA',
    crypto: false,
    active: true
  },
  QAR: {
    code: 'QAR',
    name: 'Qatari Riyal',
    symbol: 'ر.ق',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    countries: ['QA'],
    locale: 'ar-QA',
    crypto: false,
    active: true
  },
  KWD: {
    code: 'KWD',
    name: 'Kuwaiti Dinar',
    symbol: 'د.ك',
    symbolPosition: 'before',
    decimals: 3,
    thousandSeparator: ',',
    decimalSeparator: '.',
    countries: ['KW'],
    locale: 'ar-KW',
    crypto: false,
    active: true
  },
  BHD: {
    code: 'BHD',
    name: 'Bahraini Dinar',
    symbol: 'د.ب',
    symbolPosition: 'before',
    decimals: 3,
    thousandSeparator: ',',
    decimalSeparator: '.',
    countries: ['BH'],
    locale: 'ar-BH',
    crypto: false,
    active: true
  },
  OMR: {
    code: 'OMR',
    name: 'Omani Rial',
    symbol: 'ر.ع.',
    symbolPosition: 'before',
    decimals: 3,
    thousandSeparator: ',',
    decimalSeparator: '.',
    countries: ['OM'],
    locale: 'ar-OM',
    crypto: false,
    active: true
  },
  JOD: {
    code: 'JOD',
    name: 'Jordanian Dinar',
    symbol: 'د.ا',
    symbolPosition: 'before',
    decimals: 3,
    thousandSeparator: ',',
    decimalSeparator: '.',
    countries: ['JO'],
    locale: 'ar-JO',
    crypto: false,
    active: true
  },
  ILS: {
    code: 'ILS',
    name: 'Israeli Shekel',
    symbol: '₪',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    countries: ['IL', 'PS'],
    locale: 'he-IL',
    crypto: false,
    active: true
  },
  TRY: {
    code: 'TRY',
    name: 'Turkish Lira',
    symbol: '₺',
    symbolPosition: 'after',
    decimals: 2,
    thousandSeparator: '.',
    decimalSeparator: ',',
    countries: ['TR', 'CY'],
    locale: 'tr-TR',
    crypto: false,
    active: true
  },
  EGP: {
    code: 'EGP',
    name: 'Egyptian Pound',
    symbol: 'ج.م',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    countries: ['EG'],
    locale: 'ar-EG',
    crypto: false,
    active: true
  },
  ZAR: {
    code: 'ZAR',
    name: 'South African Rand',
    symbol: 'R',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: ' ',
    decimalSeparator: '.',
    countries: ['ZA', 'LS', 'NA', 'SZ'],
    locale: 'en-ZA',
    crypto: false,
    active: true
  },
  MAD: {
    code: 'MAD',
    name: 'Moroccan Dirham',
    symbol: 'د.م.',
    symbolPosition: 'after',
    decimals: 2,
    thousandSeparator: ' ',
    decimalSeparator: ',',
    countries: ['MA', 'EH'],
    locale: 'ar-MA',
    crypto: false,
    active: true
  },
  TND: {
    code: 'TND',
    name: 'Tunisian Dinar',
    symbol: 'د.ت',
    symbolPosition: 'before',
    decimals: 3,
    thousandSeparator: ' ',
    decimalSeparator: ',',
    countries: ['TN'],
    locale: 'ar-TN',
    crypto: false,
    active: true
  },

  // Latin America
  BRL: {
    code: 'BRL',
    name: 'Brazilian Real',
    symbol: 'R$',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: '.',
    decimalSeparator: ',',
    countries: ['BR'],
    locale: 'pt-BR',
    crypto: false,
    active: true
  },
  MXN: {
    code: 'MXN',
    name: 'Mexican Peso',
    symbol: '$',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    countries: ['MX'],
    locale: 'es-MX',
    crypto: false,
    active: true
  },
  ARS: {
    code: 'ARS',
    name: 'Argentine Peso',
    symbol: '$',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: '.',
    decimalSeparator: ',',
    countries: ['AR'],
    locale: 'es-AR',
    crypto: false,
    active: true
  },
  CLP: {
    code: 'CLP',
    name: 'Chilean Peso',
    symbol: '$',
    symbolPosition: 'before',
    decimals: 0,
    thousandSeparator: '.',
    decimalSeparator: ',',
    countries: ['CL'],
    locale: 'es-CL',
    crypto: false,
    active: true
  },
  COP: {
    code: 'COP',
    name: 'Colombian Peso',
    symbol: '$',
    symbolPosition: 'before',
    decimals: 0,
    thousandSeparator: '.',
    decimalSeparator: ',',
    countries: ['CO'],
    locale: 'es-CO',
    crypto: false,
    active: true
  },
  PEN: {
    code: 'PEN',
    name: 'Peruvian Sol',
    symbol: 'S/',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    countries: ['PE'],
    locale: 'es-PE',
    crypto: false,
    active: true
  },
  UYU: {
    code: 'UYU',
    name: 'Uruguayan Peso',
    symbol: '$U',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: '.',
    decimalSeparator: ',',
    countries: ['UY'],
    locale: 'es-UY',
    crypto: false,
    active: true
  },
  BOB: {
    code: 'BOB',
    name: 'Bolivian Boliviano',
    symbol: 'Bs.',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: '.',
    decimalSeparator: ',',
    countries: ['BO'],
    locale: 'es-BO',
    crypto: false,
    active: true
  },
  PYG: {
    code: 'PYG',
    name: 'Paraguayan Guarani',
    symbol: '₲',
    symbolPosition: 'before',
    decimals: 0,
    thousandSeparator: '.',
    decimalSeparator: ',',
    countries: ['PY'],
    locale: 'es-PY',
    crypto: false,
    active: true
  },
  VES: {
    code: 'VES',
    name: 'Venezuelan Bolívar',
    symbol: 'Bs.S',
    symbolPosition: 'before',
    decimals: 2,
    thousandSeparator: '.',
    decimalSeparator: ',',
    countries: ['VE'],
    locale: 'es-VE',
    crypto: false,
    active: true
  },

  // Other
  RUB: {
    code: 'RUB',
    name: 'Russian Ruble',
    symbol: '₽',
    symbolPosition: 'after',
    decimals: 2,
    thousandSeparator: ' ',
    decimalSeparator: ',',
    countries: ['RU'],
    locale: 'ru-RU',
    crypto: false,
    active: true
  },
  UAH: {
    code: 'UAH',
    name: 'Ukrainian Hryvnia',
    symbol: '₴',
    symbolPosition: 'after',
    decimals: 2,
    thousandSeparator: ' ',
    decimalSeparator: ',',
    countries: ['UA'],
    locale: 'uk-UA',
    crypto: false,
    active: true
  },
  BYN: {
    code: 'BYN',
    name: 'Belarusian Ruble',
    symbol: 'Br',
    symbolPosition: 'after',
    decimals: 2,
    thousandSeparator: ' ',
    decimalSeparator: ',',
    countries: ['BY'],
    locale: 'be-BY',
    crypto: false,
    active: true
  },
  KZT: {
    code: 'KZT',
    name: 'Kazakhstani Tenge',
    symbol: '₸',
    symbolPosition: 'after',
    decimals: 2,
    thousandSeparator: ' ',
    decimalSeparator: ',',
    countries: ['KZ'],
    locale: 'kk-KZ',
    crypto: false,
    active: true
  },
  UZS: {
    code: 'UZS',
    name: 'Uzbekistani Som',
    symbol: 'soʻm',
    symbolPosition: 'after',
    decimals: 0,
    thousandSeparator: ' ',
    decimalSeparator: ',',
    countries: ['UZ'],
    locale: 'uz-UZ',
    crypto: false,
    active: true
  },
  GEL: {
    code: 'GEL',
    name: 'Georgian Lari',
    symbol: '₾',
    symbolPosition: 'after',
    decimals: 2,
    thousandSeparator: ' ',
    decimalSeparator: ',',
    countries: ['GE'],
    locale: 'ka-GE',
    crypto: false,
    active: true
  },
  AMD: {
    code: 'AMD',
    name: 'Armenian Dram',
    symbol: '֏',
    symbolPosition: 'after',
    decimals: 0,
    thousandSeparator: ' ',
    decimalSeparator: ',',
    countries: ['AM'],
    locale: 'hy-AM',
    crypto: false,
    active: true
  },
  AZN: {
    code: 'AZN',
    name: 'Azerbaijani Manat',
    symbol: '₼',
    symbolPosition: 'after',
    decimals: 2,
    thousandSeparator: ' ',
    decimalSeparator: ',',
    countries: ['AZ'],
    locale: 'az-AZ',
    crypto: false,
    active: true
  },

  // Cryptocurrencies
  BTC: {
    code: 'BTC',
    name: 'Bitcoin',
    symbol: '₿',
    symbolPosition: 'before',
    decimals: 8,
    thousandSeparator: ',',
    decimalSeparator: '.',
    countries: [],
    locale: 'en-US',
    crypto: true,
    active: false
  },
  ETH: {
    code: 'ETH',
    name: 'Ethereum',
    symbol: 'Ξ',
    symbolPosition: 'before',
    decimals: 6,
    thousandSeparator: ',',
    decimalSeparator: '.',
    countries: [],
    locale: 'en-US',
    crypto: true,
    active: false
  },
  USDC: {
    code: 'USDC',
    name: 'USD Coin',
    symbol: 'USDC',
    symbolPosition: 'before',
    decimals: 6,
    thousandSeparator: ',',
    decimalSeparator: '.',
    countries: [],
    locale: 'en-US',
    crypto: true,
    active: false
  },
  USDT: {
    code: 'USDT',
    name: 'Tether',
    symbol: 'USDT',
    symbolPosition: 'before',
    decimals: 6,
    thousandSeparator: ',',
    decimalSeparator: '.',
    countries: [],
    locale: 'en-US',
    crypto: true,
    active: false
  }
};

// Exchange rates interface
export interface ExchangeRate {
  from: CurrencyCode;
  to: CurrencyCode;
  rate: number;
  timestamp: number;
  source: string;
}

// In-memory cache for exchange rates
const exchangeRateCache = new Map<string, ExchangeRate>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Currency Converter class
export class CurrencyConverter {
  private apiKey?: string;
  private baseUrl: string;

  constructor(options: { apiKey?: string; baseUrl?: string } = {}) {
    this.apiKey = options.apiKey || process.env.EXCHANGE_RATE_API_KEY;
    this.baseUrl = options.baseUrl || 'https://api.exchangerate-api.com/v4/latest';
  }

  // Convert amount from one currency to another
  async convert(
    amount: number,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode
  ): Promise<{
    originalAmount: number;
    convertedAmount: number;
    exchangeRate: number;
    fromCurrency: CurrencyCode;
    toCurrency: CurrencyCode;
    timestamp: number;
  }> {
    if (fromCurrency === toCurrency) {
      return {
        originalAmount: amount,
        convertedAmount: amount,
        exchangeRate: 1,
        fromCurrency,
        toCurrency,
        timestamp: Date.now()
      };
    }

    const exchangeRate = await this.getExchangeRate(fromCurrency, toCurrency);
    const convertedAmount = amount * exchangeRate.rate;

    return {
      originalAmount: amount,
      convertedAmount,
      exchangeRate: exchangeRate.rate,
      fromCurrency,
      toCurrency,
      timestamp: exchangeRate.timestamp
    };
  }

  // Get exchange rate between two currencies
  async getExchangeRate(from: CurrencyCode, to: CurrencyCode): Promise<ExchangeRate> {
    const cacheKey = `${from}-${to}`;
    const cachedRate = exchangeRateCache.get(cacheKey);

    // Return cached rate if still valid
    if (cachedRate && Date.now() - cachedRate.timestamp < CACHE_DURATION) {
      return cachedRate;
    }

    try {
      // Fetch from API
      const rate = await this.fetchExchangeRate(from, to);
      
      // Cache the rate
      exchangeRateCache.set(cacheKey, rate);
      
      return rate;
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
      
      // Return cached rate even if expired, or fallback rate
      if (cachedRate) {
        return cachedRate;
      }
      
      // Fallback to USD rates or 1:1
      return this.getFallbackRate(from, to);
    }
  }

  // Fetch exchange rate from API
  private async fetchExchangeRate(from: CurrencyCode, to: CurrencyCode): Promise<ExchangeRate> {
    // Try different API sources
    const sources = [
      () => this.fetchFromExchangeRateAPI(from, to),
      () => this.fetchFromFixer(from, to),
      () => this.fetchFromCurrencyAPI(from, to)
    ];

    for (const source of sources) {
      try {
        return await source();
      } catch (error) {
        console.warn('Exchange rate source failed:', error);
        continue;
      }
    }

    throw new Error('All exchange rate sources failed');
  }

  // ExchangeRate-API source
  private async fetchFromExchangeRateAPI(from: CurrencyCode, to: CurrencyCode): Promise<ExchangeRate> {
    const url = `${this.baseUrl}/${from}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.rates || !data.rates[to]) {
      throw new Error(`Exchange rate not found for ${from} to ${to}`);
    }

    return {
      from,
      to,
      rate: data.rates[to],
      timestamp: Date.now(),
      source: 'exchangerate-api'
    };
  }

  // Fixer.io source (backup)
  private async fetchFromFixer(from: CurrencyCode, to: CurrencyCode): Promise<ExchangeRate> {
    if (!this.apiKey) {
      throw new Error('API key required for Fixer');
    }

    const url = `https://api.fixer.io/latest?access_key=${this.apiKey}&base=${from}&symbols=${to}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Fixer API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.rates || !data.rates[to]) {
      throw new Error(`Fixer rate not found for ${from} to ${to}`);
    }

    return {
      from,
      to,
      rate: data.rates[to],
      timestamp: Date.now(),
      source: 'fixer'
    };
  }

  // CurrencyAPI source (backup)
  private async fetchFromCurrencyAPI(from: CurrencyCode, to: CurrencyCode): Promise<ExchangeRate> {
    const url = `https://api.currencyapi.com/v3/latest?apikey=${this.apiKey}&base_currency=${from}&currencies=${to}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`CurrencyAPI error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data || !data.data[to]) {
      throw new Error(`CurrencyAPI rate not found for ${from} to ${to}`);
    }

    return {
      from,
      to,
      rate: data.data[to].value,
      timestamp: Date.now(),
      source: 'currencyapi'
    };
  }

  // Fallback rates (static approximations)
  private getFallbackRate(from: CurrencyCode, to: CurrencyCode): ExchangeRate {
    // Simple fallback rates (these should be updated periodically)
    const fallbackRates: Record<string, number> = {
      'USD-EUR': 0.85,
      'EUR-USD': 1.18,
      'USD-GBP': 0.73,
      'GBP-USD': 1.37,
      'USD-JPY': 110,
      'JPY-USD': 0.009,
      'USD-INR': 75,
      'INR-USD': 0.013,
      'EUR-GBP': 0.86,
      'GBP-EUR': 1.16
    };

    const key = `${from}-${to}`;
    const reverseKey = `${to}-${from}`;
    
    if (fallbackRates[key]) {
      return {
        from,
        to,
        rate: fallbackRates[key],
        timestamp: Date.now(),
        source: 'fallback'
      };
    } else if (fallbackRates[reverseKey]) {
      return {
        from,
        to,
        rate: 1 / fallbackRates[reverseKey],
        timestamp: Date.now(),
        source: 'fallback-reverse'
      };
    }

    // Last resort: 1:1 rate
    return {
      from,
      to,
      rate: 1,
      timestamp: Date.now(),
      source: 'fallback-1to1'
    };
  }

  // Get multiple exchange rates
  async getMultipleRates(
    baseCurrency: CurrencyCode,
    targetCurrencies: CurrencyCode[]
  ): Promise<Record<CurrencyCode, ExchangeRate>> {
    const rates = {} as Record<CurrencyCode, ExchangeRate>;
    
    const promises = targetCurrencies.map(async (currency) => {
      try {
        const rate = await this.getExchangeRate(baseCurrency, currency);
        rates[currency] = rate;
      } catch (error) {
        console.error(`Failed to get rate for ${baseCurrency} to ${currency}:`, error);
      }
    });

    await Promise.all(promises);
    return rates;
  }

  // Clear cache
  clearCache(): void {
    exchangeRateCache.clear();
  }

  // Get cached rates
  getCachedRates(): ExchangeRate[] {
    return Array.from(exchangeRateCache.values());
  }
}

// Utility functions
export function formatCurrency(
  amount: number,
  currency: CurrencyCode,
  locale?: string
): string {
  const currencyInfo = currencies[currency];
  
  if (!currencyInfo) {
    return amount.toString();
  }

  const formatter = new Intl.NumberFormat(locale || currencyInfo.locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currencyInfo.decimals,
    maximumFractionDigits: currencyInfo.decimals
  });

  return formatter.format(amount);
}

export function getCurrencyInfo(currency: CurrencyCode): CurrencyInfo | undefined {
  return currencies[currency];
}

export function getActiveCurrencies(): CurrencyInfo[] {
  return Object.values(currencies).filter(c => c.active);
}

export function getCurrenciesByCountry(countryCode: string): CurrencyInfo[] {
  return Object.values(currencies).filter(c => 
    c.countries.includes(countryCode.toUpperCase())
  );
}

export function getCurrencyForLocale(locale: Locale): CurrencyCode {
  const localeMap: Record<Locale, CurrencyCode> = {
    'en': 'USD',
    'es': 'EUR',
    'fr': 'EUR',
    'de': 'EUR',
    'it': 'EUR',
    'pt': 'BRL',
    'ja': 'JPY',
    'ko': 'KRW',
    'zh': 'CNY',
    'ar': 'SAR',
    'hi': 'INR',
    'ru': 'RUB'
  };

  return localeMap[locale] || 'USD';
}

// Create default converter instance
export const currencyConverter = new CurrencyConverter();