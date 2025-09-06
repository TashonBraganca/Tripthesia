'use client';

// Price Comparison Engine - Phase 10 Advanced Features
// Real-time price monitoring and comparison across multiple providers

interface PricePoint {
  timestamp: Date;
  price: number;
  currency: string;
  providerId: string;
  availability: boolean;
  metadata: {
    source: string;
    confidence: number; // 0-1 confidence in price accuracy
    fees: number;
    taxes: number;
    originalPrice?: number;
  };
}

interface PriceHistory {
  itemId: string;
  itemType: 'flight' | 'hotel' | 'car' | 'activity';
  searchCriteria: any;
  history: PricePoint[];
  statistics: {
    minPrice: number;
    maxPrice: number;
    avgPrice: number;
    medianPrice: number;
    priceVolatility: number;
    trendDirection: 'up' | 'down' | 'stable';
    trendStrength: number; // 0-1
  };
  predictions: {
    nextWeek: { min: number; max: number; avg: number; confidence: number };
    nextMonth: { min: number; max: number; avg: number; confidence: number };
    bestTimeToBook: Date;
    priceAlerts: {
      targetPrice: number;
      likelihood: number;
      estimatedDate?: Date;
    }[];
  };
}

interface ComparisonResult {
  itemId: string;
  providers: {
    id: string;
    name: string;
    currentPrice: number;
    lastUpdated: Date;
    availability: boolean;
    priceChange: {
      amount: number;
      percentage: number;
      since: 'hour' | 'day' | 'week';
    };
    features: {
      refundable: boolean;
      freeCancellation: boolean;
      instantConfirmation: boolean;
      loyaltyPoints: boolean;
    };
    rating: {
      score: number;
      reviews: number;
      trustScore: number;
    };
    deepLink: string;
  }[];
  bestDeals: {
    cheapest: string; // providerId
    bestValue: string; // price vs features
    mostReliable: string; // trust score
  };
  priceInsights: {
    isGoodDeal: boolean;
    savingsPercent: number;
    pricePosition: 'low' | 'average' | 'high';
    marketAverage: number;
    recommendation: string;
  };
  alerts: {
    type: 'price_drop' | 'price_spike' | 'availability_low' | 'deal_ending';
    message: string;
    urgency: 'low' | 'medium' | 'high';
    expiresAt?: Date;
  }[];
}

interface PriceAlert {
  id: string;
  userId: string;
  itemId: string;
  targetPrice: number;
  currency: string;
  condition: 'below' | 'above' | 'drops_by' | 'rises_by';
  value: number;
  isActive: boolean;
  createdAt: Date;
  triggeredAt?: Date;
  notificationMethods: ('email' | 'push' | 'sms')[];
}

interface MarketData {
  segment: string; // e.g., "US-EU flights", "NYC hotels"
  timeframe: 'hourly' | 'daily' | 'weekly' | 'monthly';
  data: {
    timestamp: Date;
    avgPrice: number;
    volume: number;
    volatility: number;
    seasonalIndex: number;
    demandIndex: number;
    competitionIndex: number;
  }[];
}

class PriceComparisonEngine {
  private priceHistory = new Map<string, PriceHistory>();
  private activeAlerts = new Map<string, PriceAlert[]>();
  private marketData = new Map<string, MarketData>();
  private monitoringIntervals = new Map<string, NodeJS.Timeout>();
  private updateQueue: string[] = [];
  private isProcessing = false;

  constructor() {
    this.startPriceMonitoring();
    console.log('💰 Price Comparison Engine initialized');
  }

  // Main comparison method
  async comparePrices(
    itemId: string,
    itemType: 'flight' | 'hotel' | 'car' | 'activity',
    searchCriteria: any,
    forceRefresh = false
  ): Promise<ComparisonResult> {
    try {
      // Get or create price history
      let history = this.priceHistory.get(itemId);
      if (!history || forceRefresh) {
        history = await this.initializePriceHistory(itemId, itemType, searchCriteria);
        this.priceHistory.set(itemId, history);
      }

      // Fetch current prices from all providers
      const currentPrices = await this.fetchCurrentPrices(itemType, searchCriteria);
      
      // Update price history
      await this.updatePriceHistory(itemId, currentPrices);
      
      // Generate comparison result
      const comparison = this.generateComparison(itemId, currentPrices, history);
      
      // Check for price alerts
      await this.checkPriceAlerts(itemId, currentPrices);

      return comparison;

    } catch (error) {
      console.error('Price comparison failed:', error);
      throw error;
    }
  }

  private async initializePriceHistory(
    itemId: string,
    itemType: 'flight' | 'hotel' | 'car' | 'activity',
    searchCriteria: any
  ): Promise<PriceHistory> {
    // Initialize with mock historical data
    const history: PricePoint[] = [];
    const basePrice = this.estimateBasePrice(itemType, searchCriteria);
    
    // Generate 30 days of mock historical data
    for (let i = 30; i >= 0; i--) {
      const timestamp = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const seasonalFactor = this.getSeasonalFactor(timestamp, searchCriteria);
      const demandFactor = this.getDemandFactor(timestamp, searchCriteria);
      const randomFactor = 0.9 + Math.random() * 0.2; // ±10% random variation
      
      const price = Math.round(basePrice * seasonalFactor * demandFactor * randomFactor);
      
      // Add multiple provider data points
      const providers = ['provider_a', 'provider_b', 'provider_c'];
      providers.forEach((providerId, index) => {
        const providerVariation = 0.95 + (index * 0.025) + (Math.random() * 0.05);
        history.push({
          timestamp,
          price: Math.round(price * providerVariation),
          currency: 'USD',
          providerId,
          availability: Math.random() > 0.1, // 90% availability
          metadata: {
            source: 'historical',
            confidence: 0.8 + Math.random() * 0.2,
            fees: Math.round(price * 0.05),
            taxes: Math.round(price * 0.12),
          },
        });
      });
    }

    // Calculate statistics
    const prices = history.map(h => h.price);
    const statistics = {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      avgPrice: prices.reduce((sum, p) => sum + p, 0) / prices.length,
      medianPrice: this.calculateMedian(prices),
      priceVolatility: this.calculateVolatility(prices),
      trendDirection: this.calculateTrend(prices),
      trendStrength: this.calculateTrendStrength(prices),
    };

    // Generate predictions
    const predictions = this.generatePricePredictions(history, statistics);

    return {
      itemId,
      itemType,
      searchCriteria,
      history,
      statistics,
      predictions,
    };
  }

  private async fetchCurrentPrices(
    itemType: 'flight' | 'hotel' | 'car' | 'activity',
    searchCriteria: any
  ): Promise<PricePoint[]> {
    // Simulate fetching from multiple providers
    const providers = [
      { id: 'amadeus', name: 'Amadeus', multiplier: 1.0 },
      { id: 'expedia', name: 'Expedia', multiplier: 1.05 },
      { id: 'booking', name: 'Booking.com', multiplier: 0.98 },
      { id: 'priceline', name: 'Priceline', multiplier: 1.02 },
      { id: 'kayak', name: 'Kayak', multiplier: 0.96 },
    ];

    const basePrice = this.estimateBasePrice(itemType, searchCriteria);
    const currentPrices: PricePoint[] = [];
    const now = new Date();

    for (const provider of providers) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
      
      const marketFactor = 0.95 + Math.random() * 0.1;
      const providerFactor = provider.multiplier * (0.98 + Math.random() * 0.04);
      const price = Math.round(basePrice * marketFactor * providerFactor);

      currentPrices.push({
        timestamp: now,
        price,
        currency: 'USD',
        providerId: provider.id,
        availability: Math.random() > 0.05, // 95% availability
        metadata: {
          source: 'api',
          confidence: 0.9 + Math.random() * 0.1,
          fees: Math.round(price * 0.03),
          taxes: Math.round(price * 0.10),
        },
      });
    }

    return currentPrices;
  }

  private async updatePriceHistory(itemId: string, newPrices: PricePoint[]): Promise<void> {
    const history = this.priceHistory.get(itemId);
    if (!history) return;

    // Add new price points
    history.history.push(...newPrices);

    // Keep only last 90 days of data
    const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    history.history = history.history.filter(h => h.timestamp >= cutoffDate);

    // Recalculate statistics
    const prices = history.history.map(h => h.price);
    history.statistics = {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      avgPrice: prices.reduce((sum, p) => sum + p, 0) / prices.length,
      medianPrice: this.calculateMedian(prices),
      priceVolatility: this.calculateVolatility(prices),
      trendDirection: this.calculateTrend(prices),
      trendStrength: this.calculateTrendStrength(prices),
    };

    // Update predictions
    history.predictions = this.generatePricePredictions(history.history, history.statistics);
  }

  private generateComparison(
    itemId: string,
    currentPrices: PricePoint[],
    history: PriceHistory
  ): ComparisonResult {
    // Group prices by provider
    const providerPrices = new Map<string, PricePoint>();
    currentPrices.forEach(price => {
      if (!providerPrices.has(price.providerId) || 
          price.timestamp > providerPrices.get(price.providerId)!.timestamp) {
        providerPrices.set(price.providerId, price);
      }
    });

    // Create provider comparisons
    const providers = Array.from(providerPrices.entries()).map(([providerId, pricePoint]) => {
      const pastPrices = history.history
        .filter(h => h.providerId === providerId)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      let priceChange = { amount: 0, percentage: 0, since: 'day' as const };
      if (pastPrices.length > 0) {
        const dayAgo = pastPrices.find(p => 
          p.timestamp >= new Date(Date.now() - 24 * 60 * 60 * 1000)
        );
        if (dayAgo) {
          priceChange.amount = pricePoint.price - dayAgo.price;
          priceChange.percentage = (priceChange.amount / dayAgo.price) * 100;
        }
      }

      return {
        id: providerId,
        name: this.getProviderName(providerId),
        currentPrice: pricePoint.price,
        lastUpdated: pricePoint.timestamp,
        availability: pricePoint.availability,
        priceChange,
        features: this.getProviderFeatures(providerId),
        rating: this.getProviderRating(providerId),
        deepLink: `https://${providerId}.com/book?item=${itemId}`,
      };
    });

    // Find best deals
    const cheapest = providers.reduce((min, p) => 
      p.currentPrice < min.currentPrice ? p : min
    ).id;
    
    const bestValue = providers.reduce((best, p) => {
      const valueScore = p.rating.score / (p.currentPrice / 100);
      const bestValueScore = best.rating.score / (best.currentPrice / 100);
      return valueScore > bestValueScore ? p : best;
    }).id;

    const mostReliable = providers.reduce((best, p) => 
      p.rating.trustScore > best.rating.trustScore ? p : best
    ).id;

    // Generate price insights
    const currentPriceValues = providers.map(p => p.currentPrice);
    const marketAverage = currentPriceValues.reduce((sum, p) => sum + p, 0) / currentPriceValues.length;
    const minCurrentPrice = Math.min(...currentPriceValues);
    
    const savingsPercent = ((marketAverage - minCurrentPrice) / marketAverage) * 100;
    const isGoodDeal = minCurrentPrice < history.statistics.avgPrice * 0.9;
    
    let pricePosition: 'low' | 'average' | 'high' = 'average';
    if (minCurrentPrice < history.statistics.avgPrice * 0.85) pricePosition = 'low';
    else if (minCurrentPrice > history.statistics.avgPrice * 1.15) pricePosition = 'high';

    const recommendation = this.generatePriceRecommendation(
      minCurrentPrice, 
      history.statistics, 
      history.predictions
    );

    // Generate alerts
    const alerts = this.generatePriceAlerts(currentPrices, history);

    return {
      itemId,
      providers,
      bestDeals: { cheapest, bestValue, mostReliable },
      priceInsights: {
        isGoodDeal,
        savingsPercent: Math.round(savingsPercent),
        pricePosition,
        marketAverage: Math.round(marketAverage),
        recommendation,
      },
      alerts,
    };
  }

  private generatePricePredictions(
    history: PricePoint[],
    statistics: PriceHistory['statistics']
  ): PriceHistory['predictions'] {
    // Simple trend-based prediction
    const recentPrices = history
      .filter(h => h.timestamp >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .map(h => h.price);

    const trend = recentPrices.length > 1 ? 
      (recentPrices[recentPrices.length - 1] - recentPrices[0]) / recentPrices.length : 0;

    const basePrice = statistics.avgPrice;
    const volatility = statistics.priceVolatility;

    return {
      nextWeek: {
        min: Math.round(basePrice + (trend * 7) - (volatility * 0.5)),
        max: Math.round(basePrice + (trend * 7) + (volatility * 0.5)),
        avg: Math.round(basePrice + (trend * 7)),
        confidence: Math.max(0.3, 1 - (volatility / basePrice)),
      },
      nextMonth: {
        min: Math.round(basePrice + (trend * 30) - (volatility * 1.5)),
        max: Math.round(basePrice + (trend * 30) + (volatility * 1.5)),
        avg: Math.round(basePrice + (trend * 30)),
        confidence: Math.max(0.2, 0.8 - (volatility / basePrice)),
      },
      bestTimeToBook: new Date(Date.now() + (trend < 0 ? 7 : 3) * 24 * 60 * 60 * 1000),
      priceAlerts: [
        {
          targetPrice: Math.round(statistics.minPrice * 1.05),
          likelihood: 0.3,
          estimatedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      ],
    };
  }

  // Helper methods for calculations
  private calculateMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
    return Math.sqrt(variance);
  }

  private calculateTrend(prices: number[]): 'up' | 'down' | 'stable' {
    if (prices.length < 2) return 'stable';
    
    const firstHalf = prices.slice(0, Math.floor(prices.length / 2));
    const secondHalf = prices.slice(Math.floor(prices.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, p) => sum + p, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, p) => sum + p, 0) / secondHalf.length;
    
    const diff = (secondAvg - firstAvg) / firstAvg;
    
    if (diff > 0.05) return 'up';
    if (diff < -0.05) return 'down';
    return 'stable';
  }

  private calculateTrendStrength(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    // Calculate R² for linear regression
    const n = prices.length;
    const xValues = Array.from({ length: n }, (_, i) => i);
    const yValues = prices;
    
    const xMean = (n - 1) / 2;
    const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
      denominator += Math.pow(xValues[i] - xMean, 2);
    }
    
    if (denominator === 0) return 0;
    
    const slope = numerator / denominator;
    const intercept = yMean - slope * xMean;
    
    let ssRes = 0;
    let ssTot = 0;
    
    for (let i = 0; i < n; i++) {
      const predicted = slope * i + intercept;
      ssRes += Math.pow(yValues[i] - predicted, 2);
      ssTot += Math.pow(yValues[i] - yMean, 2);
    }
    
    return ssTot === 0 ? 0 : Math.max(0, 1 - ssRes / ssTot);
  }

  private estimateBasePrice(
    itemType: 'flight' | 'hotel' | 'car' | 'activity',
    searchCriteria: any
  ): number {
    // Simple base price estimation
    switch (itemType) {
      case 'flight':
        return 400 + Math.random() * 600;
      case 'hotel':
        return 120 + Math.random() * 280;
      case 'car':
        return 45 + Math.random() * 80;
      case 'activity':
        return 65 + Math.random() * 135;
      default:
        return 100;
    }
  }

  private getSeasonalFactor(timestamp: Date, searchCriteria: any): number {
    // Simple seasonal adjustment
    const month = timestamp.getMonth();
    const summerMonths = [5, 6, 7]; // June, July, August
    const winterHolidays = [11, 0]; // December, January
    
    if (summerMonths.includes(month)) return 1.2;
    if (winterHolidays.includes(month)) return 1.15;
    return 0.95 + Math.random() * 0.1;
  }

  private getDemandFactor(timestamp: Date, searchCriteria: any): number {
    // Weekend vs weekday demand
    const dayOfWeek = timestamp.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    return isWeekend ? 1.1 : 0.95 + Math.random() * 0.1;
  }

  private getProviderName(providerId: string): string {
    const names: Record<string, string> = {
      amadeus: 'Amadeus',
      expedia: 'Expedia',
      booking: 'Booking.com',
      priceline: 'Priceline',
      kayak: 'Kayak',
    };
    return names[providerId] || providerId;
  }

  private getProviderFeatures(providerId: string) {
    // Mock provider features
    return {
      refundable: Math.random() > 0.3,
      freeCancellation: Math.random() > 0.4,
      instantConfirmation: Math.random() > 0.2,
      loyaltyPoints: Math.random() > 0.5,
    };
  }

  private getProviderRating(providerId: string) {
    // Mock provider ratings
    return {
      score: 3.5 + Math.random() * 1.5,
      reviews: Math.floor(100 + Math.random() * 9900),
      trustScore: 0.7 + Math.random() * 0.3,
    };
  }

  private generatePriceRecommendation(
    currentPrice: number,
    statistics: PriceHistory['statistics'],
    predictions: PriceHistory['predictions']
  ): string {
    if (currentPrice <= statistics.minPrice * 1.1) {
      return "Excellent deal! This is one of the lowest prices we've seen.";
    }
    
    if (currentPrice <= statistics.avgPrice * 0.9) {
      return "Good price! Below average for this route.";
    }
    
    if (predictions.nextWeek.avg < currentPrice) {
      return "Consider waiting - prices may drop next week.";
    }
    
    if (statistics.trendDirection === 'up') {
      return "Prices are trending up - book soon to avoid increases.";
    }
    
    return "Fair price for this route. Monitor for better deals.";
  }

  private generatePriceAlerts(
    currentPrices: PricePoint[],
    history: PriceHistory
  ): ComparisonResult['alerts'] {
    const alerts: ComparisonResult['alerts'] = [];
    const minCurrentPrice = Math.min(...currentPrices.map(p => p.price));
    
    // Price drop alert
    if (minCurrentPrice < history.statistics.avgPrice * 0.85) {
      alerts.push({
        type: 'price_drop',
        message: `Price dropped ${Math.round(((history.statistics.avgPrice - minCurrentPrice) / history.statistics.avgPrice) * 100)}% below average!`,
        urgency: 'high',
      });
    }
    
    // Availability alert
    const availableOptions = currentPrices.filter(p => p.availability).length;
    if (availableOptions <= 2) {
      alerts.push({
        type: 'availability_low',
        message: `Only ${availableOptions} options remaining at these prices.`,
        urgency: 'medium',
      });
    }
    
    // Trending up alert
    if (history.statistics.trendDirection === 'up' && history.statistics.trendStrength > 0.6) {
      alerts.push({
        type: 'price_spike',
        message: 'Prices are trending upward. Consider booking soon.',
        urgency: 'medium',
      });
    }

    return alerts;
  }

  private async checkPriceAlerts(itemId: string, currentPrices: PricePoint[]): Promise<void> {
    // Implementation for user-specific price alerts would go here
    // For now, just log that we're checking
    console.log(`🔔 Checking price alerts for ${itemId}`);
  }

  private startPriceMonitoring(): void {
    // Start background price monitoring
    const monitoringInterval = setInterval(() => {
      this.processUpdateQueue();
    }, 60000); // Every minute

    this.monitoringIntervals.set('main', monitoringInterval);
    console.log('📊 Price monitoring started');
  }

  private async processUpdateQueue(): Promise<void> {
    if (this.isProcessing || this.updateQueue.length === 0) return;

    this.isProcessing = true;
    const itemsToUpdate = this.updateQueue.splice(0, 5); // Process 5 items at a time

    try {
      for (const itemId of itemsToUpdate) {
        const history = this.priceHistory.get(itemId);
        if (history) {
          await this.comparePrices(itemId, history.itemType, history.searchCriteria, true);
        }
      }
    } catch (error) {
      console.error('Price monitoring update failed:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Public methods
  async addPriceAlert(alert: Omit<PriceAlert, 'id' | 'createdAt'>): Promise<string> {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullAlert: PriceAlert = {
      ...alert,
      id: alertId,
      createdAt: new Date(),
    };

    if (!this.activeAlerts.has(alert.userId)) {
      this.activeAlerts.set(alert.userId, []);
    }
    this.activeAlerts.get(alert.userId)!.push(fullAlert);

    // Add item to monitoring queue if not already monitored
    if (!this.updateQueue.includes(alert.itemId)) {
      this.updateQueue.push(alert.itemId);
    }

    console.log(`🔔 Price alert created: ${alertId}`);
    return alertId;
  }

  getPriceHistory(itemId: string): PriceHistory | undefined {
    return this.priceHistory.get(itemId);
  }

  getSystemStats(): {
    itemsMonitored: number;
    activeAlerts: number;
    pricePointsStored: number;
    lastUpdate: Date;
  } {
    const totalPricePoints = Array.from(this.priceHistory.values())
      .reduce((sum, history) => sum + history.history.length, 0);
    
    const totalAlerts = Array.from(this.activeAlerts.values())
      .reduce((sum, alerts) => sum + alerts.filter(a => a.isActive).length, 0);

    return {
      itemsMonitored: this.priceHistory.size,
      activeAlerts: totalAlerts,
      pricePointsStored: totalPricePoints,
      lastUpdate: new Date(),
    };
  }

  destroy(): void {
    // Cleanup intervals
    this.monitoringIntervals.forEach(interval => clearInterval(interval));
    this.monitoringIntervals.clear();
    
    console.log('🛑 Price Comparison Engine destroyed');
  }
}

// Singleton instance
const priceComparisonEngine = new PriceComparisonEngine();

export { priceComparisonEngine, PriceComparisonEngine };
export type { 
  PricePoint, 
  PriceHistory, 
  ComparisonResult, 
  PriceAlert, 
  MarketData 
};