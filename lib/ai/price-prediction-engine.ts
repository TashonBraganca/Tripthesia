'use client';

// Smart Price Prediction Engine - Phase 10 Platform Evolution
// Historical data analysis for optimal booking timing and price forecasting

export interface PricePoint {
  date: Date;
  price: number;
  currency: string;
  source: string;
  route?: {
    from: string;
    to: string;
    stops?: number;
  };
  metadata: {
    airline?: string;
    hotel_category?: string;
    booking_class?: string;
    advance_booking_days: number;
    seasonality_factor: number;
    demand_level: 'low' | 'medium' | 'high' | 'peak';
    supply_constraints?: string[];
  };
}

export interface PricePrediction {
  predicted_price: number;
  confidence: number; // 0-1
  price_range: {
    optimistic: number;
    realistic: number;
    pessimistic: number;
  };
  trend: 'rising' | 'falling' | 'stable';
  trend_strength: number; // 0-1
  factors: PriceFactor[];
  optimal_booking_window: {
    start_days: number;
    end_days: number;
    reason: string;
  };
  historical_comparison: {
    vs_last_year: number; // percentage change
    vs_average: number;
    percentile: number; // 0-100
  };
  alerts: PriceAlert[];
}

export interface PriceFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  strength: number; // 0-1
  description: string;
  confidence: number; // 0-1
}

export interface PriceAlert {
  type: 'price_drop' | 'price_spike' | 'booking_deadline' | 'seasonal_change' | 'event_impact';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  action_required: boolean;
  deadline?: Date;
  estimated_savings?: number;
}

export interface MarketAnalysis {
  route_id: string;
  analysis_date: Date;
  demand_forecast: {
    current_level: number; // 0-1
    predicted_level: number;
    peak_periods: DateRange[];
    low_periods: DateRange[];
  };
  supply_analysis: {
    carrier_count: number;
    capacity_utilization: number;
    new_routes: string[];
    cancelled_routes: string[];
  };
  external_factors: ExternalFactor[];
  competitive_landscape: CompetitorAnalysis[];
}

export interface DateRange {
  start: Date;
  end: Date;
  reason: string;
}

export interface ExternalFactor {
  type: 'weather' | 'events' | 'holidays' | 'economic' | 'political' | 'health';
  impact: 'positive' | 'negative' | 'neutral';
  strength: number;
  description: string;
  duration: DateRange;
}

export interface CompetitorAnalysis {
  competitor: string;
  market_share: number;
  price_positioning: 'budget' | 'mid_range' | 'premium';
  recent_changes: string[];
  competitive_response_likelihood: number;
}

export interface BookingRecommendation {
  action: 'book_now' | 'wait' | 'monitor' | 'consider_alternatives';
  confidence: number;
  reasoning: string[];
  potential_savings: number;
  risk_assessment: {
    price_increase_probability: number;
    availability_risk: number;
    alternative_options: number;
  };
  monitoring_schedule: {
    check_frequency: 'daily' | 'weekly' | 'bi_weekly';
    key_dates: Date[];
    stop_monitoring_date: Date;
  };
}

export interface PricingModel {
  model_id: string;
  model_type: 'linear_regression' | 'random_forest' | 'neural_network' | 'ensemble';
  accuracy_metrics: {
    mae: number; // Mean Absolute Error
    rmse: number; // Root Mean Square Error
    mape: number; // Mean Absolute Percentage Error
    r_squared: number;
  };
  training_data: {
    start_date: Date;
    end_date: Date;
    sample_count: number;
    features_used: string[];
  };
  last_updated: Date;
  version: string;
}

class PricePredictionEngine {
  private priceHistory: Map<string, PricePoint[]> = new Map();
  private predictionModels: Map<string, PricingModel> = new Map();
  private marketAnalyses: Map<string, MarketAnalysis> = new Map();
  private externalDataSources: Map<string, any> = new Map();

  constructor() {
    this.initializeEngine();
  }

  async predictPrice(
    route: string,
    departureDate: Date,
    bookingDate: Date = new Date(),
    options: {
      service_type?: 'flight' | 'hotel' | 'car_rental';
      class_type?: string;
      flexibility?: number; // days
      group_size?: number;
    } = {}
  ): Promise<PricePrediction> {
    try {
      // Get historical data
      const historicalData = await this.getHistoricalData(route, options);
      
      // Calculate advance booking days
      const advanceBookingDays = Math.floor(
        (departureDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Get market analysis
      const marketAnalysis = await this.getMarketAnalysis(route);
      
      // Apply prediction models
      const modelPredictions = await this.applyPredictionModels(
        route,
        departureDate,
        advanceBookingDays,
        historicalData,
        marketAnalysis
      );
      
      // Calculate seasonality factors
      const seasonalityFactor = this.calculateSeasonalityFactor(
        departureDate,
        historicalData
      );
      
      // Analyze external factors
      const externalFactors = await this.analyzeExternalFactors(
        route,
        departureDate
      );
      
      // Generate price factors
      const priceFactors = this.generatePriceFactors(
        advanceBookingDays,
        seasonalityFactor,
        externalFactors,
        marketAnalysis
      );
      
      // Calculate final prediction
      const basePrediction = this.calculateWeightedPrediction(modelPredictions);
      const adjustedPrediction = this.applyFactorAdjustments(
        basePrediction,
        priceFactors
      );
      
      // Determine optimal booking window
      const optimalWindow = await this.calculateOptimalBookingWindow(
        route,
        departureDate,
        historicalData
      );
      
      // Generate alerts
      const alerts = this.generatePriceAlerts(
        adjustedPrediction,
        priceFactors,
        optimalWindow,
        advanceBookingDays
      );
      
      // Calculate historical comparison
      const historicalComparison = this.calculateHistoricalComparison(
        adjustedPrediction.predicted_price,
        departureDate,
        historicalData
      );
      
      return {
        predicted_price: adjustedPrediction.predicted_price,
        confidence: adjustedPrediction.confidence,
        price_range: {
          optimistic: adjustedPrediction.predicted_price * 0.85,
          realistic: adjustedPrediction.predicted_price,
          pessimistic: adjustedPrediction.predicted_price * 1.25,
        },
        trend: this.determinePriceTrend(historicalData, priceFactors),
        trend_strength: this.calculateTrendStrength(priceFactors),
        factors: priceFactors,
        optimal_booking_window: optimalWindow,
        historical_comparison: historicalComparison,
        alerts,
      };
      
    } catch (error) {
      console.error('Price prediction failed:', error);
      throw new Error('Failed to predict price');
    }
  }

  async getBookingRecommendation(
    prediction: PricePrediction,
    userPreferences: {
      risk_tolerance: number; // 0-1
      budget_flexibility: number; // 0-1
      date_flexibility: number; // days
    }
  ): Promise<BookingRecommendation> {
    const currentAdvanceDays = prediction.optimal_booking_window.start_days;
    const riskAssessment = this.assessBookingRisk(prediction, userPreferences);
    
    let action: BookingRecommendation['action'] = 'monitor';
    let reasoning: string[] = [];
    let potentialSavings = 0;
    
    // Determine recommendation based on multiple factors
    if (prediction.trend === 'rising' && prediction.trend_strength > 0.7) {
      action = 'book_now';
      reasoning.push('Prices are rising strongly - book now to avoid higher costs');
    } else if (prediction.trend === 'falling' && prediction.trend_strength > 0.5) {
      action = 'wait';
      reasoning.push('Prices are expected to fall - wait for better deals');
      potentialSavings = prediction.predicted_price * 0.1; // Estimate 10% savings
    } else if (currentAdvanceDays < prediction.optimal_booking_window.start_days) {
      action = 'wait';
      reasoning.push(`Wait ${prediction.optimal_booking_window.start_days - currentAdvanceDays} more days for optimal booking window`);
    } else if (currentAdvanceDays > prediction.optimal_booking_window.end_days) {
      action = 'book_now';
      reasoning.push('Past optimal booking window - prices likely to increase');
    }
    
    // Adjust based on user risk tolerance
    if (userPreferences.risk_tolerance < 0.3 && action === 'wait') {
      action = 'book_now';
      reasoning.push('Low risk tolerance - recommend booking for price certainty');
    }
    
    // Check for high-impact alerts
    const criticalAlerts = prediction.alerts.filter(alert => 
      alert.severity === 'critical' || alert.severity === 'high'
    );
    if (criticalAlerts.length > 0) {
      action = 'book_now';
      reasoning.push('Critical price alerts detected - immediate action recommended');
    }
    
    return {
      action,
      confidence: this.calculateRecommendationConfidence(prediction, userPreferences),
      reasoning,
      potential_savings: potentialSavings,
      risk_assessment: riskAssessment,
      monitoring_schedule: this.generateMonitoringSchedule(prediction, action),
    };
  }

  async trackPriceHistory(pricePoint: PricePoint): Promise<void> {
    const routeKey = this.generateRouteKey(pricePoint);
    
    if (!this.priceHistory.has(routeKey)) {
      this.priceHistory.set(routeKey, []);
    }
    
    const history = this.priceHistory.get(routeKey)!;
    history.push(pricePoint);
    
    // Keep only recent data (last 2 years)
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    
    this.priceHistory.set(
      routeKey,
      history.filter(point => point.date >= twoYearsAgo)
    );
    
    // Update models if we have enough data
    if (history.length > 100) {
      await this.updatePredictionModel(routeKey, history);
    }
  }

  async analyzeMarketTrends(
    routes: string[],
    timeframe: { start: Date; end: Date }
  ): Promise<Map<string, MarketAnalysis>> {
    const analyses = new Map<string, MarketAnalysis>();
    
    for (const route of routes) {
      const historicalData = await this.getHistoricalData(route);
      const analysis = await this.performMarketAnalysis(route, historicalData, timeframe);
      analyses.set(route, analysis);
    }
    
    return analyses;
  }

  private async getHistoricalData(
    route: string,
    options: any = {}
  ): Promise<PricePoint[]> {
    const routeKey = this.generateRouteKey({ route, ...options });
    return this.priceHistory.get(routeKey) || [];
  }

  private async getMarketAnalysis(route: string): Promise<MarketAnalysis> {
    return this.marketAnalyses.get(route) || this.createDefaultMarketAnalysis(route);
  }

  private async applyPredictionModels(
    route: string,
    departureDate: Date,
    advanceBookingDays: number,
    historicalData: PricePoint[],
    marketAnalysis: MarketAnalysis
  ): Promise<Array<{ model: string; prediction: number; confidence: number }>> {
    const predictions: Array<{ model: string; prediction: number; confidence: number }> = [];
    
    // Linear regression model
    const linearPrediction = this.applyLinearRegression(
      historicalData,
      advanceBookingDays
    );
    predictions.push({
      model: 'linear_regression',
      prediction: linearPrediction.price,
      confidence: linearPrediction.confidence,
    });
    
    // Seasonal decomposition model
    const seasonalPrediction = this.applySeasonalModel(
      historicalData,
      departureDate
    );
    predictions.push({
      model: 'seasonal',
      prediction: seasonalPrediction.price,
      confidence: seasonalPrediction.confidence,
    });
    
    // Market-based model
    const marketPrediction = this.applyMarketModel(
      historicalData,
      marketAnalysis
    );
    predictions.push({
      model: 'market_based',
      prediction: marketPrediction.price,
      confidence: marketPrediction.confidence,
    });
    
    return predictions;
  }

  private applyLinearRegression(
    data: PricePoint[],
    advanceBookingDays: number
  ): { price: number; confidence: number } {
    if (data.length < 10) {
      return { price: 0, confidence: 0 };
    }
    
    // Simple linear regression implementation
    const x = data.map(point => point.metadata.advance_booking_days);
    const y = data.map(point => point.price);
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const predictedPrice = slope * advanceBookingDays + intercept;
    
    // Calculate R-squared for confidence
    const yMean = sumY / n;
    const ssRes = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);
    
    return {
      price: Math.max(0, predictedPrice),
      confidence: Math.max(0, Math.min(1, rSquared)),
    };
  }

  private applySeasonalModel(
    data: PricePoint[],
    departureDate: Date
  ): { price: number; confidence: number } {
    // Group data by month
    const monthlyData = new Map<number, number[]>();
    
    data.forEach(point => {
      const month = point.date.getMonth();
      if (!monthlyData.has(month)) {
        monthlyData.set(month, []);
      }
      monthlyData.get(month)!.push(point.price);
    });
    
    const targetMonth = departureDate.getMonth();
    const monthData = monthlyData.get(targetMonth) || [];
    
    if (monthData.length === 0) {
      return { price: 0, confidence: 0 };
    }
    
    const averagePrice = monthData.reduce((a, b) => a + b, 0) / monthData.length;
    const confidence = Math.min(1, monthData.length / 10); // More data = higher confidence
    
    return { price: averagePrice, confidence };
  }

  private applyMarketModel(
    data: PricePoint[],
    marketAnalysis: MarketAnalysis
  ): { price: number; confidence: number } {
    if (data.length === 0) {
      return { price: 0, confidence: 0 };
    }
    
    // Calculate base price from recent data
    const recentData = data.slice(-30); // Last 30 data points
    const basePrice = recentData.reduce((sum, point) => sum + point.price, 0) / recentData.length;
    
    // Apply market factors
    let adjustedPrice = basePrice;
    let confidence = 0.7;
    
    // Demand factor
    const demandMultiplier = 1 + (marketAnalysis.demand_forecast.predicted_level - 0.5);
    adjustedPrice *= demandMultiplier;
    
    // Supply factor
    const supplyMultiplier = 1 + (0.5 - marketAnalysis.supply_analysis.capacity_utilization);
    adjustedPrice *= supplyMultiplier;
    
    // External factors
    marketAnalysis.external_factors.forEach(factor => {
      const impact = factor.strength * (factor.impact === 'positive' ? -0.1 : 0.1);
      adjustedPrice *= (1 + impact);
    });
    
    return { price: adjustedPrice, confidence };
  }

  private calculateWeightedPrediction(
    predictions: Array<{ model: string; prediction: number; confidence: number }>
  ): { predicted_price: number; confidence: number } {
    if (predictions.length === 0) {
      return { predicted_price: 0, confidence: 0 };
    }
    
    const totalWeight = predictions.reduce((sum, pred) => sum + pred.confidence, 0);
    if (totalWeight === 0) {
      return { predicted_price: 0, confidence: 0 };
    }
    
    const weightedPrice = predictions.reduce(
      (sum, pred) => sum + (pred.prediction * pred.confidence),
      0
    ) / totalWeight;
    
    const averageConfidence = totalWeight / predictions.length;
    
    return {
      predicted_price: weightedPrice,
      confidence: averageConfidence,
    };
  }

  private calculateSeasonalityFactor(
    departureDate: Date,
    historicalData: PricePoint[]
  ): number {
    // Calculate seasonal multiplier based on historical data
    const month = departureDate.getMonth();
    const monthData = historicalData.filter(point => point.date.getMonth() === month);
    
    if (monthData.length === 0) return 1;
    
    const monthAverage = monthData.reduce((sum, point) => sum + point.price, 0) / monthData.length;
    const overallAverage = historicalData.reduce((sum, point) => sum + point.price, 0) / historicalData.length;
    
    return monthAverage / overallAverage;
  }

  private async analyzeExternalFactors(
    route: string,
    departureDate: Date
  ): Promise<ExternalFactor[]> {
    const factors: ExternalFactor[] = [];
    
    // Holiday analysis
    const isHoliday = this.isHolidayPeriod(departureDate);
    if (isHoliday) {
      factors.push({
        type: 'holidays',
        impact: 'negative', // Increases prices
        strength: 0.8,
        description: 'Holiday season typically increases travel prices',
        duration: { start: departureDate, end: departureDate, reason: 'Holiday period' },
      });
    }
    
    // Weather analysis (placeholder - would integrate with weather APIs)
    // Event analysis (placeholder - would integrate with event APIs)
    // Economic analysis (placeholder - would integrate with economic data)
    
    return factors;
  }

  private generatePriceFactors(
    advanceBookingDays: number,
    seasonalityFactor: number,
    externalFactors: ExternalFactor[],
    marketAnalysis: MarketAnalysis
  ): PriceFactor[] {
    const factors: PriceFactor[] = [];
    
    // Advance booking factor
    const optimalAdvanceWindow = [21, 60]; // Days
    if (advanceBookingDays < optimalAdvanceWindow[0]) {
      factors.push({
        factor: 'Last-minute booking',
        impact: 'negative',
        strength: Math.min(1, (optimalAdvanceWindow[0] - advanceBookingDays) / 14),
        description: 'Booking close to departure typically increases prices',
        confidence: 0.9,
      });
    } else if (advanceBookingDays > optimalAdvanceWindow[1]) {
      factors.push({
        factor: 'Very early booking',
        impact: 'negative',
        strength: Math.min(0.5, (advanceBookingDays - optimalAdvanceWindow[1]) / 180),
        description: 'Booking too far in advance may not get best prices',
        confidence: 0.6,
      });
    }
    
    // Seasonality factor
    if (seasonalityFactor > 1.2) {
      factors.push({
        factor: 'Peak season',
        impact: 'negative',
        strength: (seasonalityFactor - 1) / 0.5,
        description: 'Traveling during peak season increases prices',
        confidence: 0.8,
      });
    } else if (seasonalityFactor < 0.8) {
      factors.push({
        factor: 'Off-peak season',
        impact: 'positive',
        strength: (1 - seasonalityFactor) / 0.3,
        description: 'Traveling during off-peak season reduces prices',
        confidence: 0.8,
      });
    }
    
    // External factors
    externalFactors.forEach(factor => {
      factors.push({
        factor: factor.type,
        impact: factor.impact,
        strength: factor.strength,
        description: factor.description,
        confidence: 0.7,
      });
    });
    
    // Market demand factor
    if (marketAnalysis.demand_forecast.predicted_level > 0.8) {
      factors.push({
        factor: 'High demand',
        impact: 'negative',
        strength: (marketAnalysis.demand_forecast.predicted_level - 0.5) * 2,
        description: 'High demand increases prices',
        confidence: 0.7,
      });
    }
    
    return factors;
  }

  // Additional helper methods...
  
  private applyFactorAdjustments(
    basePrediction: { predicted_price: number; confidence: number },
    factors: PriceFactor[]
  ): { predicted_price: number; confidence: number } {
    let adjustedPrice = basePrediction.predicted_price;
    let confidenceAdjustment = 1;
    
    factors.forEach(factor => {
      const adjustment = factor.strength * (factor.impact === 'positive' ? -0.1 : 0.1);
      adjustedPrice *= (1 + adjustment);
      confidenceAdjustment *= factor.confidence;
    });
    
    return {
      predicted_price: adjustedPrice,
      confidence: basePrediction.confidence * confidenceAdjustment,
    };
  }

  private async calculateOptimalBookingWindow(
    route: string,
    departureDate: Date,
    historicalData: PricePoint[]
  ): Promise<PricePrediction['optimal_booking_window']> {
    // Analyze historical data to find optimal booking window
    if (historicalData.length < 20) {
      return {
        start_days: 30,
        end_days: 60,
        reason: 'Insufficient data - using general recommendations',
      };
    }
    
    // Group by advance booking days and calculate average prices
    const pricesByAdvanceDays = new Map<number, number[]>();
    
    historicalData.forEach(point => {
      const days = point.metadata.advance_booking_days;
      if (!pricesByAdvanceDays.has(days)) {
        pricesByAdvanceDays.set(days, []);
      }
      pricesByAdvanceDays.get(days)!.push(point.price);
    });
    
    // Find the range with lowest average prices
    let bestRange = { start: 30, end: 60, avgPrice: Infinity };
    
    for (let start = 7; start <= 180; start += 7) {
      for (let end = start + 14; end <= start + 60; end += 7) {
        const rangeData: number[] = [];
        
        for (let day = start; day <= end; day++) {
          const dayData = pricesByAdvanceDays.get(day);
          if (dayData && dayData.length > 0) {
            rangeData.push(...dayData);
          }
        }
        
        if (rangeData.length > 5) {
          const avgPrice = rangeData.reduce((a, b) => a + b, 0) / rangeData.length;
          if (avgPrice < bestRange.avgPrice) {
            bestRange = { start, end, avgPrice };
          }
        }
      }
    }
    
    return {
      start_days: bestRange.start,
      end_days: bestRange.end,
      reason: `Historical data shows best prices ${bestRange.start}-${bestRange.end} days before departure`,
    };
  }

  // More helper methods would be implemented here...
  
  private initializeEngine(): void {
    // Initialize prediction models and external data connections
  }

  private generateRouteKey(data: any): string {
    return `${data.route || 'unknown'}_${data.service_type || 'flight'}_${data.class_type || 'economy'}`;
  }

  private createDefaultMarketAnalysis(route: string): MarketAnalysis {
    return {
      route_id: route,
      analysis_date: new Date(),
      demand_forecast: {
        current_level: 0.5,
        predicted_level: 0.5,
        peak_periods: [],
        low_periods: [],
      },
      supply_analysis: {
        carrier_count: 5,
        capacity_utilization: 0.7,
        new_routes: [],
        cancelled_routes: [],
      },
      external_factors: [],
      competitive_landscape: [],
    };
  }

  private determinePriceTrend(
    historicalData: PricePoint[],
    factors: PriceFactor[]
  ): 'rising' | 'falling' | 'stable' {
    // Simple trend analysis based on recent data
    if (historicalData.length < 10) return 'stable';
    
    const recent = historicalData.slice(-10);
    const older = historicalData.slice(-20, -10);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, point) => sum + point.price, 0) / recent.length;
    const olderAvg = older.reduce((sum, point) => sum + point.price, 0) / older.length;
    
    const change = (recentAvg - olderAvg) / olderAvg;
    
    if (change > 0.05) return 'rising';
    if (change < -0.05) return 'falling';
    return 'stable';
  }

  private calculateTrendStrength(factors: PriceFactor[]): number {
    return factors.reduce((sum, factor) => sum + factor.strength, 0) / factors.length || 0.5;
  }

  private generatePriceAlerts(
    prediction: { predicted_price: number; confidence: number },
    factors: PriceFactor[],
    optimalWindow: any,
    currentAdvanceDays: number
  ): PriceAlert[] {
    const alerts: PriceAlert[] = [];
    
    // Check for booking deadline alerts
    if (currentAdvanceDays < optimalWindow.start_days - 7) {
      alerts.push({
        type: 'booking_deadline',
        severity: 'medium',
        message: `Optimal booking window starts in ${optimalWindow.start_days - currentAdvanceDays} days`,
        action_required: false,
      });
    }
    
    // Check for high-impact factors
    factors.forEach(factor => {
      if (factor.strength > 0.8 && factor.impact === 'negative') {
        alerts.push({
          type: factor.factor.includes('season') ? 'seasonal_change' : 'price_spike',
          severity: 'high',
          message: `${factor.description} - consider booking soon`,
          action_required: true,
        });
      }
    });
    
    return alerts;
  }

  private calculateHistoricalComparison(
    predictedPrice: number,
    departureDate: Date,
    historicalData: PricePoint[]
  ): PricePrediction['historical_comparison'] {
    const lastYearData = historicalData.filter(point => {
      const pointYear = point.date.getFullYear();
      const targetYear = departureDate.getFullYear();
      return pointYear === targetYear - 1;
    });
    
    const overallAverage = historicalData.length > 0
      ? historicalData.reduce((sum, point) => sum + point.price, 0) / historicalData.length
      : predictedPrice;
    
    const lastYearAverage = lastYearData.length > 0
      ? lastYearData.reduce((sum, point) => sum + point.price, 0) / lastYearData.length
      : predictedPrice;
    
    const vsLastYear = ((predictedPrice - lastYearAverage) / lastYearAverage) * 100;
    const vsAverage = ((predictedPrice - overallAverage) / overallAverage) * 100;
    
    // Calculate percentile
    const sortedPrices = historicalData.map(point => point.price).sort((a, b) => a - b);
    const percentile = this.calculatePercentile(predictedPrice, sortedPrices);
    
    return {
      vs_last_year: vsLastYear,
      vs_average: vsAverage,
      percentile,
    };
  }

  private calculatePercentile(value: number, sortedArray: number[]): number {
    if (sortedArray.length === 0) return 50;
    
    let count = 0;
    for (const price of sortedArray) {
      if (price <= value) count++;
    }
    
    return (count / sortedArray.length) * 100;
  }

  private isHolidayPeriod(date: Date): boolean {
    const month = date.getMonth();
    const day = date.getDate();
    
    // Major holiday periods
    const holidays = [
      { month: 11, startDay: 20, endDay: 31 }, // Christmas/New Year
      { month: 0, startDay: 1, endDay: 7 },    // New Year
      { month: 6, startDay: 1, endDay: 15 },   // Summer holidays
      { month: 2, startDay: 15, endDay: 31 },  // Spring break
    ];
    
    return holidays.some(holiday => 
      holiday.month === month && day >= holiday.startDay && day <= holiday.endDay
    );
  }

  private assessBookingRisk(
    prediction: PricePrediction,
    userPreferences: any
  ): BookingRecommendation['risk_assessment'] {
    return {
      price_increase_probability: prediction.trend === 'rising' ? 0.7 : 0.3,
      availability_risk: 0.4, // Would be calculated based on route data
      alternative_options: 3,  // Would be calculated based on available alternatives
    };
  }

  private calculateRecommendationConfidence(
    prediction: PricePrediction,
    userPreferences: any
  ): number {
    return Math.min(1, prediction.confidence + 0.2); // Boost confidence for recommendations
  }

  private generateMonitoringSchedule(
    prediction: PricePrediction,
    action: BookingRecommendation['action']
  ): BookingRecommendation['monitoring_schedule'] {
    const now = new Date();
    const stopDate = new Date();
    stopDate.setDate(stopDate.getDate() + prediction.optimal_booking_window.end_days);
    
    return {
      check_frequency: action === 'wait' ? 'daily' : 'weekly',
      key_dates: [
        new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week
        new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
      ],
      stop_monitoring_date: stopDate,
    };
  }

  private async updatePredictionModel(routeKey: string, data: PricePoint[]): Promise<void> {
    // Update ML models with new data
    // This would involve retraining the models
  }

  private async performMarketAnalysis(
    route: string,
    historicalData: PricePoint[],
    timeframe: { start: Date; end: Date }
  ): Promise<MarketAnalysis> {
    // Perform comprehensive market analysis
    return this.createDefaultMarketAnalysis(route);
  }
}

export const pricePredictionEngine = new PricePredictionEngine();
export default PricePredictionEngine;