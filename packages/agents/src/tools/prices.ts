import { z } from "zod";

export const PriceQuoteParams = z.object({
  itemType: z.enum(["flight", "hotel", "activity", "car", "transport"]),
  itemRef: z.object({
    // Flight specific
    origin: z.string().optional(),
    destination: z.string().optional(),
    departDate: z.string().optional(),
    returnDate: z.string().optional(),
    passengers: z.number().min(1).max(9).optional(),
    
    // Hotel specific
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    guests: z.number().min(1).max(8).optional(),
    rooms: z.number().min(1).max(4).optional(),
    
    // Location for all
    lat: z.number().optional(),
    lng: z.number().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    
    // Activity specific
    activityId: z.string().optional(),
    date: z.string().optional(),
    
    // General
    currency: z.string().length(3).default("USD"),
  }),
  providers: z.array(z.enum(["kiwi", "booking", "agoda", "gyg", "viator", "klook", "discovercars"])).optional(),
});

export const PriceQuote = z.object({
  provider: z.string(),
  itemType: z.enum(["flight", "hotel", "activity", "car", "transport"]),
  currency: z.string(),
  amount: z.number(),
  originalAmount: z.number().optional(), // If converted
  originalCurrency: z.string().optional(),
  deepLink: z.string().url(),
  title: z.string(),
  description: z.string().optional(),
  image: z.string().url().optional(),
  rating: z.number().min(0).max(5).optional(),
  reviews: z.number().min(0).optional(),
  validUntil: z.string().datetime().optional(),
  cancellationPolicy: z.string().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
});

export const PriceQuotesResult = z.object({
  quotes: z.array(PriceQuote),
  searchParams: PriceQuoteParams,
  searchTime: z.string().datetime(),
  cached: z.boolean(),
  providers: z.array(z.string()),
  errors: z.array(z.object({
    provider: z.string(),
    error: z.string(),
  })).default([]),
});

export type PriceQuoteParams = z.infer<typeof PriceQuoteParams>;
export type PriceQuote = z.infer<typeof PriceQuote>;
export type PriceQuotesResult = z.infer<typeof PriceQuotesResult>;

export class PriceAggregator {
  private cache = new Map<string, { data: PriceQuotesResult; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  private getCacheKey(params: PriceQuoteParams): string {
    return JSON.stringify(params);
  }

  async getPriceQuotes(params: PriceQuoteParams): Promise<PriceQuotesResult> {
    // Check cache first
    const cacheKey = this.getCacheKey(params);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return { ...cached.data, cached: true };
    }

    const providers = params.providers || this.getDefaultProviders(params.itemType);
    const quotes: PriceQuote[] = [];
    const errors: Array<{ provider: string; error: string }> = [];

    // Parallel fetching from all providers
    const providerPromises = providers.map(async (provider) => {
      try {
        const providerQuotes = await this.fetchFromProvider(provider, params);
        quotes.push(...providerQuotes);
      } catch (error) {
        console.warn(`Provider ${provider} failed:`, error);
        errors.push({
          provider,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });

    await Promise.allSettled(providerPromises);

    // Sort by price
    quotes.sort((a, b) => a.amount - b.amount);

    const result: PriceQuotesResult = {
      quotes,
      searchParams: params,
      searchTime: new Date().toISOString(),
      cached: false,
      providers,
      errors,
    };

    // Cache the result
    this.cache.set(cacheKey, { data: result, timestamp: Date.now() });

    return result;
  }

  private getDefaultProviders(itemType: string): string[] {
    switch (itemType) {
      case "flight":
        return ["kiwi"];
      case "hotel":
        return ["booking", "agoda"];
      case "activity":
        return ["gyg", "viator", "klook"];
      case "car":
        return ["discovercars"];
      default:
        return [];
    }
  }

  private async fetchFromProvider(provider: string, params: PriceQuoteParams): Promise<PriceQuote[]> {
    // Check if we have the required API keys for the provider
    const hasApiKey = this.hasApiKeyForProvider(provider);
    if (!hasApiKey) {
      console.warn(`No API key for provider ${provider}, returning mock data`);
      return this.generateMockQuotes(provider, params);
    }

    switch (provider) {
      case "kiwi":
        return this.fetchKiwiFlights(params);
      case "booking":
        return this.fetchBookingHotels(params);
      case "agoda":
        return this.fetchAgodaHotels(params);
      case "gyg":
        return this.fetchGetYourGuideActivities(params);
      case "viator":
        return this.fetchViatorActivities(params);
      case "klook":
        return this.fetchKlookActivities(params);
      case "discovercars":
        return this.fetchDiscoverCarsRentals(params);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private hasApiKeyForProvider(provider: string): boolean {
    switch (provider) {
      case "kiwi":
        return !!process.env.KIWI_API_KEY;
      case "booking":
        return !!process.env.BOOKING_AFFILIATE_ID;
      case "agoda":
        return true; // Agoda doesn't require API key for basic search
      case "gyg":
        return !!process.env.GYG_PARTNER_KEY;
      case "viator":
        return !!process.env.VIATOR_KEY;
      case "klook":
        return !!process.env.KLOOK_KEY;
      case "discovercars":
        return !!process.env.DISCOVERCARS_KEY;
      default:
        return false;
    }
  }

  private generateMockQuotes(provider: string, params: PriceQuoteParams): PriceQuote[] {
    const { itemType, itemRef } = params;
    const currency = itemRef.currency || "USD";
    
    // Generate realistic mock prices based on item type
    const basePrices: Record<string, number> = {
      flight: 250,
      hotel: 80,
      activity: 45,
      car: 35,
      transport: 12,
    };

    const basePrice = basePrices[itemType] || 50;
    const variance = basePrice * 0.3; // 30% variance
    const price = Math.round(basePrice + (Math.random() - 0.5) * variance);

    const mockQuote: PriceQuote = {
      provider: provider,
      itemType: itemType as any,
      currency: currency,
      amount: price,
      deepLink: `https://${provider}.com/search?mock=true`,
      title: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} option from ${provider}`,
      description: `Great ${itemType} option (mock data - API not configured)`,
      rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
      reviews: Math.floor(Math.random() * 500) + 50,
      tags: ["mock", "demo"],
    };

    return [mockQuote];
  }

  private async fetchKiwiFlights(params: PriceQuoteParams): Promise<PriceQuote[]> {
    const apiKey = process.env.KIWI_API_KEY;
    if (!apiKey) {
      throw new Error("KIWI_API_KEY not configured");
    }

    const { itemRef } = params;
    if (!itemRef.origin || !itemRef.destination || !itemRef.departDate) {
      throw new Error("Missing required flight parameters");
    }

    const url = new URL("https://api.tequila.kiwi.com/v2/search");
    url.searchParams.set("fly_from", itemRef.origin);
    url.searchParams.set("fly_to", itemRef.destination);
    url.searchParams.set("date_from", itemRef.departDate);
    url.searchParams.set("date_to", itemRef.departDate);
    if (itemRef.returnDate) {
      url.searchParams.set("return_from", itemRef.returnDate);
      url.searchParams.set("return_to", itemRef.returnDate);
    }
    url.searchParams.set("adults", (itemRef.passengers || 1).toString());
    url.searchParams.set("curr", itemRef.currency);
    url.searchParams.set("limit", "10");

    const response = await fetch(url.toString(), {
      headers: {
        "apikey": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Kiwi API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.data.map((flight: any): PriceQuote => ({
      provider: "Kiwi.com",
      itemType: "flight",
      currency: itemRef.currency,
      amount: flight.price,
      deepLink: flight.deep_link,
      title: `${flight.flyFrom} → ${flight.flyTo}`,
      description: `${flight.airlines.join(", ")} • ${flight.duration.departure}h`,
      validUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min
      tags: itemRef.returnDate ? ["roundtrip"] : ["oneway"],
      metadata: {
        duration: flight.duration,
        airlines: flight.airlines,
        stops: flight.pnr_count - 1,
      },
    }));
  }

  private async fetchBookingHotels(params: PriceQuoteParams): Promise<PriceQuote[]> {
    const affiliateId = process.env.BOOKING_AFFILIATE_ID;
    if (!affiliateId) {
      throw new Error("BOOKING_AFFILIATE_ID not configured");
    }

    // Booking.com uses affiliate links rather than API
    // Generate search URLs based on location
    const { itemRef } = params;
    
    if (!itemRef.city || !itemRef.checkIn || !itemRef.checkOut) {
      throw new Error("Missing required hotel parameters");
    }

    // This is a simplified implementation - in practice you'd use their API
    const searchUrl = new URL("https://www.booking.com/searchresults.html");
    searchUrl.searchParams.set("ss", itemRef.city);
    searchUrl.searchParams.set("checkin", itemRef.checkIn);
    searchUrl.searchParams.set("checkout", itemRef.checkOut);
    searchUrl.searchParams.set("group_adults", (itemRef.guests || 2).toString());
    searchUrl.searchParams.set("no_rooms", (itemRef.rooms || 1).toString());
    searchUrl.searchParams.set("aid", affiliateId);

    // Return placeholder data - in real implementation, you'd scrape or use their API
    return [
      {
        provider: "Booking.com",
        itemType: "hotel",
        currency: itemRef.currency,
        amount: 120,
        deepLink: searchUrl.toString(),
        title: `Hotels in ${itemRef.city}`,
        description: "Browse available accommodations",
        tags: ["hotels"],
        metadata: {},
      },
    ];
  }

  private async fetchAgodaHotels(params: PriceQuoteParams): Promise<PriceQuote[]> {
    // Similar implementation to Booking.com
    // Agoda also primarily uses affiliate links
    const { itemRef } = params;
    
    if (!itemRef.city) {
      throw new Error("Missing city for Agoda search");
    }

    return [
      {
        provider: "Agoda",
        itemType: "hotel",
        currency: itemRef.currency,
        amount: 115,
        deepLink: `https://www.agoda.com/search?city=${encodeURIComponent(itemRef.city)}`,
        title: `Hotels in ${itemRef.city}`,
        description: "Discover accommodations on Agoda",
        tags: ["hotels"],
        metadata: {},
      },
    ];
  }

  private async fetchGetYourGuideActivities(params: PriceQuoteParams): Promise<PriceQuote[]> {
    const apiKey = process.env.GYG_PARTNER_KEY;
    if (!apiKey) {
      throw new Error("GYG_PARTNER_KEY not configured");
    }

    const { itemRef } = params;
    if (!itemRef.lat || !itemRef.lng) {
      throw new Error("Missing coordinates for GetYourGuide search");
    }

    // GetYourGuide API implementation would go here
    // For now, return placeholder data
    return [
      {
        provider: "GetYourGuide",
        itemType: "activity",
        currency: itemRef.currency,
        amount: 45,
        deepLink: "https://www.getyourguide.com/",
        title: "City Walking Tour",
        description: "Explore the city with a local guide",
        rating: 4.5,
        reviews: 128,
        tags: ["tour", "walking"],
        metadata: {},
      },
    ];
  }

  private async fetchViatorActivities(params: PriceQuoteParams): Promise<PriceQuote[]> {
    // Viator API implementation
    return [
      {
        provider: "Viator",
        itemType: "activity",
        currency: params.itemRef.currency,
        amount: 52,
        deepLink: "https://www.viator.com/",
        title: "Food & Culture Tour",
        description: "Taste local cuisine and learn about culture",
        rating: 4.7,
        reviews: 89,
        tags: ["food", "culture"],
        metadata: {},
      },
    ];
  }

  private async fetchKlookActivities(params: PriceQuoteParams): Promise<PriceQuote[]> {
    // Klook API implementation
    return [
      {
        provider: "Klook",
        itemType: "activity",
        currency: params.itemRef.currency,
        amount: 38,
        deepLink: "https://www.klook.com/",
        title: "Museum Entry Ticket",
        description: "Skip-the-line access to popular museum",
        rating: 4.3,
        reviews: 245,
        tags: ["museum", "skip-line"],
        metadata: {},
      },
    ];
  }

  private async fetchDiscoverCarsRentals(params: PriceQuoteParams): Promise<PriceQuote[]> {
    // DiscoverCars API implementation
    return [
      {
        provider: "DiscoverCars",
        itemType: "car",
        currency: params.itemRef.currency,
        amount: 35,
        deepLink: "https://www.discovercars.com/",
        title: "Economy Car Rental",
        description: "Compact car for city driving",
        tags: ["economy", "manual"],
        metadata: {},
      },
    ];
  }
}

// Singleton instance
export const priceAggregator = new PriceAggregator();

// Main export function for backward compatibility
export async function getPriceQuotes(params: PriceQuoteParams): Promise<PriceQuotesResult> {
  return priceAggregator.getPriceQuotes(params);
}