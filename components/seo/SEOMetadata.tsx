'use client';

import Head from 'next/head';
import { usePathname } from 'next/navigation';
import React from 'react';

interface SEOMetadataProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  noIndex?: boolean;
  noFollow?: boolean;
  locale?: string;
  alternateUrls?: { [key: string]: string };
  structuredData?: object;
  tripData?: {
    destination?: string;
    departure?: string;
    dates?: { start: string; end: string };
    budget?: { amount: number; currency: string };
    travelers?: number;
    tripType?: string;
  };
  currency?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

const DEFAULT_SEO = {
  siteName: 'Tripthesia',
  siteDescription: 'AI-powered travel planning platform with smart itinerary generation, budget optimization, and collaborative trip planning.',
  siteUrl: 'https://tripthesia.com',
  defaultImage: '/images/og-default.jpg',
  twitterSite: '@Tripthesia',
  locale: 'en_US',
  type: 'website',
};

export const SEOMetadata: React.FC<SEOMetadataProps> = ({
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  noIndex = false,
  noFollow = false,
  locale = DEFAULT_SEO.locale,
  alternateUrls = {},
  structuredData,
  tripData,
  currency,
  location,
}) => {
  const pathname = usePathname();
  
  // Generate dynamic content based on context
  const generateDynamicContent = () => {
    const dynamicTitle = generateTitle();
    const dynamicDescription = generateDescription();
    const dynamicKeywords = generateKeywords();
    const dynamicCanonicalUrl = canonicalUrl || `${DEFAULT_SEO.siteUrl}${pathname}`;
    const dynamicOgImage = generateOgImage();

    return {
      title: dynamicTitle,
      description: dynamicDescription,
      keywords: dynamicKeywords,
      canonicalUrl: dynamicCanonicalUrl,
      ogImage: dynamicOgImage,
    };
  };

  const generateTitle = (): string => {
    if (title) return title;

    // Generate contextual titles based on trip data and location
    if (tripData?.destination && tripData?.departure) {
      const duration = tripData.dates ? 
        Math.ceil((new Date(tripData.dates.end).getTime() - new Date(tripData.dates.start).getTime()) / (1000 * 60 * 60 * 24)) : '';
      const durationText = duration ? ` ${duration}-Day` : '';
      return `${tripData.departure} to ${tripData.destination}${durationText} Trip - AI Travel Planner | ${DEFAULT_SEO.siteName}`;
    }

    if (tripData?.destination) {
      return `Plan Your ${tripData.destination} Trip - AI Travel Planner | ${DEFAULT_SEO.siteName}`;
    }

    if (currency && location?.country) {
      return `Travel Planning in ${location.country} (${currency}) - AI Trip Planner | ${DEFAULT_SEO.siteName}`;
    }

    // Page-specific titles
    const pageTitles: { [key: string]: string } = {
      '/': `${DEFAULT_SEO.siteName} - AI-Powered Travel Planning Platform`,
      '/new': `Plan New Trip - AI Travel Assistant | ${DEFAULT_SEO.siteName}`,
      '/transport': `Transport Search - Flights, Trains, Buses | ${DEFAULT_SEO.siteName}`,
      '/ai-assistant': `AI Travel Assistant - Smart Trip Recommendations | ${DEFAULT_SEO.siteName}`,
      '/planner': `Interactive Trip Planner - Drag & Drop Itinerary | ${DEFAULT_SEO.siteName}`,
      '/road-trip': `Road Trip Planner - Route Optimization & POI Discovery | ${DEFAULT_SEO.siteName}`,
      '/trips': `My Trips - Travel Planning Dashboard | ${DEFAULT_SEO.siteName}`,
    };

    return pageTitles[pathname] || `${DEFAULT_SEO.siteName} - Smart Travel Planning`;
  };

  const generateDescription = (): string => {
    if (description) return description;

    // Generate contextual descriptions
    if (tripData?.destination && tripData?.departure) {
      const budgetText = tripData.budget ? ` with ${tripData.budget.currency} ${tripData.budget.amount} budget` : '';
      const travelersText = tripData.travelers ? ` for ${tripData.travelers} travelers` : '';
      return `Plan your perfect trip from ${tripData.departure} to ${tripData.destination}${budgetText}${travelersText}. AI-powered itinerary generation, transport booking, and budget optimization.`;
    }

    if (tripData?.destination) {
      return `Discover the best of ${tripData.destination} with AI-powered travel recommendations. Get personalized itineraries, budget optimization, and local insights for your perfect trip.`;
    }

    if (currency && location?.country) {
      return `Plan your travels in ${location.country} with ${currency} pricing. AI-powered trip planning with local currency support and regional recommendations.`;
    }

    // Page-specific descriptions
    const pageDescriptions: { [key: string]: string } = {
      '/': DEFAULT_SEO.siteDescription,
      '/new': 'Create your perfect trip with our AI travel assistant. Get personalized recommendations, optimize your budget, and discover hidden gems.',
      '/transport': 'Search and compare flights, trains, and buses. Multi-modal transport planning with real-time pricing and booking options.',
      '/ai-assistant': 'Get personalized travel recommendations from our AI assistant. Discover activities, restaurants, and experiences tailored to your interests.',
      '/planner': 'Interactive trip planner with drag-and-drop timeline, route optimization, and collaborative features. Plan your perfect itinerary.',
      '/road-trip': 'Plan epic road trips with route optimization, POI discovery, and Google Maps integration. Find hidden gems along your route.',
      '/trips': 'Manage all your trips in one place. Resume draft trips, share itineraries, and track your travel history.',
    };

    return pageDescriptions[pathname] || DEFAULT_SEO.siteDescription;
  };

  const generateKeywords = (): string => {
    if (keywords) return keywords;

    const baseKeywords = ['travel planning', 'ai travel assistant', 'trip planner', 'itinerary generator', 'budget optimizer'];
    
    // Add contextual keywords
    const contextualKeywords = [];
    
    if (tripData?.destination) {
      contextualKeywords.push(`${tripData.destination} travel`, `visit ${tripData.destination}`, `${tripData.destination} guide`);
    }
    
    if (tripData?.departure) {
      contextualKeywords.push(`travel from ${tripData.departure}`, `${tripData.departure} to ${tripData.destination}`);
    }
    
    if (tripData?.tripType) {
      contextualKeywords.push(`${tripData.tripType} trip`, `${tripData.tripType} travel`);
    }
    
    if (currency) {
      contextualKeywords.push(`${currency} travel planning`, `${currency} budget travel`);
    }

    if (location?.country) {
      contextualKeywords.push(`${location.country} travel`, `travel in ${location.country}`);
    }

    // Page-specific keywords
    const pageKeywords: { [key: string]: string[] } = {
      '/transport': ['flight search', 'train booking', 'bus tickets', 'transport comparison'],
      '/ai-assistant': ['ai recommendations', 'smart suggestions', 'personalized travel'],
      '/planner': ['interactive planner', 'drag drop itinerary', 'collaborative planning'],
      '/road-trip': ['road trip planner', 'route optimization', 'poi discovery', 'driving directions'],
    };

    const allKeywords = [...baseKeywords, ...contextualKeywords, ...(pageKeywords[pathname] || [])];
    return allKeywords.join(', ');
  };

  const generateOgImage = (): string => {
    if (ogImage) return ogImage;

    // Generate dynamic OG images based on trip data
    if (tripData?.destination) {
      // In a full implementation, this would generate or fetch destination-specific images
      return `${DEFAULT_SEO.siteUrl}/api/og?destination=${encodeURIComponent(tripData.destination)}&departure=${encodeURIComponent(tripData.departure || '')}`;
    }

    return DEFAULT_SEO.defaultImage;
  };

  const { 
    title: finalTitle, 
    description: finalDescription, 
    keywords: finalKeywords,
    canonicalUrl: finalCanonicalUrl,
    ogImage: finalOgImage
  } = generateDynamicContent();

  // Generate structured data
  const generateStructuredData = () => {
    if (structuredData) return structuredData;

    const baseStructuredData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": `${DEFAULT_SEO.siteUrl}/#website`,
          "url": DEFAULT_SEO.siteUrl,
          "name": DEFAULT_SEO.siteName,
          "description": DEFAULT_SEO.siteDescription,
          "potentialAction": {
            "@type": "SearchAction",
            "target": `${DEFAULT_SEO.siteUrl}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string"
          }
        },
        {
          "@type": "Organization",
          "@id": `${DEFAULT_SEO.siteUrl}/#organization`,
          "name": DEFAULT_SEO.siteName,
          "url": DEFAULT_SEO.siteUrl,
          "logo": {
            "@type": "ImageObject",
            "url": `${DEFAULT_SEO.siteUrl}/logo.png`
          },
          "sameAs": [
            "https://twitter.com/Tripthesia",
            "https://linkedin.com/company/tripthesia"
          ]
        }
      ]
    };

    // Add trip-specific structured data
    if (tripData?.destination && tripData?.departure) {
      baseStructuredData["@graph"].push({
        "@type": "TripAction",
        "name": `Trip from ${tripData.departure} to ${tripData.destination}`,
        "description": finalDescription,
        "startLocation": {
          "@type": "Place",
          "name": tripData.departure
        },
        "endLocation": {
          "@type": "Place", 
          "name": tripData.destination
        },
        ...(tripData.dates && {
          "startTime": tripData.dates.start,
          "endTime": tripData.dates.end
        }),
        ...(tripData.budget && {
          "totalPrice": {
            "@type": "MonetaryAmount",
            "value": tripData.budget.amount,
            "currency": tripData.budget.currency
          }
        })
      });
    }

    return baseStructuredData;
  };

  const structuredDataJson = JSON.stringify(generateStructuredData());

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      <link rel="canonical" href={finalCanonicalUrl} />

      {/* Robots */}
      <meta name="robots" content={`${noIndex ? 'noindex' : 'index'}, ${noFollow ? 'nofollow' : 'follow'}`} />

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalOgImage} />
      <meta property="og:url" content={finalCanonicalUrl} />
      <meta property="og:site_name" content={DEFAULT_SEO.siteName} />
      <meta property="og:locale" content={locale} />

      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:site" content={DEFAULT_SEO.twitterSite} />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalOgImage} />

      {/* Alternate URLs */}
      {Object.entries(alternateUrls).map(([lang, url]) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={url} />
      ))}

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: structuredDataJson
        }}
      />

      {/* Additional meta tags for travel context */}
      {location?.country && (
        <meta name="geo.region" content={location.country} />
      )}
      {location?.city && (
        <meta name="geo.placename" content={location.city} />
      )}
      {currency && (
        <meta name="currency" content={currency} />
      )}
      
      {/* Preload critical resources */}
      <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="dns-prefetch" href="https://api.tripthesia.com" />
      
      {/* PWA meta tags */}
      <meta name="application-name" content={DEFAULT_SEO.siteName} />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={DEFAULT_SEO.siteName} />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="theme-color" content="#0f172a" />
    </Head>
  );
};

export default SEOMetadata;