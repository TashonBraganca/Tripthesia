/**
 * Internationalization Configuration for Tripthesia
 * Multi-language support with dynamic loading and regional preferences
 */

export type Locale = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'ko' | 'zh' | 'ar' | 'hi' | 'ru';

export interface LocaleConfig {
  code: Locale;
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
  dateFormat: string;
  currency: {
    code: string;
    symbol: string;
    position: 'before' | 'after';
  };
  numberFormat: {
    decimal: string;
    thousand: string;
  };
  regions: string[];
}

export const locales: Record<Locale, LocaleConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    rtl: false,
    dateFormat: 'MM/DD/YYYY',
    currency: {
      code: 'USD',
      symbol: '$',
      position: 'before'
    },
    numberFormat: {
      decimal: '.',
      thousand: ','
    },
    regions: ['US', 'GB', 'CA', 'AU', 'NZ']
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    rtl: false,
    dateFormat: 'DD/MM/YYYY',
    currency: {
      code: 'EUR',
      symbol: '€',
      position: 'after'
    },
    numberFormat: {
      decimal: ',',
      thousand: '.'
    },
    regions: ['ES', 'MX', 'AR', 'CO', 'PE', 'VE', 'CL']
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    rtl: false,
    dateFormat: 'DD/MM/YYYY',
    currency: {
      code: 'EUR',
      symbol: '€',
      position: 'after'
    },
    numberFormat: {
      decimal: ',',
      thousand: ' '
    },
    regions: ['FR', 'BE', 'CH', 'CA', 'MA']
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    rtl: false,
    dateFormat: 'DD.MM.YYYY',
    currency: {
      code: 'EUR',
      symbol: '€',
      position: 'after'
    },
    numberFormat: {
      decimal: ',',
      thousand: '.'
    },
    regions: ['DE', 'AT', 'CH']
  },
  it: {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    rtl: false,
    dateFormat: 'DD/MM/YYYY',
    currency: {
      code: 'EUR',
      symbol: '€',
      position: 'after'
    },
    numberFormat: {
      decimal: ',',
      thousand: '.'
    },
    regions: ['IT', 'CH', 'SM']
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇵🇹',
    rtl: false,
    dateFormat: 'DD/MM/YYYY',
    currency: {
      code: 'BRL',
      symbol: 'R$',
      position: 'before'
    },
    numberFormat: {
      decimal: ',',
      thousand: '.'
    },
    regions: ['PT', 'BR', 'AO', 'MZ']
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    rtl: false,
    dateFormat: 'YYYY/MM/DD',
    currency: {
      code: 'JPY',
      symbol: '¥',
      position: 'before'
    },
    numberFormat: {
      decimal: '.',
      thousand: ','
    },
    regions: ['JP']
  },
  ko: {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    rtl: false,
    dateFormat: 'YYYY-MM-DD',
    currency: {
      code: 'KRW',
      symbol: '₩',
      position: 'before'
    },
    numberFormat: {
      decimal: '.',
      thousand: ','
    },
    regions: ['KR']
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    rtl: false,
    dateFormat: 'YYYY-MM-DD',
    currency: {
      code: 'CNY',
      symbol: '¥',
      position: 'before'
    },
    numberFormat: {
      decimal: '.',
      thousand: ','
    },
    regions: ['CN', 'HK', 'TW', 'SG']
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    rtl: true,
    dateFormat: 'DD/MM/YYYY',
    currency: {
      code: 'SAR',
      symbol: 'ر.س',
      position: 'before'
    },
    numberFormat: {
      decimal: '.',
      thousand: ','
    },
    regions: ['SA', 'AE', 'EG', 'MA', 'DZ', 'TN', 'LB', 'JO']
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    rtl: false,
    dateFormat: 'DD/MM/YYYY',
    currency: {
      code: 'INR',
      symbol: '₹',
      position: 'before'
    },
    numberFormat: {
      decimal: '.',
      thousand: ','
    },
    regions: ['IN']
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    rtl: false,
    dateFormat: 'DD.MM.YYYY',
    currency: {
      code: 'RUB',
      symbol: '₽',
      position: 'after'
    },
    numberFormat: {
      decimal: ',',
      thousand: ' '
    },
    regions: ['RU', 'BY', 'KZ', 'KG', 'UZ']
  }
};

export const defaultLocale: Locale = 'en';

export const supportedLocales = Object.keys(locales) as Locale[];

// Regional locale detection based on user's country
export const regionToLocaleMap: Record<string, Locale> = {
  // English regions
  'US': 'en',
  'GB': 'en', 
  'CA': 'en',
  'AU': 'en',
  'NZ': 'en',
  'IE': 'en',
  'ZA': 'en',

  // Spanish regions
  'ES': 'es',
  'MX': 'es',
  'AR': 'es',
  'CO': 'es',
  'PE': 'es',
  'VE': 'es',
  'CL': 'es',
  'EC': 'es',
  'GT': 'es',
  'CU': 'es',
  'BO': 'es',
  'DO': 'es',
  'HN': 'es',
  'PY': 'es',
  'SV': 'es',
  'NI': 'es',
  'CR': 'es',
  'PA': 'es',
  'UY': 'es',

  // French regions
  'FR': 'fr',
  'BE': 'fr',
  'CH': 'fr',
  'MC': 'fr',
  'LU': 'fr',
  'MA': 'fr',
  'SN': 'fr',
  'CI': 'fr',
  'DZ': 'fr',
  'TN': 'fr',

  // German regions
  'DE': 'de',
  'AT': 'de',
  'LI': 'de',

  // Italian regions
  'IT': 'it',
  'SM': 'it',
  'VA': 'it',

  // Portuguese regions
  'PT': 'pt',
  'BR': 'pt',
  'AO': 'pt',
  'MZ': 'pt',
  'CV': 'pt',
  'GW': 'pt',
  'ST': 'pt',
  'TL': 'pt',

  // Asian regions
  'JP': 'ja',
  'KR': 'ko',
  'CN': 'zh',
  'HK': 'zh',
  'TW': 'zh',
  'SG': 'zh',
  'IN': 'hi',

  // Arabic regions
  'SA': 'ar',
  'AE': 'ar',
  'QA': 'ar',
  'KW': 'ar',
  'BH': 'ar',
  'OM': 'ar',
  'JO': 'ar',
  'LB': 'ar',
  'SY': 'ar',
  'IQ': 'ar',
  'EG': 'ar',
  'LY': 'ar',
  'SD': 'ar',
  'YE': 'ar',

  // Russian regions
  'RU': 'ru',
  'BY': 'ru',
  'KZ': 'ru',
  'KG': 'ru',
  'UZ': 'ru',
  'TJ': 'ru',
  'TM': 'ru',
  'AM': 'ru',
  'AZ': 'ru',
  'GE': 'ru',
  'MD': 'ru'
};

// Browser language detection
export function detectBrowserLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;

  const browserLang = navigator.language || navigator.languages?.[0];
  if (!browserLang) return defaultLocale;

  // Extract language code (e.g., 'en-US' -> 'en')
  const langCode = browserLang.split('-')[0] as Locale;
  
  return supportedLocales.includes(langCode) ? langCode : defaultLocale;
}

// Geographic locale detection
export function detectGeographicLocale(countryCode?: string): Locale {
  if (!countryCode) return defaultLocale;
  
  return regionToLocaleMap[countryCode.toUpperCase()] || defaultLocale;
}

// Smart locale detection combining browser and geographic hints
export function detectSmartLocale(options: {
  browserLanguage?: string;
  countryCode?: string;
  userPreference?: string;
} = {}): Locale {
  const { browserLanguage, countryCode, userPreference } = options;

  // 1. User preference takes priority
  if (userPreference && supportedLocales.includes(userPreference as Locale)) {
    return userPreference as Locale;
  }

  // 2. Browser language detection
  if (browserLanguage) {
    const langCode = browserLanguage.split('-')[0] as Locale;
    if (supportedLocales.includes(langCode)) {
      return langCode;
    }
  }

  // 3. Geographic detection
  if (countryCode) {
    const geoLocale = detectGeographicLocale(countryCode);
    if (geoLocale !== defaultLocale) {
      return geoLocale;
    }
  }

  // 4. Browser detection fallback
  const browserLocale = detectBrowserLocale();
  if (browserLocale !== defaultLocale) {
    return browserLocale;
  }

  return defaultLocale;
}

// Get locale configuration
export function getLocaleConfig(locale: Locale): LocaleConfig {
  return locales[locale] || locales[defaultLocale];
}

// Format number according to locale
export function formatNumber(number: number, locale: Locale): string {
  const config = getLocaleConfig(locale);
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(number);
}

// Format currency according to locale
export function formatCurrency(amount: number, locale: Locale, currencyCode?: string): string {
  const config = getLocaleConfig(locale);
  const currency = currencyCode || config.currency.code;
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol'
  }).format(amount);
}

// Format date according to locale
export function formatDate(date: Date, locale: Locale, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };

  return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(date);
}

// Get RTL/LTR direction
export function getTextDirection(locale: Locale): 'ltr' | 'rtl' {
  return getLocaleConfig(locale).rtl ? 'rtl' : 'ltr';
}

// Pluralization rules for different languages
export function pluralize(count: number, locale: Locale, singular: string, plural?: string): string {
  const rules = new Intl.PluralRules(locale);
  const rule = rules.select(count);

  // For now, simple English-style pluralization
  // In a real implementation, you'd have locale-specific plural forms
  if (rule === 'one') {
    return singular;
  } else {
    return plural || `${singular}s`;
  }
}

export { type Locale as LocaleType };