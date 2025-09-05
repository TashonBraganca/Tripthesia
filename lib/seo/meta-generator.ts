// SEO Meta Generator - Phase 7 Production Excellence
// Generates dynamic meta tags and structured data for optimal SEO

import type { Metadata } from 'next';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  structuredData?: any;
}

// Default SEO configuration
const DEFAULT_SEO: SEOConfig = {
  title: 'Tripthesia - AI-Powered Travel Planning with Real Pricing',
  description: 'Plan perfect trips with AI-powered recommendations, real-time pricing from multiple providers, and comprehensive booking integration. Compare flights, hotels, and activities in one place.',
  keywords: [
    'travel planning', 'trip planner', 'AI travel', 'flight booking', 
    'hotel booking', 'travel comparison', 'vacation planner', 
    'trip organizer', 'travel assistant', 'booking platform'
  ],
  image: '/og-image-default.png',
  type: 'website'
};

// Generate comprehensive metadata for Next.js pages
export function generateMetadata(config: Partial<SEOConfig> = {}): Metadata {
  const seo: SEOConfig = { ...DEFAULT_SEO, ...config };
  
  const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://tripthesia.vercel.app'),
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords?.join(', '),
    
    // Open Graph
    openGraph: {
      title: seo.title,
      description: seo.description,
      type: seo.type,
      url: seo.url,
      siteName: 'Tripthesia',
      images: [
        {
          url: seo.image || DEFAULT_SEO.image!,
          width: 1200,
          height: 630,
          alt: seo.title
        }
      ],
      locale: 'en_US',
      publishedTime: seo.publishedTime,
      modifiedTime: seo.modifiedTime,
    },
    
    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      images: [seo.image || DEFAULT_SEO.image!],
      creator: '@tripthesia',
      site: '@tripthesia'
    },
    
    // Additional meta tags
    alternates: {
      canonical: seo.url,
    },
    
    authors: seo.author ? [{ name: seo.author }] : [{ name: 'Tripthesia Team' }],
    
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
      yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
      yahoo: process.env.NEXT_PUBLIC_YAHOO_VERIFICATION,
    },
    
    category: 'travel',
  };
  
  return metadata;
}

// Generate structured data (JSON-LD)
export function generateStructuredData(type: 'organization' | 'website' | 'travel' | 'trip', data: any = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tripthesia.vercel.app';
  
  switch (type) {
    case 'organization':
      return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Tripthesia',
        description: 'AI-powered travel planning platform with real-time pricing and booking integration',
        url: baseUrl,
        logo: `${baseUrl}/logo.png`,
        sameAs: [
          'https://twitter.com/tripthesia',
          'https://linkedin.com/company/tripthesia'
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+1-800-TRIPTHESIA',
          contactType: 'customer service',
          availableLanguage: ['English']
        }
      };
      
    case 'website':
      return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Tripthesia',
        description: 'AI-powered travel planning with real pricing and booking',
        url: baseUrl,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${baseUrl}/search?q={search_term_string}`
          },
          'query-input': 'required name=search_term_string'
        }
      };
      
    case 'travel':
      return {
        '@context': 'https://schema.org',
        '@type': 'TravelAgency',
        name: 'Tripthesia',
        description: 'Comprehensive travel planning with AI recommendations and real-time pricing',
        url: baseUrl,
        serviceType: [
          'Flight booking',
          'Hotel reservations', 
          'Trip planning',
          'Travel recommendations',
          'Price comparison'
        ],
        areaServed: 'Worldwide',
        makesOffer: {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'AI-Powered Travel Planning',
            description: 'Complete travel planning with real-time pricing and booking integration'
          }
        }
      };
      
    case 'trip':
      return {
        '@context': 'https://schema.org',
        '@type': 'TripPlan',
        name: data.title || 'Travel Plan',
        description: data.description || 'Custom travel plan created with Tripthesia',
        author: {
          '@type': 'Organization',
          name: 'Tripthesia'
        },
        dateCreated: data.createdAt || new Date().toISOString(),
        itinerary: data.destinations?.map((dest: any) => ({
          '@type': 'Place',
          name: dest.name,
          geo: dest.coordinates ? {
            '@type': 'GeoCoordinates',
            latitude: dest.coordinates[1],
            longitude: dest.coordinates[0]
          } : undefined
        })) || []
      };
      
    default:
      return null;
  }
}

// Page-specific SEO configurations
export const SEO_CONFIGS = {
  home: {
    title: 'Tripthesia - AI-Powered Travel Planning with Real Pricing',
    description: 'Plan perfect trips with AI recommendations, real-time flight and hotel pricing, and comprehensive booking integration. Compare and book everything in one place.',
    keywords: ['travel planning', 'AI travel assistant', 'flight booking', 'hotel booking', 'trip planner'],
    url: '/'
  },
  
  newTrip: {
    title: 'Create New Trip - AI Travel Planning | Tripthesia',
    description: 'Start planning your perfect trip with AI-powered recommendations. Get real-time pricing for flights, hotels, and activities with our smart travel wizard.',
    keywords: ['create trip', 'plan travel', 'AI trip planner', 'flight search', 'hotel search'],
    url: '/new'
  },
  
  transport: {
    title: 'Flight & Transport Search - Compare Prices | Tripthesia', 
    description: 'Find and compare flights, trains, and buses with real-time pricing from multiple providers. Book the best transport options for your trip.',
    keywords: ['flight search', 'transport booking', 'compare flights', 'train booking', 'bus booking'],
    url: '/transport'
  },
  
  trips: {
    title: 'My Trips - Travel Dashboard | Tripthesia',
    description: 'Manage your trips, view itineraries, and access your travel bookings. Your personal travel dashboard with AI-powered recommendations.',
    keywords: ['trip dashboard', 'travel management', 'trip history', 'itinerary'],
    url: '/trips'
  },
  
  roadTrip: {
    title: 'Road Trip Planner - Route Planning with POI | Tripthesia',
    description: 'Plan epic road trips with AI-powered route optimization, points of interest discovery, and comprehensive travel planning tools.',
    keywords: ['road trip planner', 'route planning', 'drive trip', 'POI discovery'],
    url: '/road-trip'
  }
};

// Generate sitemap data
export function generateSitemapData() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tripthesia.vercel.app';
  
  const staticPages = [
    { url: '/', priority: 1.0, changefreq: 'daily' },
    { url: '/new', priority: 0.9, changefreq: 'weekly' },
    { url: '/transport', priority: 0.8, changefreq: 'weekly' },
    { url: '/trips', priority: 0.7, changefreq: 'daily' },
    { url: '/road-trip', priority: 0.8, changefreq: 'weekly' },
    { url: '/pricing', priority: 0.6, changefreq: 'monthly' },
    { url: '/about', priority: 0.5, changefreq: 'monthly' },
  ];
  
  return staticPages.map(page => ({
    url: `${baseUrl}${page.url}`,
    lastModified: new Date().toISOString(),
    priority: page.priority,
    changeFreq: page.changefreq
  }));
}

// Generate robots.txt content
export function generateRobotsTxt() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tripthesia.vercel.app';
  
  return `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /_next/
Disallow: /sign-in
Disallow: /sign-up

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Important pages for crawling
Crawl-delay: 1

# Allow specific API endpoints that are publicly accessible
Allow: /api/health
Allow: /api/currency/rates`;
}

export default generateMetadata;