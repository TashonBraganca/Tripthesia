/**
 * Intelligent Price Comparison Engine - Phase 2.6
 * 
 * Advanced multi-factor price analysis system providing:
 * - Intelligent price scoring across multiple travel services
 * - Deal identification and ranking algorithms
 * - Historical price trend analysis and predictions
 * - Value-for-money calculations with quality weighting
 * - Dynamic pricing confidence scoring
 * - Cross-service price normalization and comparison
 * - Currency-aware price analysis with real-time conversions
 * - Provider reliability impact on price confidence
 * - Smart bundling opportunities detection
 * - Price alert threshold calculations
 */

import { Currency, UnifiedFlightOffer, UnifiedHotelOffer, UnifiedTransportOffer, UnifiedCarRentalOffer } from './travel-normalization';

// Re-export Currency for other modules
export type { Currency };

// ==================== CORE TYPES ====================

export type TravelServiceType = 'flight' | 'hotel' | 'transport' | 'car_rental';

export interface PricePoint {
  amount: number;
  currency: Currency;
  confidence: number; // 0-100, confidence in price accuracy
  lastUpdated: Date;
  provider: string;
  serviceType: TravelServiceType;
}

export interface PriceComparison {
  serviceType: TravelServiceType;
  offers: Array<{
    id: string;
    provider: string;
    price: PricePoint;
    valueScore: number; // 0-100, value for money score
    dealScore: number; // 0-100, how good of a deal this is
    qualityScore: number; // 1-5, service quality score
    totalScore: number; // 0-100, combined weighted score
    priceRank: number; // 1-based ranking by price
    valueRank: number; // 1-based ranking by value
    dealType?: 'excellent' | 'good' | 'fair' | 'poor';
    savings?: {
      amount: number;
      percentage: number;
      comparedToAverage: boolean;
    };
  }>;
  analytics: {
    priceRange: {
      min: PricePoint;
      max: PricePoint;
      average: number;
      median: number;
      standardDeviation: number;
    };
    recommendations: {
      bestDeal: string; // offer ID
      bestValue: string; // offer ID  
      mostReliable: string; // offer ID
      budgetFriendly: string; // offer ID
    };
    marketInsights: {
      isHighDemandPeriod: boolean;
      priceVolatility: 'low' | 'medium' | 'high';
      trendDirection: 'rising' | 'stable' | 'falling';
      confidenceLevel: number;
    };
  };
}

export interface CrossServiceComparison {
  totalBudget: number;
  currency: Currency;
  services: PriceComparison[];
  bundleOpportunities: Array<{
    providers: string[];
    services: TravelServiceType[];
    totalPrice: number;
    individualPrice: number;
    savings: number;
    savingsPercentage: number;
    confidence: number;
  }>;
  recommendations: {
    bestOverallValue: {
      combination: Array<{ serviceType: TravelServiceType; offerId: string; provider: string; price: number }>;
      totalPrice: number;
      valueScore: number;
    };
    budgetOptimal: {
      combination: Array<{ serviceType: TravelServiceType; offerId: string; provider: string; price: number }>;
      totalPrice: number;
      compromiseScore: number; // Quality sacrifice for price
    };
    qualityOptimal: {
      combination: Array<{ serviceType: TravelServiceType; offerId: string; provider: string; price: number }>;
      totalPrice: number;
      qualityScore: number;
    };
  };
  priceAlerts: Array<{
    serviceType: TravelServiceType;
    threshold: number;
    currentPrice: number;
    shouldAlert: boolean;
    message: string;
  }>;
}

// ==================== PRICING ALGORITHMS ====================

export interface PricingWeights {
  price: number; // Base price importance (0-1)
  quality: number; // Service quality importance (0-1)
  reliability: number; // Provider reliability importance (0-1)
  convenience: number; // Convenience factors (timing, location, etc.) (0-1)
  sustainability: number; // Environmental impact (0-1)
  refundability: number; // Cancellation flexibility (0-1)
}

export const DEFAULT_PRICING_WEIGHTS: PricingWeights = {
  price: 0.4,
  quality: 0.25,
  reliability: 0.15,
  convenience: 0.1,
  sustainability: 0.05,
  refundability: 0.05
};

export interface DealClassification {
  excellent: { threshold: number; message: string };
  good: { threshold: number; message: string };
  fair: { threshold: number; message: string };
  poor: { threshold: number; message: string };
}

export const DEAL_THRESHOLDS: DealClassification = {
  excellent: { threshold: 85, message: "Exceptional deal - significantly below market average" },
  good: { threshold: 70, message: "Good value - moderately below average price" },
  fair: { threshold: 50, message: "Fair price - around market average" },
  poor: { threshold: 0, message: "Above average price - consider alternatives" }
};

// ==================== MAIN ENGINE CLASS ====================

export class PriceComparisonEngine {
  private readonly weights: PricingWeights;
  private readonly currencyRates = new Map<string, { rate: number; lastUpdated: number }>();
  private readonly priceHistory = new Map<string, PricePoint[]>();
  private readonly marketData = new Map<string, any>();

  constructor(weights: Partial<PricingWeights> = {}) {
    this.weights = { ...DEFAULT_PRICING_WEIGHTS, ...weights };
    this.initializeMarketData();
  }

  private initializeMarketData() {
    // Initialize with mock historical data - in production, this would come from a database
    this.marketData.set('flight_seasonal_multipliers', {
      'winter': 1.2,
      'spring': 0.9,
      'summer': 1.4,
      'fall': 1.0
    });

    this.marketData.set('hotel_demand_patterns', {
      'business_districts': { weekday: 1.3, weekend: 0.7 },
      'tourist_areas': { weekday: 0.8, weekend: 1.5 },
      'airports': { constant: 1.0 }
    });
  }

  // ==================== FLIGHT COMPARISON ====================

  async compareFlights(
    offers: UnifiedFlightOffer[],
    targetCurrency: Currency = 'USD',
    userPreferences: Partial<PricingWeights> = {}
  ): Promise<PriceComparison> {
    const weights = { ...this.weights, ...userPreferences };
    
    // Convert all prices to target currency
    const normalizedOffers = await Promise.all(
      offers.map(async (offer) => ({
        ...offer,
        normalizedPrice: await this.convertCurrency((offer.pricing as any).totalPrice || 0, offer.pricing.currency, targetCurrency)
      }))
    );

    // Calculate price statistics
    const prices = normalizedOffers.map(offer => offer.normalizedPrice);
    const analytics = this.calculatePriceAnalytics(prices, targetCurrency);

    // Score each offer
    const scoredOffers = normalizedOffers.map((offer, index) => {
      const priceScore = this.calculatePriceScore(offer.normalizedPrice, analytics);
      const qualityScore = offer.qualityScore;
      const reliabilityScore = this.getProviderReliabilityScore(offer.provider.name || 'unknown');
      const convenienceScore = this.calculateFlightConvenienceScore(offer);
      const sustainabilityScore = this.calculateSustainabilityScore((offer as any).sustainability);
      const refundabilityScore = this.calculateRefundabilityScore((offer as any).bookingOptions);

      const totalScore = Math.round(
        (priceScore * weights.price) +
        (qualityScore * 20 * weights.quality) + // Convert 1-5 to 0-100 scale
        (reliabilityScore * weights.reliability) +
        (convenienceScore * weights.convenience) +
        (sustainabilityScore * weights.sustainability) +
        (refundabilityScore * weights.refundability)
      );

      const valueScore = Math.round((qualityScore * 20 + priceScore) / 2);
      const dealScore = this.calculateDealScore(offer.normalizedPrice, analytics, qualityScore);
      const dealType = this.classifyDeal(dealScore);

      return {
        id: offer.id,
        provider: (offer as any).provider || 'unknown',
        price: {
          amount: offer.normalizedPrice,
          currency: targetCurrency,
          confidence: (offer.pricing as any).confidence || 95,
          lastUpdated: new Date(),
          provider: (offer as any).provider || 'unknown',
          serviceType: 'flight' as TravelServiceType
        },
        valueScore,
        dealScore,
        qualityScore,
        totalScore,
        priceRank: 0, // Will be set after sorting
        valueRank: 0, // Will be set after sorting
        dealType,
        savings: this.calculateSavings(offer.normalizedPrice, analytics.average)
      };
    });

    // Assign rankings
    this.assignRankings(scoredOffers);

    // Generate recommendations
    const recommendations = this.generateRecommendations(scoredOffers);

    // Market insights
    const marketInsights = this.analyzeMarketTrends('flight', (normalizedOffers[0] as any)?.journey);

    return {
      serviceType: 'flight',
      offers: scoredOffers,
      analytics: {
        priceRange: {
          min: {
            amount: Math.min(...prices),
            currency: targetCurrency,
            confidence: 95,
            lastUpdated: new Date(),
            provider: 'analysis',
            serviceType: 'flight'
          },
          max: {
            amount: Math.max(...prices),
            currency: targetCurrency,
            confidence: 95,
            lastUpdated: new Date(),
            provider: 'analysis',
            serviceType: 'flight'
          },
          average: analytics.average,
          median: analytics.median,
          standardDeviation: analytics.standardDeviation
        },
        recommendations,
        marketInsights
      }
    };
  }

  // ==================== HOTEL COMPARISON ====================

  async compareHotels(
    offers: UnifiedHotelOffer[],
    targetCurrency: Currency = 'USD',
    userPreferences: Partial<PricingWeights> = {}
  ): Promise<PriceComparison> {
    const weights = { ...this.weights, ...userPreferences };
    
    const normalizedOffers = await Promise.all(
      offers.map(async (offer) => ({
        ...offer,
        normalizedPrice: await this.convertCurrency((offer.pricing as any).totalPrice || 0, offer.pricing.currency, targetCurrency)
      }))
    );

    const prices = normalizedOffers.map(offer => offer.normalizedPrice);
    const analytics = this.calculatePriceAnalytics(prices, targetCurrency);

    const scoredOffers = normalizedOffers.map(offer => {
      const priceScore = this.calculatePriceScore(offer.normalizedPrice, analytics);
      const qualityScore = offer.qualityScore;
      const reliabilityScore = this.getProviderReliabilityScore(offer.provider.name || 'unknown');
      const convenienceScore = this.calculateHotelConvenienceScore(offer);
      const sustainabilityScore = this.calculateSustainabilityScore((offer as any).sustainability);
      const refundabilityScore = this.calculateRefundabilityScore((offer as any).bookingOptions);

      const totalScore = Math.round(
        (priceScore * weights.price) +
        (qualityScore * 20 * weights.quality) +
        (reliabilityScore * weights.reliability) +
        (convenienceScore * weights.convenience) +
        (sustainabilityScore * weights.sustainability) +
        (refundabilityScore * weights.refundability)
      );

      const valueScore = Math.round((qualityScore * 20 + priceScore) / 2);
      const dealScore = this.calculateDealScore(offer.normalizedPrice, analytics, qualityScore);

      return {
        id: offer.id,
        provider: (offer as any).provider || 'unknown',
        price: {
          amount: offer.normalizedPrice,
          currency: targetCurrency,
          confidence: (offer.pricing as any).confidence || 95,
          lastUpdated: new Date(),
          provider: (offer as any).provider || 'unknown',
          serviceType: 'hotel' as TravelServiceType
        },
        valueScore,
        dealScore,
        qualityScore,
        totalScore,
        priceRank: 0,
        valueRank: 0,
        dealType: this.classifyDeal(dealScore),
        savings: this.calculateSavings(offer.normalizedPrice, analytics.average)
      };
    });

    this.assignRankings(scoredOffers);
    const recommendations = this.generateRecommendations(scoredOffers);
    const marketInsights = this.analyzeMarketTrends('hotel', normalizedOffers[0]?.property);

    return {
      serviceType: 'hotel',
      offers: scoredOffers,
      analytics: {
        priceRange: {
          min: {
            amount: Math.min(...prices),
            currency: targetCurrency,
            confidence: 95,
            lastUpdated: new Date(),
            provider: 'analysis',
            serviceType: 'hotel'
          },
          max: {
            amount: Math.max(...prices),
            currency: targetCurrency,
            confidence: 95,
            lastUpdated: new Date(),
            provider: 'analysis',
            serviceType: 'hotel'
          },
          average: analytics.average,
          median: analytics.median,
          standardDeviation: analytics.standardDeviation
        },
        recommendations,
        marketInsights
      }
    };
  }

  // ==================== CROSS-SERVICE COMPARISON ====================

  async compareAllServices(
    flights: UnifiedFlightOffer[] = [],
    hotels: UnifiedHotelOffer[] = [],
    transport: UnifiedTransportOffer[] = [],
    carRentals: UnifiedCarRentalOffer[] = [],
    budget?: number,
    targetCurrency: Currency = 'USD'
  ): Promise<CrossServiceComparison> {
    const comparisons: PriceComparison[] = [];
    
    if (flights.length > 0) {
      comparisons.push(await this.compareFlights(flights, targetCurrency));
    }
    
    if (hotels.length > 0) {
      comparisons.push(await this.compareHotels(hotels, targetCurrency));
    }

    // TODO: Add transport and car rental comparisons when those methods are implemented
    
    // Calculate bundle opportunities
    const bundleOpportunities = this.findBundleOpportunities(comparisons);
    
    // Generate cross-service recommendations
    const recommendations = this.generateCrossServiceRecommendations(comparisons, budget);
    
    // Calculate price alerts
    const priceAlerts = this.calculatePriceAlerts(comparisons, budget);

    const totalBudget = budget || comparisons.reduce((sum, comp) => 
      sum + (comp.offers[0]?.price.amount || 0), 0);

    return {
      totalBudget,
      currency: targetCurrency,
      services: comparisons,
      bundleOpportunities,
      recommendations,
      priceAlerts
    };
  }

  // ==================== UTILITY METHODS ====================

  private async convertCurrency(
    amount: number, 
    fromCurrency: Currency, 
    toCurrency: Currency
  ): Promise<number> {
    if (fromCurrency === toCurrency) return amount;

    // Check cache first
    const cacheKey = `${fromCurrency}_${toCurrency}`;
    const cached = this.currencyRates.get(cacheKey);
    const now = Date.now();

    if (cached && (now - cached.lastUpdated) < 3600000) { // 1 hour cache
      return Math.round(amount * cached.rate * 100) / 100;
    }

    // In production, fetch from real API
    const mockRates: Record<string, number> = {
      'USD_EUR': 0.85,
      'USD_GBP': 0.75,
      'EUR_USD': 1.18,
      'EUR_GBP': 0.88,
      'GBP_USD': 1.33,
      'GBP_EUR': 1.14
    };

    const rate = mockRates[cacheKey] || 1;
    this.currencyRates.set(cacheKey, { rate, lastUpdated: now });

    return Math.round(amount * rate * 100) / 100;
  }

  private calculatePriceAnalytics(prices: number[], currency: Currency) {
    const sorted = prices.sort((a, b) => a - b);
    const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - average, 2), 0) / prices.length;
    const standardDeviation = Math.sqrt(variance);

    return { average, median, standardDeviation };
  }

  private calculatePriceScore(price: number, analytics: { average: number; standardDeviation: number }): number {
    // Lower price = higher score, normalized to 0-100
    const zScore = (analytics.average - price) / analytics.standardDeviation;
    const score = Math.max(0, Math.min(100, 50 + (zScore * 20)));
    return Math.round(score);
  }

  private calculateDealScore(price: number, analytics: { average: number }, qualityScore: number): number {
    const priceRatio = price / analytics.average;
    const qualityBonus = (qualityScore - 3) * 10; // Adjust for quality above/below average
    
    let baseScore = 100 - ((priceRatio - 0.7) * 100); // Best score when price is 70% of average
    baseScore = Math.max(0, Math.min(100, baseScore + qualityBonus));
    
    return Math.round(baseScore);
  }

  private calculateSavings(price: number, average: number) {
    if (price >= average) return undefined;
    
    const amount = Math.round((average - price) * 100) / 100;
    const percentage = Math.round(((average - price) / average) * 100);
    
    return { amount, percentage, comparedToAverage: true };
  }

  private classifyDeal(dealScore: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (dealScore >= DEAL_THRESHOLDS.excellent.threshold) return 'excellent';
    if (dealScore >= DEAL_THRESHOLDS.good.threshold) return 'good';
    if (dealScore >= DEAL_THRESHOLDS.fair.threshold) return 'fair';
    return 'poor';
  }

  private assignRankings(offers: any[]) {
    // Price ranking
    const byPrice = [...offers].sort((a, b) => a.price.amount - b.price.amount);
    byPrice.forEach((offer, index) => {
      const originalOffer = offers.find(o => o.id === offer.id);
      if (originalOffer) originalOffer.priceRank = index + 1;
    });

    // Value ranking
    const byValue = [...offers].sort((a, b) => b.valueScore - a.valueScore);
    byValue.forEach((offer, index) => {
      const originalOffer = offers.find(o => o.id === offer.id);
      if (originalOffer) originalOffer.valueRank = index + 1;
    });
  }

  private generateRecommendations(offers: any[]) {
    const bestDeal = offers.reduce((best, offer) => 
      offer.dealScore > (best?.dealScore || 0) ? offer : best);
    const bestValue = offers.reduce((best, offer) => 
      offer.valueScore > (best?.valueScore || 0) ? offer : best);
    const mostReliable = offers.reduce((best, offer) => 
      offer.totalScore > (best?.totalScore || 0) ? offer : best);
    const budgetFriendly = offers.reduce((best, offer) => 
      offer.price.amount < (best?.price.amount || Infinity) ? offer : best);

    return {
      bestDeal: bestDeal?.id || '',
      bestValue: bestValue?.id || '',
      mostReliable: mostReliable?.id || '',
      budgetFriendly: budgetFriendly?.id || ''
    };
  }

  private analyzeMarketTrends(serviceType: string, context?: any) {
    // Mock implementation - in production, this would analyze historical data
    return {
      isHighDemandPeriod: Math.random() > 0.7,
      priceVolatility: Math.random() > 0.6 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low' as 'low' | 'medium' | 'high',
      trendDirection: Math.random() > 0.6 ? 'rising' : Math.random() > 0.3 ? 'stable' : 'falling' as 'rising' | 'stable' | 'falling',
      confidenceLevel: Math.round(70 + Math.random() * 25) // 70-95%
    };
  }

  private getProviderReliabilityScore(provider: string): number {
    // Mock provider reliability scores - in production, from database
    const scores: Record<string, number> = {
      'amadeus': 90,
      'skyscanner': 85,
      'expedia': 80,
      'booking.com': 88,
      'rome2rio': 75,
      'cartrawler': 82
    };
    return scores[provider.toLowerCase()] || 70;
  }

  private calculateFlightConvenienceScore(flight: UnifiedFlightOffer): number {
    let score = 50; // Base score
    
    // Penalize for stops - use flight type as proxy
    const segments = (flight as any).segments || [];
    if (segments.length === 1) score += 20;
    else if (segments.length === 2) score += 10;
    else if (segments.length > 2) score -= (segments.length - 2) * 5;
    
    // Consider total travel time if available
    const totalMinutes = (flight as any).duration?.total || 0;
    if (totalMinutes > 0) {
      if (totalMinutes < 180) score += 15; // Under 3 hours
      else if (totalMinutes < 360) score += 10; // Under 6 hours
      else if (totalMinutes > 720) score -= 10; // Over 12 hours
    }
    
    return Math.max(0, Math.min(100, score));
  }

  private calculateHotelConvenienceScore(hotel: UnifiedHotelOffer): number {
    let score = 50; // Base score
    
    // Distance from city center bonus (if available)
    const distanceFromCenter = (hotel.property as any).distanceFromCenter;
    if (distanceFromCenter && distanceFromCenter < 2) {
      score += 20;
    } else if (distanceFromCenter && distanceFromCenter < 5) {
      score += 10;
    }
    
    // Amenities bonus
    const amenityCount = (hotel as any).amenities?.length || 0;
    score += Math.min(20, amenityCount * 2);
    
    return Math.max(0, Math.min(100, score));
  }

  private calculateSustainabilityScore(sustainability?: any): number {
    if (!sustainability) return 50; // Neutral score if no data
    
    let score = 0;
    if (sustainability.carbonOffset) score += 25;
    if (sustainability.ecoFriendly) score += 25;
    if (sustainability.renewableEnergy) score += 25;
    if (sustainability.sustainablePractices) score += 25;
    
    return score;
  }

  private calculateRefundabilityScore(bookingOptions?: any): number {
    if (!bookingOptions) return 30; // Low score if no flexibility info
    
    let score = 0;
    if (bookingOptions.freeCancellation) score += 40;
    if (bookingOptions.freeChange) score += 30;
    if (bookingOptions.partialRefund) score += 20;
    if (bookingOptions.insurance) score += 10;
    
    return Math.min(100, score);
  }

  private findBundleOpportunities(comparisons: PriceComparison[]) {
    // Simple bundling logic - in production, this would be more sophisticated
    const opportunities = [];
    
    if (comparisons.length >= 2) {
      const providers = new Set(
        comparisons.flatMap(comp => comp.offers.map(offer => offer.provider))
      );
      
      for (const provider of providers) {
        const providerOffers = comparisons
          .map(comp => comp.offers.find(offer => offer.provider === provider))
          .filter(Boolean);
        
        if (providerOffers.length >= 2) {
          const totalPrice = providerOffers.reduce((sum, offer) => sum + offer!.price.amount, 0);
          const individualPrice = totalPrice; // No bundle discount in mock
          const savings = Math.round(totalPrice * 0.05); // Mock 5% bundle discount
          
          opportunities.push({
            providers: [provider],
            services: comparisons.map(comp => comp.serviceType),
            totalPrice: totalPrice - savings,
            individualPrice,
            savings,
            savingsPercentage: 5,
            confidence: 85
          });
        }
      }
    }
    
    return opportunities;
  }

  private generateCrossServiceRecommendations(comparisons: PriceComparison[], budget?: number) {
    // Find best overall value combination
    const bestValueOffers = comparisons.map(comp => 
      comp.offers.reduce((best, offer) => 
        offer.valueScore > (best?.valueScore || 0) ? offer : best));
    
    const bestOverallValue = {
      combination: bestValueOffers.map(offer => ({
        serviceType: comparisons.find(c => c.offers.includes(offer))!.serviceType,
        offerId: offer.id,
        provider: (offer as any).provider || 'unknown',
        price: offer.price.amount
      })),
      totalPrice: bestValueOffers.reduce((sum, offer) => sum + offer.price.amount, 0),
      valueScore: Math.round(bestValueOffers.reduce((sum, offer) => sum + offer.valueScore, 0) / bestValueOffers.length)
    };

    // Find budget optimal combination
    const cheapestOffers = comparisons.map(comp => 
      comp.offers.reduce((cheapest, offer) => 
        offer.price.amount < (cheapest?.price.amount || Infinity) ? offer : cheapest));
    
    const budgetOptimal = {
      combination: cheapestOffers.map(offer => ({
        serviceType: comparisons.find(c => c.offers.includes(offer))!.serviceType,
        offerId: offer.id,
        provider: (offer as any).provider || 'unknown',
        price: offer.price.amount
      })),
      totalPrice: cheapestOffers.reduce((sum, offer) => sum + offer.price.amount, 0),
      compromiseScore: Math.round(cheapestOffers.reduce((sum, offer) => sum + offer.qualityScore, 0) / cheapestOffers.length * 20)
    };

    // Find quality optimal combination
    const qualityOffers = comparisons.map(comp => 
      comp.offers.reduce((best, offer) => 
        offer.qualityScore > (best?.qualityScore || 0) ? offer : best));
    
    const qualityOptimal = {
      combination: qualityOffers.map(offer => ({
        serviceType: comparisons.find(c => c.offers.includes(offer))!.serviceType,
        offerId: offer.id,
        provider: (offer as any).provider || 'unknown',
        price: offer.price.amount
      })),
      totalPrice: qualityOffers.reduce((sum, offer) => sum + offer.price.amount, 0),
      qualityScore: Math.round(qualityOffers.reduce((sum, offer) => sum + offer.qualityScore, 0) / qualityOffers.length)
    };

    return {
      bestOverallValue,
      budgetOptimal,
      qualityOptimal
    };
  }

  private calculatePriceAlerts(comparisons: PriceComparison[], budget?: number) {
    if (!budget) return [];
    
    const alerts = [];
    const budgetPerService = budget / comparisons.length;
    
    for (const comparison of comparisons) {
      const cheapestPrice = Math.min(...comparison.offers.map(offer => offer.price.amount));
      const averagePrice = comparison.analytics.priceRange.average;
      
      const threshold = budgetPerService * 0.8; // Alert if 80% of budget per service
      const shouldAlert = cheapestPrice > threshold;
      
      alerts.push({
        serviceType: comparison.serviceType,
        threshold,
        currentPrice: cheapestPrice,
        shouldAlert,
        message: shouldAlert 
          ? `${comparison.serviceType} prices exceed budget allocation of $${threshold.toFixed(2)}`
          : `${comparison.serviceType} prices within budget`
      });
    }
    
    return alerts;
  }
}

// ==================== FACTORY FUNCTION ====================

export function createPriceComparisonEngine(weights?: Partial<PricingWeights>): PriceComparisonEngine {
  return new PriceComparisonEngine(weights);
}

// ==================== UTILITY TYPES ====================

export interface PriceOptimizationRequest {
  services: {
    flights?: UnifiedFlightOffer[];
    hotels?: UnifiedHotelOffer[];
    transport?: UnifiedTransportOffer[];
    carRentals?: UnifiedCarRentalOffer[];
  };
  budget?: number;
  currency?: Currency;
  preferences?: Partial<PricingWeights>;
  priceAlertThresholds?: Record<TravelServiceType, number>;
}

export interface PriceOptimizationResponse {
  comparison: CrossServiceComparison;
  insights: {
    totalSavings: number;
    budgetUtilization: number; // Percentage of budget used
    valueScore: number; // Overall value score
    riskFactors: string[]; // Potential issues or risks
    recommendations: string[]; // Human-readable recommendations
  };
  alternatives: Array<{
    name: string;
    description: string;
    totalPrice: number;
    savings: number;
    tradeoffs: string[];
  }>;
}