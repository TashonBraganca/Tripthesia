/**
 * Translation System for Tripthesia
 * Type-safe translations with nested key support
 */

import { Locale } from './config';

export type TranslationKey = 
  // Navigation & Layout
  | 'nav.home'
  | 'nav.trips' 
  | 'nav.pricing'
  | 'nav.signIn'
  | 'nav.signUp'
  | 'nav.startPlanning'
  | 'nav.profile'
  | 'nav.settings'
  | 'nav.signOut'

  // Hero Section
  | 'hero.title'
  | 'hero.subtitle'
  | 'hero.startPlanning'
  | 'hero.viewExamples'
  | 'hero.stats.countries'
  | 'hero.stats.travelers'
  | 'hero.stats.successRate'

  // Features
  | 'features.title'
  | 'features.subtitle'
  | 'features.smartPlanning.title'
  | 'features.smartPlanning.description'
  | 'features.realTimePricing.title'
  | 'features.realTimePricing.description'
  | 'features.globalCoverage.title'
  | 'features.globalCoverage.description'
  | 'features.interactiveMaps.title'
  | 'features.interactiveMaps.description'
  | 'features.lightningFast.title'
  | 'features.lightningFast.description'
  | 'features.collaboration.title'
  | 'features.collaboration.description'
  | 'features.exportShare.title'
  | 'features.exportShare.description'
  | 'features.enterpriseSecurity.title'
  | 'features.enterpriseSecurity.description'

  // Trip Planning
  | 'planning.destination'
  | 'planning.dates'
  | 'planning.travelers'
  | 'planning.budget'
  | 'planning.tripType'
  | 'planning.preferences'
  | 'planning.generate'
  | 'planning.generating'
  | 'planning.generated'

  // Trip Types
  | 'tripTypes.adventure'
  | 'tripTypes.business'
  | 'tripTypes.culture'
  | 'tripTypes.beach'
  | 'tripTypes.family'
  | 'tripTypes.food'
  | 'tripTypes.mixed'

  // Common Actions
  | 'common.save'
  | 'common.cancel'
  | 'common.edit'
  | 'common.delete'
  | 'common.share'
  | 'common.export'
  | 'common.loading'
  | 'common.error'
  | 'common.success'
  | 'common.retry'
  | 'common.back'
  | 'common.next'
  | 'common.finish'
  | 'common.search'
  | 'common.clear'
  | 'common.select'
  | 'common.optional'
  | 'common.required'

  // Time & Dates
  | 'time.days'
  | 'time.weeks'
  | 'time.months'
  | 'time.today'
  | 'time.tomorrow'
  | 'time.thisWeek'
  | 'time.nextWeek'
  | 'time.thisMonth'
  | 'time.nextMonth'

  // Currency & Pricing
  | 'pricing.free'
  | 'pricing.from'
  | 'pricing.perPerson'
  | 'pricing.total'
  | 'pricing.estimated'
  | 'pricing.including'
  | 'pricing.excluding'

  // Errors & Messages
  | 'errors.generic'
  | 'errors.network'
  | 'errors.validation'
  | 'errors.notFound'
  | 'errors.unauthorized'
  | 'errors.serverError'
  | 'messages.welcome'
  | 'messages.tripCreated'
  | 'messages.tripSaved'
  | 'messages.tripDeleted';

export type TranslationValues = Record<string, string | number>;

export type Translations = Record<TranslationKey, string>;

// Base translations in English
const baseTranslations: Translations = {
  // Navigation & Layout
  'nav.home': 'Home',
  'nav.trips': 'Trips',
  'nav.pricing': 'Pricing',
  'nav.signIn': 'Sign In',
  'nav.signUp': 'Sign Up',
  'nav.startPlanning': 'Start Planning',
  'nav.profile': 'Profile',
  'nav.settings': 'Settings',
  'nav.signOut': 'Sign Out',

  // Hero Section
  'hero.title': 'Plan Your Perfect Journey',
  'hero.subtitle': 'Create personalized travel itineraries in seconds with real prices and instant booking',
  'hero.startPlanning': 'Start Planning',
  'hero.viewExamples': 'View Examples',
  'hero.stats.countries': '190+ Countries',
  'hero.stats.travelers': '50K+ Happy Travelers',
  'hero.stats.successRate': '98% Trip Success Rate',

  // Features
  'features.title': 'Everything you need to plan the perfect trip',
  'features.subtitle': 'From intelligent planning to real-time pricing, every feature is designed to make travel planning effortless and enjoyable.',
  'features.smartPlanning.title': 'Smart Planning',
  'features.smartPlanning.description': 'Advanced algorithms create personalized itineraries that understand your unique preferences, budget, and travel style.',
  'features.realTimePricing.title': 'Real-Time Pricing',
  'features.realTimePricing.description': 'Live prices from trusted partners including flights, hotels, and activities with instant booking links.',
  'features.globalCoverage.title': 'Global Coverage',
  'features.globalCoverage.description': '200+ countries and territories with local insights, cultural recommendations, and regional expertise.',
  'features.interactiveMaps.title': 'Interactive Maps',
  'features.interactiveMaps.description': 'Beautiful Mapbox-powered maps with drag-and-drop planning, route visualization, and location previews.',
  'features.lightningFast.title': 'Lightning Fast',
  'features.lightningFast.description': 'Complete itineraries generated in under 10 seconds. No more hours of research and planning.',
  'features.collaboration.title': 'Team Collaboration',
  'features.collaboration.description': 'Share and collaborate on trips with friends, family, or colleagues with real-time sync.',
  'features.exportShare.title': 'Export & Share',
  'features.exportShare.description': 'Download beautiful PDFs or sync with your calendar. Share public links for easy access.',
  'features.enterpriseSecurity.title': 'Enterprise Security',
  'features.enterpriseSecurity.description': 'Bank-grade encryption, GDPR compliance, and privacy-first architecture protect your data.',

  // Trip Planning
  'planning.destination': 'Where are you going?',
  'planning.dates': 'When are you traveling?',
  'planning.travelers': 'How many travelers?',
  'planning.budget': 'What\'s your budget?',
  'planning.tripType': 'What type of trip?',
  'planning.preferences': 'Any preferences?',
  'planning.generate': 'Generate Itinerary',
  'planning.generating': 'Creating your perfect trip...',
  'planning.generated': 'Your itinerary is ready!',

  // Trip Types
  'tripTypes.adventure': 'Adventure & Trekking',
  'tripTypes.business': 'Business',
  'tripTypes.culture': 'Culture & History',
  'tripTypes.beach': 'Beach & Relaxation',
  'tripTypes.family': 'Family',
  'tripTypes.food': 'Food & Wine',
  'tripTypes.mixed': 'Mixed',

  // Common Actions
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.edit': 'Edit',
  'common.delete': 'Delete',
  'common.share': 'Share',
  'common.export': 'Export',
  'common.loading': 'Loading...',
  'common.error': 'Error',
  'common.success': 'Success',
  'common.retry': 'Retry',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.finish': 'Finish',
  'common.search': 'Search',
  'common.clear': 'Clear',
  'common.select': 'Select',
  'common.optional': 'Optional',
  'common.required': 'Required',

  // Time & Dates
  'time.days': 'days',
  'time.weeks': 'weeks',
  'time.months': 'months',
  'time.today': 'Today',
  'time.tomorrow': 'Tomorrow',
  'time.thisWeek': 'This Week',
  'time.nextWeek': 'Next Week',
  'time.thisMonth': 'This Month',
  'time.nextMonth': 'Next Month',

  // Currency & Pricing
  'pricing.free': 'Free',
  'pricing.from': 'From',
  'pricing.perPerson': 'per person',
  'pricing.total': 'Total',
  'pricing.estimated': 'Estimated',
  'pricing.including': 'Including',
  'pricing.excluding': 'Excluding',

  // Errors & Messages
  'errors.generic': 'Something went wrong. Please try again.',
  'errors.network': 'Network error. Please check your connection.',
  'errors.validation': 'Please check your input and try again.',
  'errors.notFound': 'The requested resource was not found.',
  'errors.unauthorized': 'You are not authorized to access this resource.',
  'errors.serverError': 'Server error. Please try again later.',
  'messages.welcome': 'Welcome to Tripthesia!',
  'messages.tripCreated': 'Trip created successfully!',
  'messages.tripSaved': 'Trip saved successfully!',
  'messages.tripDeleted': 'Trip deleted successfully!'
};

// Translation storage
const translationCache = new Map<string, Translations>();

// Load translation for a specific locale
export async function loadTranslations(locale: Locale): Promise<Translations> {
  const cacheKey = locale;
  
  // Return cached translations if available
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  // For now, return base translations (English) for all locales
  // In production, you would load actual translation files
  let translations: Translations = { ...baseTranslations };

  // Load locale-specific translations
  try {
    if (locale !== 'en') {
      // Dynamic import of translation files
      const localeTranslations = await import(`./locales/${locale}.json`).catch(() => null);
      
      if (localeTranslations?.default) {
        translations = { ...baseTranslations, ...localeTranslations.default };
      }
    }
  } catch (error) {
    console.warn(`Failed to load translations for locale: ${locale}`, error);
    // Fallback to base translations
  }

  // Cache the translations
  translationCache.set(cacheKey, translations);
  
  return translations;
}

// Get translation with interpolation support
export function getTranslation(
  translations: Translations,
  key: TranslationKey,
  values?: TranslationValues
): string {
  let translation = translations[key] || key;

  // Simple interpolation: replace {{key}} with values
  if (values) {
    for (const [valueKey, valueValue] of Object.entries(values)) {
      const placeholder = `{{${valueKey}}}`;
      translation = translation.replace(new RegExp(placeholder, 'g'), String(valueValue));
    }
  }

  return translation;
}

// Pluralization with translation support
export function getPluralization(
  translations: Translations,
  key: TranslationKey,
  count: number,
  values?: TranslationValues
): string {
  const translation = getTranslation(translations, key, { ...values, count });
  
  // Simple English pluralization rules
  // In production, use proper pluralization library for each locale
  if (count === 1) {
    return translation;
  } else {
    // Look for plural form or add 's'
    const pluralKey = `${key}.plural` as TranslationKey;
    const pluralTranslation = translations[pluralKey];
    
    if (pluralTranslation) {
      return getTranslation(translations, pluralKey, { ...values, count });
    } else {
      // Simple pluralization fallback
      return translation.replace(/\b(\w+)\b/g, (word) => {
        if (word.endsWith('y')) {
          return word.slice(0, -1) + 'ies';
        } else if (word.endsWith('s') || word.endsWith('sh') || word.endsWith('ch')) {
          return word + 'es';
        } else {
          return word + 's';
        }
      });
    }
  }
}

// Create sample translation files for different locales
export const sampleTranslations = {
  es: {
    'nav.home': 'Inicio',
    'nav.trips': 'Viajes',
    'nav.pricing': 'Precios',
    'nav.signIn': 'Iniciar Sesión',
    'nav.signUp': 'Registrarse',
    'hero.title': 'Planifica Tu Viaje Perfecto',
    'hero.subtitle': 'Crea itinerarios de viaje personalizados en segundos con precios reales y reservas instantáneas',
    'features.title': 'Todo lo que necesitas para planificar el viaje perfecto',
    'planning.destination': '¿A dónde vas?',
    'planning.dates': '¿Cuándo viajas?',
    'planning.generate': 'Generar Itinerario',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar'
  },
  fr: {
    'nav.home': 'Accueil',
    'nav.trips': 'Voyages',
    'nav.pricing': 'Tarifs',
    'nav.signIn': 'Se connecter',
    'nav.signUp': 'S\'inscrire',
    'hero.title': 'Planifiez Votre Voyage Parfait',
    'hero.subtitle': 'Créez des itinéraires de voyage personnalisés en quelques secondes avec des prix réels et une réservation instantanée',
    'features.title': 'Tout ce dont vous avez besoin pour planifier le voyage parfait',
    'planning.destination': 'Où allez-vous?',
    'planning.dates': 'Quand voyagez-vous?',
    'planning.generate': 'Générer l\'Itinéraire',
    'common.save': 'Sauvegarder',
    'common.cancel': 'Annuler'
  },
  de: {
    'nav.home': 'Startseite',
    'nav.trips': 'Reisen',
    'nav.pricing': 'Preise',
    'nav.signIn': 'Anmelden',
    'nav.signUp': 'Registrieren',
    'hero.title': 'Planen Sie Ihre Perfekte Reise',
    'hero.subtitle': 'Erstellen Sie personalisierte Reiserouten in Sekunden mit echten Preisen und sofortiger Buchung',
    'features.title': 'Alles was Sie brauchen, um die perfekte Reise zu planen',
    'planning.destination': 'Wohin reisen Sie?',
    'planning.dates': 'Wann reisen Sie?',
    'planning.generate': 'Reiseplan Erstellen',
    'common.save': 'Speichern',
    'common.cancel': 'Abbrechen'
  }
};

// Export translations for easy access
export { baseTranslations as translations };