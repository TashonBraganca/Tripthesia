/**
 * Deal Identification System - Phase 2.6
 * 
 * Advanced deal detection and alert system providing:
 * - Real-time deal identification across all travel services
 * - Historical price tracking and trend analysis
 * - Smart pricing pattern recognition
 * - Personalized deal recommendations
 * - Price drop alerts and notifications
 * - Seasonal pricing analysis and predictions
 * - Flash sale and limited-time offer detection
 * - Competitor price monitoring and analysis
 */

import { Currency, TravelServiceType, PricePoint, PriceComparison } from './price-comparison-engine';

// ==================== CORE TYPES ====================

export interface Deal {
  id: string;
  serviceType: TravelServiceType;
  provider: string;
  offerId: string;
  dealType: DealType;
  severity: DealSeverity;
  title: string;
  description: string;
  originalPrice: number;
  currentPrice: number;
  savings: {
    amount: number;
    percentage: number;
  };
  validUntil?: Date;
  conditions: string[];
  confidence: number; // 0-100, confidence this is actually a good deal
  rarity: DealRarity;
  metadata: {
    historicalLow?: boolean;
    flashSale?: boolean;
    limitedQuantity?: boolean;
    lastMinute?: boolean;
    bundleDiscount?: boolean;
    loyaltyDiscount?: boolean;
    seasonalDiscount?: boolean;
    competitorBeat?: boolean;
  };
}

export type DealType = 
  | 'price_drop' 
  | 'flash_sale' 
  | 'last_minute' 
  | 'bundle_discount' 
  | 'seasonal_special' 
  | 'competitor_beat'
  | 'error_fare'
  | 'loyalty_reward';

export type DealSeverity = 'minor' | 'moderate' | 'significant' | 'exceptional';
export type DealRarity = 'common' | 'uncommon' | 'rare' | 'ultra_rare';

export interface DealAlert {
  userId: string;
  dealId: string;
  alertType: 'price_drop' | 'threshold_reached' | 'new_deal' | 'expiring_soon';
  message: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  expiresAt?: Date;
  acknowledged: boolean;
}

export interface PriceHistory {
  serviceType: TravelServiceType;
  provider: string;
  route: string; // e.g., "NYC-LON" for flights, "Paris-Hotel" for hotels
  currency: Currency;
  dataPoints: Array<{
    timestamp: Date;
    price: number;
    availability: boolean;
    demand: 'low' | 'medium' | 'high';
    seasonality?: number; // Seasonal multiplier
  }>;
  statistics: {
    minPrice: number;
    maxPrice: number;
    averagePrice: number;
    medianPrice: number;
    volatility: number; // Standard deviation / mean
    trendDirection: 'rising' | 'stable' | 'falling';
    confidence: number;
  };
}

export interface DealPattern {
  patternType: 'weekly_cycle' | 'monthly_cycle' | 'seasonal' | 'event_based' | 'random';
  description: string;
  frequency: number; // How often this pattern occurs (0-1)
  reliability: number; // How reliable predictions based on this pattern are (0-1)
  nextPredictedOccurrence?: Date;
  typicalSavings: {
    min: number;
    max: number;
    average: number;
  };
}

// ==================== DEAL IDENTIFICATION ENGINE ====================

export class DealIdentificationEngine {
  private readonly priceHistoryStore = new Map<string, PriceHistory>();
  private readonly activeDeals = new Map<string, Deal>();
  private readonly dealPatterns = new Map<string, DealPattern[]>();
  private readonly userAlertPreferences = new Map<string, any>();

  constructor() {
    this.initializeDealPatterns();
  }

  private initializeDealPatterns() {
    // Initialize known deal patterns for different travel services
    this.dealPatterns.set('flight', [
      {
        patternType: 'weekly_cycle',
        description: 'Tuesday-Wednesday booking discounts',
        frequency: 0.8,
        reliability: 0.75,
        typicalSavings: { min: 5, max: 20, average: 12 }
      },
      {
        patternType: 'seasonal',
        description: 'Post-holiday price drops',
        frequency: 0.9,
        reliability: 0.85,
        nextPredictedOccurrence: new Date('2024-01-15'),
        typicalSavings: { min: 15, max: 40, average: 25 }
      },
      {
        patternType: 'event_based',
        description: 'Flash sales during major travel events',
        frequency: 0.3,
        reliability: 0.6,
        typicalSavings: { min: 20, max: 60, average: 35 }
      }
    ]);

    this.dealPatterns.set('hotel', [
      {
        patternType: 'weekly_cycle',
        description: 'Sunday night booking deals',
        frequency: 0.7,
        reliability: 0.8,
        typicalSavings: { min: 10, max: 25, average: 15 }
      },
      {
        patternType: 'monthly_cycle',
        description: 'End-of-month inventory clearance',
        frequency: 0.6,
        reliability: 0.7,
        typicalSavings: { min: 20, max: 50, average: 30 }
      }
    ]);
  }

  // ==================== DEAL DETECTION ====================

  async identifyDeals(
    currentOffers: PriceComparison[],
    userPreferences?: any
  ): Promise<Deal[]> {
    const deals: Deal[] = [];

    for (const comparison of currentOffers) {
      for (const offer of comparison.offers) {
        // Check for various deal types
        const detectedDeals = await Promise.all([
          this.detectPriceDrop(offer, comparison.serviceType),
          this.detectFlashSale(offer, comparison.serviceType),
          this.detectLastMinuteDeal(offer, comparison.serviceType),
          this.detectSeasonalSpecial(offer, comparison.serviceType),
          this.detectErrorFare(offer, comparison.serviceType),
          this.detectCompetitorBeat(offer, comparison)
        ]);

        deals.push(...detectedDeals.filter(deal => deal !== null) as Deal[]);
      }
    }

    // Remove duplicates and sort by savings
    const uniqueDeals = this.deduplicateDeals(deals);
    return uniqueDeals.sort((a, b) => b.savings.percentage - a.savings.percentage);
  }

  private async detectPriceDrop(
    offer: any,
    serviceType: TravelServiceType
  ): Promise<Deal | null> {
    const historyKey = this.generateHistoryKey(serviceType, offer.provider, offer.id);
    const history = this.priceHistoryStore.get(historyKey);

    if (!history || history.dataPoints.length < 7) {
      // Not enough data for price drop detection
      return null;
    }

    // Get recent price average (last 7 days)
    const recentPrices = history.dataPoints
      .slice(-7)
      .map(dp => dp.price);
    const recentAverage = recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length;

    const currentPrice = offer.price.amount;
    const dropPercentage = ((recentAverage - currentPrice) / recentAverage) * 100;

    // Significant price drop threshold
    if (dropPercentage >= 15) {
      const severity = this.calculateDealSeverity(dropPercentage, 15, 25, 40, 60);
      const rarity = this.calculateDealRarity(dropPercentage, history.statistics.volatility);

      return {
        id: `price_drop_${offer.id}_${Date.now()}`,
        serviceType,
        provider: offer.provider,
        offerId: offer.id,
        dealType: 'price_drop',
        severity,
        title: `${Math.round(dropPercentage)}% Price Drop`,
        description: `Price dropped from $${recentAverage.toFixed(2)} to $${currentPrice.toFixed(2)}`,
        originalPrice: recentAverage,
        currentPrice,
        savings: {
          amount: recentAverage - currentPrice,
          percentage: dropPercentage
        },
        conditions: ['Subject to availability', 'Prices may change'],
        confidence: Math.min(95, 60 + (dropPercentage - 15) * 2),
        rarity,
        metadata: {
          historicalLow: currentPrice <= history.statistics.minPrice * 1.05
        }
      };
    }

    return null;
  }

  private async detectFlashSale(
    offer: any,
    serviceType: TravelServiceType
  ): Promise<Deal | null> {
    // Flash sale detection based on unusual pricing patterns
    // This would typically integrate with provider APIs or scraping data
    
    // Mock implementation - in production, this would check:
    // 1. Provider's flash sale indicators
    // 2. Time-limited pricing
    // 3. Unusual discount patterns
    
    const flashSaleIndicators = [
      offer.metadata?.flashSale,
      offer.validUntil && new Date(offer.validUntil).getTime() - Date.now() < 24 * 3600000,
      offer.savings?.percentage && offer.savings.percentage > 30
    ];

    const isFlashSale = flashSaleIndicators.filter(Boolean).length >= 2;

    if (isFlashSale && offer.savings?.percentage > 25) {
      return {
        id: `flash_sale_${offer.id}_${Date.now()}`,
        serviceType,
        provider: offer.provider,
        offerId: offer.id,
        dealType: 'flash_sale',
        severity: this.calculateDealSeverity(offer.savings.percentage, 25, 35, 50, 70),
        title: `🔥 Flash Sale: ${offer.savings.percentage}% Off`,
        description: `Limited-time flash sale with ${offer.savings.percentage}% discount`,
        originalPrice: offer.price.amount / (1 - offer.savings.percentage / 100),
        currentPrice: offer.price.amount,
        savings: offer.savings,
        validUntil: offer.validUntil,
        conditions: ['Limited time offer', 'Subject to availability', 'May sell out quickly'],
        confidence: 85,
        rarity: 'rare',
        metadata: {
          flashSale: true,
          limitedQuantity: true
        }
      };
    }

    return null;
  }

  private async detectLastMinuteDeal(
    offer: any,
    serviceType: TravelServiceType
  ): Promise<Deal | null> {
    // Last-minute deal detection for imminent travel dates
    if (serviceType !== 'flight' && serviceType !== 'hotel') {
      return null; // Last-minute deals primarily for flights and hotels
    }

    const departureDate = offer.departureDate || offer.checkIn;
    if (!departureDate) return null;

    const daysUntilTravel = Math.ceil(
      (new Date(departureDate).getTime() - Date.now()) / (24 * 3600000)
    );

    // Last-minute threshold (within 7 days for flights, 3 days for hotels)
    const threshold = serviceType === 'flight' ? 7 : 3;
    
    if (daysUntilTravel <= threshold && daysUntilTravel > 0) {
      // Check if price is below average for this route/property
      const discountPercentage = offer.savings?.percentage || 0;
      
      if (discountPercentage >= 10) {
        return {
          id: `last_minute_${offer.id}_${Date.now()}`,
          serviceType,
          provider: offer.provider,
          offerId: offer.id,
          dealType: 'last_minute',
          severity: this.calculateDealSeverity(discountPercentage, 10, 20, 35, 50),
          title: `Last-Minute Deal: ${daysUntilTravel} Days Away`,
          description: `Save ${discountPercentage}% on ${serviceType} departing in ${daysUntilTravel} days`,
          originalPrice: offer.price.amount / (1 - discountPercentage / 100),
          currentPrice: offer.price.amount,
          savings: {
            amount: (offer.price.amount * discountPercentage) / (100 - discountPercentage),
            percentage: discountPercentage
          },
          conditions: ['Imminent departure', 'Limited availability', 'Non-refundable'],
          confidence: 75 + Math.min(20, discountPercentage),
          rarity: daysUntilTravel <= 1 ? 'ultra_rare' : 'rare',
          metadata: {
            lastMinute: true,
            limitedQuantity: true
          }
        };
      }
    }

    return null;
  }

  private async detectSeasonalSpecial(
    offer: any,
    serviceType: TravelServiceType
  ): Promise<Deal | null> {
    const now = new Date();
    const month = now.getMonth();
    
    // Define seasonal patterns
    const seasonalPatterns: Record<number, { name: string; discount: number; services: TravelServiceType[] }> = {
      0: { name: 'New Year Special', discount: 20, services: ['flight', 'hotel'] }, // January
      1: { name: 'Valentine\'s Special', discount: 15, services: ['hotel'] }, // February
      2: { name: 'Spring Break Early Bird', discount: 25, services: ['flight', 'hotel'] }, // March
      8: { name: 'Back to School Special', discount: 18, services: ['flight'] }, // September
      10: { name: 'Black Friday Travel', discount: 30, services: ['flight', 'hotel', 'car_rental'] }, // November
    };

    const pattern = seasonalPatterns[month];
    if (!pattern || !pattern.services.includes(serviceType)) {
      return null;
    }

    const discountPercentage = offer.savings?.percentage || 0;
    if (discountPercentage >= pattern.discount * 0.7) { // 70% of expected seasonal discount
      return {
        id: `seasonal_${offer.id}_${Date.now()}`,
        serviceType,
        provider: offer.provider,
        offerId: offer.id,
        dealType: 'seasonal_special',
        severity: this.calculateDealSeverity(discountPercentage, 15, 25, 35, 50),
        title: `${pattern.name}: ${discountPercentage}% Off`,
        description: `Special seasonal pricing for ${pattern.name.toLowerCase()}`,
        originalPrice: offer.price.amount / (1 - discountPercentage / 100),
        currentPrice: offer.price.amount,
        savings: {
          amount: (offer.price.amount * discountPercentage) / (100 - discountPercentage),
          percentage: discountPercentage
        },
        conditions: ['Seasonal offer', 'Limited time', 'Subject to availability'],
        confidence: 80,
        rarity: 'uncommon',
        metadata: {
          seasonalDiscount: true
        }
      };
    }

    return null;
  }

  private async detectErrorFare(
    offer: any,
    serviceType: TravelServiceType
  ): Promise<Deal | null> {
    // Error fare detection for extremely unusual pricing
    if (serviceType !== 'flight') return null; // Error fares primarily for flights

    const historyKey = this.generateHistoryKey(serviceType, offer.provider, offer.id);
    const history = this.priceHistoryStore.get(historyKey);

    if (!history || history.dataPoints.length < 14) {
      return null; // Need sufficient history for error fare detection
    }

    const currentPrice = offer.price.amount;
    const historicalAverage = history.statistics.averagePrice;
    const discountFromAverage = ((historicalAverage - currentPrice) / historicalAverage) * 100;

    // Error fare threshold: more than 70% below historical average
    if (discountFromAverage >= 70) {
      return {
        id: `error_fare_${offer.id}_${Date.now()}`,
        serviceType,
        provider: offer.provider,
        offerId: offer.id,
        dealType: 'error_fare',
        severity: 'exceptional',
        title: `🚨 Possible Error Fare: ${Math.round(discountFromAverage)}% Off`,
        description: `Extremely low price - possible error fare or mistake`,
        originalPrice: historicalAverage,
        currentPrice,
        savings: {
          amount: historicalAverage - currentPrice,
          percentage: discountFromAverage
        },
        conditions: [
          'Book immediately',
          'May be cancelled by airline',
          'Price likely to be corrected',
          'High risk of changes'
        ],
        confidence: 60, // Lower confidence due to risk
        rarity: 'ultra_rare',
        metadata: {
          historicalLow: true,
          limitedQuantity: true
        }
      };
    }

    return null;
  }

  private async detectCompetitorBeat(
    offer: any,
    comparison: PriceComparison
  ): Promise<Deal | null> {
    // Find the cheapest competitor price
    const sortedOffers = comparison.offers
      .filter(o => o.provider !== offer.provider)
      .sort((a, b) => a.price.amount - b.price.amount);

    if (sortedOffers.length === 0) return null;

    const cheapestCompetitor = sortedOffers[0];
    const priceDifference = cheapestCompetitor.price.amount - offer.price.amount;
    const percentageDifference = (priceDifference / cheapestCompetitor.price.amount) * 100;

    // Only flag if this offer is significantly cheaper than the next best
    if (percentageDifference >= 5) {
      return {
        id: `competitor_beat_${offer.id}_${Date.now()}`,
        serviceType: comparison.serviceType,
        provider: offer.provider,
        offerId: offer.id,
        dealType: 'competitor_beat',
        severity: this.calculateDealSeverity(percentageDifference, 5, 10, 20, 30),
        title: `Beats Competitors by ${Math.round(percentageDifference)}%`,
        description: `$${priceDifference.toFixed(2)} cheaper than next best option from ${cheapestCompetitor.provider}`,
        originalPrice: cheapestCompetitor.price.amount,
        currentPrice: offer.price.amount,
        savings: {
          amount: priceDifference,
          percentage: percentageDifference
        },
        conditions: ['Compare terms carefully', 'Check cancellation policies'],
        confidence: 85,
        rarity: percentageDifference > 15 ? 'rare' : 'uncommon',
        metadata: {
          competitorBeat: true
        }
      };
    }

    return null;
  }

  // ==================== UTILITY METHODS ====================

  private generateHistoryKey(serviceType: TravelServiceType, provider: string, route: string): string {
    return `${serviceType}_${provider}_${route}`;
  }

  private calculateDealSeverity(
    percentage: number,
    minor: number,
    moderate: number,
    significant: number,
    exceptional: number
  ): DealSeverity {
    if (percentage >= exceptional) return 'exceptional';
    if (percentage >= significant) return 'significant';
    if (percentage >= moderate) return 'moderate';
    return 'minor';
  }

  private calculateDealRarity(discountPercentage: number, volatility: number): DealRarity {
    // Higher discount + lower typical volatility = rarer deal
    const rarityScore = discountPercentage * (1 + (1 / Math.max(volatility, 0.1)));
    
    if (rarityScore >= 60) return 'ultra_rare';
    if (rarityScore >= 40) return 'rare';
    if (rarityScore >= 20) return 'uncommon';
    return 'common';
  }

  private deduplicateDeals(deals: Deal[]): Deal[] {
    const seen = new Set<string>();
    return deals.filter(deal => {
      const key = `${deal.serviceType}_${deal.provider}_${deal.offerId}_${deal.dealType}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // ==================== PRICE HISTORY MANAGEMENT ====================

  updatePriceHistory(
    serviceType: TravelServiceType,
    provider: string,
    route: string,
    price: number,
    currency: Currency,
    availability: boolean = true,
    demand: 'low' | 'medium' | 'high' = 'medium'
  ) {
    const historyKey = this.generateHistoryKey(serviceType, provider, route);
    let history = this.priceHistoryStore.get(historyKey);

    if (!history) {
      history = {
        serviceType,
        provider,
        route,
        currency,
        dataPoints: [],
        statistics: {
          minPrice: price,
          maxPrice: price,
          averagePrice: price,
          medianPrice: price,
          volatility: 0,
          trendDirection: 'stable',
          confidence: 50
        }
      };
    }

    // Add new data point
    history.dataPoints.push({
      timestamp: new Date(),
      price,
      availability,
      demand
    });

    // Keep only last 90 days of data
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 3600000);
    history.dataPoints = history.dataPoints.filter(dp => dp.timestamp >= ninetyDaysAgo);

    // Recalculate statistics
    this.recalculateStatistics(history);

    this.priceHistoryStore.set(historyKey, history);
  }

  private recalculateStatistics(history: PriceHistory) {
    const prices = history.dataPoints.map(dp => dp.price);
    const sortedPrices = [...prices].sort((a, b) => a - b);

    history.statistics.minPrice = Math.min(...prices);
    history.statistics.maxPrice = Math.max(...prices);
    history.statistics.averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    history.statistics.medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];

    // Calculate volatility (coefficient of variation)
    const variance = prices.reduce((sum, price) => 
      sum + Math.pow(price - history.statistics.averagePrice, 2), 0) / prices.length;
    const standardDeviation = Math.sqrt(variance);
    history.statistics.volatility = standardDeviation / history.statistics.averagePrice;

    // Calculate trend direction
    if (prices.length >= 7) {
      const recent = prices.slice(-7);
      const older = prices.slice(-14, -7);
      if (older.length > 0) {
        const recentAvg = recent.reduce((sum, p) => sum + p, 0) / recent.length;
        const olderAvg = older.reduce((sum, p) => sum + p, 0) / older.length;
        const change = (recentAvg - olderAvg) / olderAvg;
        
        if (change > 0.05) history.statistics.trendDirection = 'rising';
        else if (change < -0.05) history.statistics.trendDirection = 'falling';
        else history.statistics.trendDirection = 'stable';
      }
    }

    // Calculate confidence based on data quantity and recency
    const dataAge = history.dataPoints.length > 0 ? 
      (Date.now() - history.dataPoints[0].timestamp.getTime()) / (24 * 3600000) : 0;
    history.statistics.confidence = Math.min(95, 
      Math.max(30, 50 + (history.dataPoints.length * 2) - (dataAge / 10)));
  }

  // ==================== DEAL ALERTS ====================

  async createDealAlert(userId: string, deal: Deal): Promise<DealAlert> {
    const alert: DealAlert = {
      userId,
      dealId: deal.id,
      alertType: this.determineAlertType(deal),
      message: this.generateAlertMessage(deal),
      urgency: this.calculateUrgency(deal),
      createdAt: new Date(),
      expiresAt: deal.validUntil,
      acknowledged: false
    };

    // In production, save to database and send notification
    console.log(`🔔 Deal Alert for User ${userId}: ${alert.message}`);
    
    return alert;
  }

  private determineAlertType(deal: Deal): DealAlert['alertType'] {
    if (deal.dealType === 'price_drop') return 'price_drop';
    if (deal.validUntil && new Date(deal.validUntil).getTime() - Date.now() < 6 * 3600000) {
      return 'expiring_soon'; // Less than 6 hours
    }
    return 'new_deal';
  }

  private generateAlertMessage(deal: Deal): string {
    const emoji = deal.severity === 'exceptional' ? '🚨' : 
                  deal.severity === 'significant' ? '🔥' : '💰';
    
    return `${emoji} ${deal.title} - Save $${deal.savings.amount.toFixed(2)} (${deal.savings.percentage.toFixed(1)}%) on ${deal.serviceType} with ${deal.provider}`;
  }

  private calculateUrgency(deal: Deal): DealAlert['urgency'] {
    if (deal.severity === 'exceptional' || deal.dealType === 'error_fare') return 'critical';
    if (deal.severity === 'significant' || deal.rarity === 'ultra_rare') return 'high';
    if (deal.severity === 'moderate' || deal.rarity === 'rare') return 'medium';
    return 'low';
  }
}

// ==================== FACTORY FUNCTION ====================

export function createDealIdentificationEngine(): DealIdentificationEngine {
  return new DealIdentificationEngine();
}

// ==================== INTEGRATION HELPERS ====================

export interface DealAnalysisResult {
  deals: Deal[];
  alerts: DealAlert[];
  insights: {
    totalDealsFound: number;
    bestDeal: Deal | null;
    averageSavings: number;
    rareDealsCount: number;
    recommendedActions: string[];
  };
}

export async function analyzePriceComparisonsForDeals(
  comparisons: PriceComparison[],
  userId?: string
): Promise<DealAnalysisResult> {
  const engine = createDealIdentificationEngine();
  const deals = await engine.identifyDeals(comparisons);
  
  const alerts = userId ? 
    await Promise.all(deals.slice(0, 5).map(deal => engine.createDealAlert(userId, deal))) : [];
  
  const bestDeal = deals.length > 0 ? 
    deals.reduce((best, deal) => deal.savings.percentage > best.savings.percentage ? deal : best) : null;
  
  const averageSavings = deals.length > 0 ?
    deals.reduce((sum, deal) => sum + deal.savings.percentage, 0) / deals.length : 0;
  
  const rareDealsCount = deals.filter(deal => 
    deal.rarity === 'rare' || deal.rarity === 'ultra_rare').length;
  
  const recommendedActions = [];
  if (bestDeal) {
    recommendedActions.push(`Book the ${bestDeal.dealType} deal with ${bestDeal.provider} ASAP`);
  }
  if (rareDealsCount > 0) {
    recommendedActions.push(`${rareDealsCount} rare deals found - act quickly`);
  }
  if (deals.some(deal => deal.dealType === 'error_fare')) {
    recommendedActions.push('Error fare detected - book immediately before correction');
  }

  return {
    deals,
    alerts,
    insights: {
      totalDealsFound: deals.length,
      bestDeal,
      averageSavings,
      rareDealsCount,
      recommendedActions
    }
  };
}