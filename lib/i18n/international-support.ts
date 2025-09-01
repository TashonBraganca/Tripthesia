/**
 * Comprehensive International Support System
 * Multi-language, currency, and regional features
 */

export interface LocaleConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
  rtl: boolean;
  region: string;
}

export interface TranslationSet {
  [key: string]: string | TranslationSet;
}

export interface CurrencyRate {
  from: string;
  to: string;
  rate: number;
  timestamp: string;
}

export interface RegionalSettings {
  locale: string;
  currency: string;
  dateFormat: string;
  numberFormat: string;
  paymentMethods: string[];
  supportedLanguages: string[];
  legalRequirements: string[];
  taxRates: Record<string, number>;
}

class InternationalizationManager {
  private locales: Map<string, LocaleConfig> = new Map();
  private translations: Map<string, TranslationSet> = new Map();
  private currencyRates: Map<string, CurrencyRate> = new Map();
  private currentLocale: string = 'en-US';
  private fallbackLocale: string = 'en-US';

  constructor() {
    this.initializeLocales();
    this.initializeTranslations();
  }

  private initializeLocales(): void {
    const supportedLocales: LocaleConfig[] = [
      // English variants
      {
        code: 'en-US',
        name: 'English (US)',
        nativeName: 'English (US)',
        flag: '🇺🇸',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12',
        rtl: false,
        region: 'North America',
      },
      {
        code: 'en-GB',
        name: 'English (UK)',
        nativeName: 'English (UK)',
        flag: '🇬🇧',
        currency: 'GBP',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24',
        rtl: false,
        region: 'Europe',
      },
      {
        code: 'en-IN',
        name: 'English (India)',
        nativeName: 'English (India)',
        flag: '🇮🇳',
        currency: 'INR',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '12',
        rtl: false,
        region: 'South Asia',
      },
      // Major international languages
      {
        code: 'es-ES',
        name: 'Spanish (Spain)',
        nativeName: 'Español (España)',
        flag: '🇪🇸',
        currency: 'EUR',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24',
        rtl: false,
        region: 'Europe',
      },
      {
        code: 'fr-FR',
        name: 'French (France)',
        nativeName: 'Français (France)',
        flag: '🇫🇷',
        currency: 'EUR',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24',
        rtl: false,
        region: 'Europe',
      },
      {
        code: 'de-DE',
        name: 'German (Germany)',
        nativeName: 'Deutsch (Deutschland)',
        flag: '🇩🇪',
        currency: 'EUR',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: '24',
        rtl: false,
        region: 'Europe',
      },
      {
        code: 'hi-IN',
        name: 'Hindi (India)',
        nativeName: 'हिन्दी (भारत)',
        flag: '🇮🇳',
        currency: 'INR',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '12',
        rtl: false,
        region: 'South Asia',
      },
      {
        code: 'ja-JP',
        name: 'Japanese (Japan)',
        nativeName: '日本語 (日本)',
        flag: '🇯🇵',
        currency: 'JPY',
        dateFormat: 'YYYY/MM/DD',
        timeFormat: '24',
        rtl: false,
        region: 'East Asia',
      },
      {
        code: 'ko-KR',
        name: 'Korean (South Korea)',
        nativeName: '한국어 (대한민국)',
        flag: '🇰🇷',
        currency: 'KRW',
        dateFormat: 'YYYY.MM.DD',
        timeFormat: '12',
        rtl: false,
        region: 'East Asia',
      },
      {
        code: 'zh-CN',
        name: 'Chinese Simplified (China)',
        nativeName: '中文 (简体，中国)',
        flag: '🇨🇳',
        currency: 'CNY',
        dateFormat: 'YYYY/MM/DD',
        timeFormat: '24',
        rtl: false,
        region: 'East Asia',
      },
      {
        code: 'ar-SA',
        name: 'Arabic (Saudi Arabia)',
        nativeName: 'العربية (المملكة العربية السعودية)',
        flag: '🇸🇦',
        currency: 'SAR',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '12',
        rtl: true,
        region: 'Middle East',
      },
      {
        code: 'pt-BR',
        name: 'Portuguese (Brazil)',
        nativeName: 'Português (Brasil)',
        flag: '🇧🇷',
        currency: 'BRL',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24',
        rtl: false,
        region: 'South America',
      },
      {
        code: 'ru-RU',
        name: 'Russian (Russia)',
        nativeName: 'Русский (Россия)',
        flag: '🇷🇺',
        currency: 'RUB',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: '24',
        rtl: false,
        region: 'Europe/Asia',
      },
    ];

    supportedLocales.forEach(locale => {
      this.locales.set(locale.code, locale);
    });
  }

  private initializeTranslations(): void {
    // English (base language)
    this.translations.set('en-US', {
      common: {
        welcome: 'Welcome',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        create: 'Create',
        search: 'Search',
        filter: 'Filter',
        sort: 'Sort',
        next: 'Next',
        previous: 'Previous',
        continue: 'Continue',
        back: 'Back',
        home: 'Home',
        about: 'About',
        contact: 'Contact',
        help: 'Help',
        settings: 'Settings',
        profile: 'Profile',
        logout: 'Logout',
        login: 'Login',
        signup: 'Sign Up',
      },
      navigation: {
        trips: 'Trips',
        pricing: 'Pricing',
        dashboard: 'Dashboard',
        newTrip: 'New Trip',
        explore: 'Explore',
        community: 'Community',
      },
      trip: {
        title: 'Trip Planning',
        destination: 'Destination',
        startDate: 'Start Date',
        endDate: 'End Date',
        travelers: 'Travelers',
        budget: 'Budget',
        tripType: 'Trip Type',
        accommodation: 'Accommodation',
        transport: 'Transport',
        activities: 'Activities',
        duration: 'Duration',
        itinerary: 'Itinerary',
        bookNow: 'Book Now',
        saveTrip: 'Save Trip',
        shareTrip: 'Share Trip',
      },
      messages: {
        tripCreated: 'Trip created successfully!',
        tripSaved: 'Trip saved successfully!',
        tripDeleted: 'Trip deleted successfully!',
        errorCreatingTrip: 'Error creating trip. Please try again.',
        invalidDestination: 'Please select a valid destination.',
        invalidDates: 'Please select valid dates.',
        budgetTooLow: 'Budget seems too low for this destination.',
      },
    });

    // Hindi translations
    this.translations.set('hi-IN', {
      common: {
        welcome: 'स्वागत',
        loading: 'लोड हो रहा है...',
        error: 'त्रुटि',
        success: 'सफलता',
        cancel: 'रद्द करें',
        save: 'सेव करें',
        delete: 'डिलीट',
        edit: 'संपादित करें',
        create: 'बनाएं',
        search: 'खोजें',
        filter: 'फ़िल्टर',
        sort: 'सॉर्ट',
        next: 'अगला',
        previous: 'पिछला',
        continue: 'जारी रखें',
        back: 'वापस',
        home: 'होम',
        about: 'के बारे में',
        contact: 'संपर्क',
        help: 'सहायता',
        settings: 'सेटिंग्स',
        profile: 'प्रोफ़ाइल',
        logout: 'लॉगआउट',
        login: 'लॉगिन',
        signup: 'साइन अप',
      },
      navigation: {
        trips: 'यात्राएं',
        pricing: 'मूल्य निर्धारण',
        dashboard: 'डैशबोर्ड',
        newTrip: 'नई यात्रा',
        explore: 'खोजें',
        community: 'समुदाय',
      },
      trip: {
        title: 'यात्रा योजना',
        destination: 'गंतव्य',
        startDate: 'प्रारंभ तिथि',
        endDate: 'समाप्ति तिथि',
        travelers: 'यात्री',
        budget: 'बजट',
        tripType: 'यात्रा प्रकार',
        accommodation: 'आवास',
        transport: 'परिवहन',
        activities: 'गतिविधियां',
        duration: 'अवधि',
        itinerary: 'यात्रा कार्यक्रम',
        bookNow: 'अभी बुक करें',
        saveTrip: 'यात्रा सेव करें',
        shareTrip: 'यात्रा साझा करें',
      },
      messages: {
        tripCreated: 'यात्रा सफलतापूर्वक बनाई गई!',
        tripSaved: 'यात्रा सफलतापूर्वक सेव की गई!',
        tripDeleted: 'यात्रा सफलतापूर्वक डिलीट की गई!',
        errorCreatingTrip: 'यात्रा बनाने में त्रुटि। कृपया पुनः प्रयास करें।',
        invalidDestination: 'कृपया एक वैध गंतव्य चुनें।',
        invalidDates: 'कृपया वैध तिथियां चुनें।',
        budgetTooLow: 'इस गंतव्य के लिए बजट बहुत कम लगता है।',
      },
    });

    // Spanish translations
    this.translations.set('es-ES', {
      common: {
        welcome: 'Bienvenido',
        loading: 'Cargando...',
        error: 'Error',
        success: 'Éxito',
        cancel: 'Cancelar',
        save: 'Guardar',
        delete: 'Eliminar',
        edit: 'Editar',
        create: 'Crear',
        search: 'Buscar',
        filter: 'Filtrar',
        sort: 'Ordenar',
        next: 'Siguiente',
        previous: 'Anterior',
        continue: 'Continuar',
        back: 'Atrás',
        home: 'Inicio',
        about: 'Acerca de',
        contact: 'Contacto',
        help: 'Ayuda',
        settings: 'Configuración',
        profile: 'Perfil',
        logout: 'Cerrar sesión',
        login: 'Iniciar sesión',
        signup: 'Registrarse',
      },
      navigation: {
        trips: 'Viajes',
        pricing: 'Precios',
        dashboard: 'Panel',
        newTrip: 'Nuevo Viaje',
        explore: 'Explorar',
        community: 'Comunidad',
      },
      trip: {
        title: 'Planificación de Viajes',
        destination: 'Destino',
        startDate: 'Fecha de Inicio',
        endDate: 'Fecha de Fin',
        travelers: 'Viajeros',
        budget: 'Presupuesto',
        tripType: 'Tipo de Viaje',
        accommodation: 'Alojamiento',
        transport: 'Transporte',
        activities: 'Actividades',
        duration: 'Duración',
        itinerary: 'Itinerario',
        bookNow: 'Reservar Ahora',
        saveTrip: 'Guardar Viaje',
        shareTrip: 'Compartir Viaje',
      },
      messages: {
        tripCreated: '¡Viaje creado exitosamente!',
        tripSaved: '¡Viaje guardado exitosamente!',
        tripDeleted: '¡Viaje eliminado exitosamente!',
        errorCreatingTrip: 'Error al crear el viaje. Por favor, inténtalo de nuevo.',
        invalidDestination: 'Por favor, selecciona un destino válido.',
        invalidDates: 'Por favor, selecciona fechas válidas.',
        budgetTooLow: 'El presupuesto parece demasiado bajo para este destino.',
      },
    });

    // Add more languages as needed...
  }

  // Locale management
  setLocale(localeCode: string): boolean {
    if (this.locales.has(localeCode)) {
      this.currentLocale = localeCode;
      if (typeof window !== 'undefined') {
        localStorage.setItem('tripthesia-locale', localeCode);
      }
      return true;
    }
    return false;
  }

  getCurrentLocale(): LocaleConfig {
    return this.locales.get(this.currentLocale) || this.locales.get(this.fallbackLocale)!;
  }

  getSupportedLocales(): LocaleConfig[] {
    return Array.from(this.locales.values());
  }

  detectBrowserLocale(): string {
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('tripthesia-locale');
      if (savedLocale && this.locales.has(savedLocale)) {
        return savedLocale;
      }

      const browserLanguage = navigator.language;
      if (this.locales.has(browserLanguage)) {
        return browserLanguage;
      }

      // Try base language
      const baseLanguage = browserLanguage.split('-')[0];
      const matchingLocale = Array.from(this.locales.keys())
        .find(locale => locale.startsWith(baseLanguage));
      
      if (matchingLocale) {
        return matchingLocale;
      }
    }

    return this.fallbackLocale;
  }

  // Translation functions
  translate(key: string, values?: Record<string, string>): string {
    let translation = this.getTranslation(this.currentLocale, key);
    
    if (!translation && this.currentLocale !== this.fallbackLocale) {
      translation = this.getTranslation(this.fallbackLocale, key);
    }

    if (!translation) {
      return key; // Return key if no translation found
    }

    // Replace placeholders
    if (values) {
      Object.entries(values).forEach(([placeholder, value]) => {
        translation = translation.replace(`{${placeholder}}`, value);
      });
    }

    return translation;
  }

  private getTranslation(locale: string, key: string): string {
    const translations = this.translations.get(locale);
    if (!translations) return '';

    const keys = key.split('.');
    let current: any = translations;

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return '';
      }
    }

    return typeof current === 'string' ? current : '';
  }

  // Currency management
  async updateCurrencyRates(): Promise<void> {
    try {
      // Using a free exchange rate API (example)
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      
      Object.entries(data.rates).forEach(([currency, rate]) => {
        this.currencyRates.set(`USD:${currency}`, {
          from: 'USD',
          to: currency as string,
          rate: rate as number,
          timestamp: new Date().toISOString(),
        });
      });

      // Store rates for offline use
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('tripthesia-currency-rates', JSON.stringify({
          rates: Object.fromEntries(this.currencyRates),
          timestamp: new Date().toISOString(),
        }));
      }
    } catch (error) {
      console.error('Failed to update currency rates:', error);
      
      // Try to load from localStorage as fallback
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('tripthesia-currency-rates');
        if (stored) {
          try {
            const { rates } = JSON.parse(stored);
            Object.entries(rates).forEach(([key, rate]) => {
              this.currencyRates.set(key, rate as CurrencyRate);
            });
          } catch (parseError) {
            console.error('Failed to parse stored currency rates:', parseError);
          }
        }
      }
    }
  }

  convertCurrency(amount: number, from: string, to: string): number {
    if (from === to) return amount;

    const directRate = this.currencyRates.get(`${from}:${to}`);
    if (directRate) {
      return amount * directRate.rate;
    }

    // Try via USD
    const fromUsdRate = this.currencyRates.get(`USD:${from}`);
    const toUsdRate = this.currencyRates.get(`USD:${to}`);
    
    if (fromUsdRate && toUsdRate) {
      const usdAmount = amount / fromUsdRate.rate;
      return usdAmount * toUsdRate.rate;
    }

    // Fallback: return original amount
    console.warn(`Currency conversion not available: ${from} to ${to}`);
    return amount;
  }

  formatCurrency(amount: number, currency: string, locale?: string): string {
    const currentLocale = locale || this.currentLocale;
    
    try {
      return new Intl.NumberFormat(currentLocale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      // Fallback formatting
      return `${currency} ${amount.toFixed(2)}`;
    }
  }

  formatDate(date: Date, format?: string): string {
    const locale = this.getCurrentLocale();
    const dateFormat = format || locale.dateFormat;
    
    try {
      return new Intl.DateTimeFormat(locale.code, {
        year: 'numeric',
        month: dateFormat.includes('MM') ? '2-digit' : 'short',
        day: '2-digit',
      }).format(date);
    } catch (error) {
      return date.toLocaleDateString();
    }
  }

  formatTime(date: Date): string {
    const locale = this.getCurrentLocale();
    
    try {
      return new Intl.DateTimeFormat(locale.code, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: locale.timeFormat === '12',
      }).format(date);
    } catch (error) {
      return date.toLocaleTimeString();
    }
  }

  formatNumber(number: number): string {
    try {
      return new Intl.NumberFormat(this.currentLocale).format(number);
    } catch (error) {
      return number.toString();
    }
  }

  // Regional settings
  getRegionalSettings(localeCode: string): RegionalSettings {
    const locale = this.locales.get(localeCode);
    if (!locale) {
      throw new Error(`Locale ${localeCode} not supported`);
    }

    // Regional configurations
    const regionalConfigs: Record<string, Partial<RegionalSettings>> = {
      'en-US': {
        paymentMethods: ['credit_card', 'debit_card', 'paypal', 'apple_pay', 'google_pay'],
        legalRequirements: ['terms_of_service', 'privacy_policy', 'cookie_policy'],
        taxRates: { sales_tax: 0.0875, service_tax: 0.05 },
      },
      'en-IN': {
        paymentMethods: ['credit_card', 'debit_card', 'upi', 'paytm', 'razorpay', 'net_banking'],
        legalRequirements: ['terms_of_service', 'privacy_policy', 'gdpr_compliance', 'gst_compliance'],
        taxRates: { gst: 0.18, service_charge: 0.05 },
      },
      'hi-IN': {
        paymentMethods: ['credit_card', 'debit_card', 'upi', 'paytm', 'razorpay', 'net_banking'],
        legalRequirements: ['terms_of_service', 'privacy_policy', 'gdpr_compliance', 'gst_compliance'],
        taxRates: { gst: 0.18, service_charge: 0.05 },
      },
      'es-ES': {
        paymentMethods: ['credit_card', 'debit_card', 'paypal', 'sepa', 'bizum'],
        legalRequirements: ['terms_of_service', 'privacy_policy', 'gdpr_compliance', 'cookie_policy'],
        taxRates: { iva: 0.21, service_tax: 0.04 },
      },
      'de-DE': {
        paymentMethods: ['credit_card', 'debit_card', 'paypal', 'sepa', 'sofort', 'giropay'],
        legalRequirements: ['terms_of_service', 'privacy_policy', 'gdpr_compliance', 'cookie_policy', 'imprint'],
        taxRates: { mwst: 0.19, service_tax: 0.0 },
      },
    };

    const config = regionalConfigs[localeCode] || {};

    return {
      locale: localeCode,
      currency: locale.currency,
      dateFormat: locale.dateFormat,
      numberFormat: this.currentLocale,
      paymentMethods: config.paymentMethods || ['credit_card', 'debit_card', 'paypal'],
      supportedLanguages: [localeCode],
      legalRequirements: config.legalRequirements || ['terms_of_service', 'privacy_policy'],
      taxRates: config.taxRates || {},
    };
  }
}

// Singleton instance
export const i18nManager = new InternationalizationManager();

// React hook for translations
export function useTranslation() {
  return {
    t: (key: string, values?: Record<string, string>) => i18nManager.translate(key, values),
    locale: i18nManager.getCurrentLocale(),
    setLocale: (locale: string) => i18nManager.setLocale(locale),
    supportedLocales: i18nManager.getSupportedLocales(),
    formatCurrency: (amount: number, currency?: string) => 
      i18nManager.formatCurrency(amount, currency || i18nManager.getCurrentLocale().currency),
    formatDate: (date: Date, format?: string) => i18nManager.formatDate(date, format),
    formatTime: (date: Date) => i18nManager.formatTime(date),
    formatNumber: (number: number) => i18nManager.formatNumber(number),
  };
}

// Initialize locale on load
if (typeof window !== 'undefined') {
  const detectedLocale = i18nManager.detectBrowserLocale();
  i18nManager.setLocale(detectedLocale);
  
  // Update currency rates periodically
  i18nManager.updateCurrencyRates();
  setInterval(() => {
    i18nManager.updateCurrencyRates();
  }, 3600000); // Update every hour
}