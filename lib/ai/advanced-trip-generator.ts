'use client';

// Advanced AI Trip Generation - Phase 10 Platform Evolution
// Multi-destination routing with optimization algorithms and personalization

import { calculateDistance } from '@/lib/planning/route-optimizer';

export interface TripPreferences {
  budget: {
    total: number;
    currency: 'USD' | 'EUR' | 'GBP' | 'INR';
    flexibility: 'strict' | 'moderate' | 'flexible';
  };
  duration: {
    days: number;
    flexibility: number; // +/- days
  };
  travelStyle: 'luxury' | 'premium' | 'standard' | 'budget' | 'backpacker';
  interests: string[];
  groupType: 'solo' | 'couple' | 'family' | 'friends' | 'business';
  groupSize: number;
  accessibility: {
    mobility: boolean;
    dietary: string[];
    medical: string[];
  };
  seasonalPreferences: string[];
  activityLevel: 'low' | 'moderate' | 'high' | 'extreme';
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  coordinates: [number, number]; // [lng, lat]
  type: 'city' | 'nature' | 'beach' | 'mountain' | 'cultural' | 'adventure';
  popularity: number; // 0-1
  averageCost: number;
  bestMonths: number[];
  attractions: Attraction[];
  transportation: TransportationHub;
}

export interface Attraction {
  id: string;
  name: string;
  category: string;
  rating: number;
  estimatedDuration: number; // hours
  cost: number;
  coordinates: [number, number];
  description: string;
  bestTimeToVisit: string[];
  accessibility: {
    mobility: boolean;
    wheelchairAccessible: boolean;
  };
}

export interface TransportationHub {
  airports: Array<{
    code: string;
    name: string;
    international: boolean;
  }>;
  railStations: Array<{
    name: string;
    type: 'metro' | 'train' | 'high_speed';
  }>;
  ports: Array<{
    name: string;
    type: 'ferry' | 'cruise';
  }>;
}

export interface OptimizedTrip {
  id: string;
  destinations: OptimizedDestination[];
  totalCost: number;
  totalDuration: number;
  totalDistance: number;
  optimizationScore: number; // 0-1
  route: TravelRoute[];
  alternatives: TripAlternative[];
  personalizedInsights: PersonalizedInsight[];
}

export interface OptimizedDestination extends Destination {
  daysAllocated: number;
  estimatedCost: number;
  accommodationSuggestion: AccommodationSuggestion;
  itinerary: DayItinerary[];
  localTransportation: LocalTransport[];
}

export interface DayItinerary {
  day: number;
  date: string;
  activities: PlannedActivity[];
  meals: MealSuggestion[];
  estimatedCost: number;
  walkingDistance: number;
}

export interface PlannedActivity {
  attraction: Attraction;
  startTime: string;
  endTime: string;
  transportTime: number;
  priority: 'must_see' | 'recommended' | 'optional';
}

export interface TravelRoute {
  from: string;
  to: string;
  method: 'flight' | 'train' | 'bus' | 'car' | 'ferry';
  duration: number;
  cost: number;
  carbonFootprint: number;
  alternatives: RouteAlternative[];
}

export interface RouteAlternative {
  method: string;
  duration: number;
  cost: number;
  carbonFootprint: number;
  pros: string[];
  cons: string[];
}

export interface TripAlternative {
  id: string;
  title: string;
  description: string;
  costDifference: number;
  durationDifference: number;
  highlights: string[];
  tradeoffs: string[];
}

export interface PersonalizedInsight {
  type: 'budget' | 'time' | 'experience' | 'cultural' | 'practical';
  title: string;
  description: string;
  actionable: boolean;
  savings?: number;
  timeImpact?: number;
}

export interface AccommodationSuggestion {
  type: 'hotel' | 'hostel' | 'airbnb' | 'resort' | 'guesthouse';
  name: string;
  rating: number;
  priceRange: [number, number];
  location: string;
  amenities: string[];
  walkingDistanceToAttractions: number;
}

export interface MealSuggestion {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  category: 'local' | 'international' | 'fast' | 'fine_dining';
  estimatedCost: number;
  recommendations: string[];
}

export interface LocalTransport {
  type: 'metro' | 'bus' | 'taxi' | 'bike' | 'walk';
  dailyCost: number;
  passOptions: TransportPass[];
}

export interface TransportPass {
  name: string;
  duration: string;
  cost: number;
  coverage: string[];
}

class AdvancedTripGenerator {
  private userPreferences: Map<string, TripPreferences> = new Map();
  private destinationDatabase: Map<string, Destination> = new Map();
  private priceHistory: Map<string, number[]> = new Map();

  constructor() {
    this.initializeDestinationDatabase();
  }

  async generateOptimizedTrip(
    destinations: string[],
    preferences: TripPreferences,
    userId?: string
  ): Promise<OptimizedTrip> {
    try {
      // Store user preferences for learning
      if (userId) {
        this.userPreferences.set(userId, preferences);
      }

      // Get destination data
      const destinationData = await this.getDestinationData(destinations);
      
      // Optimize route using TSP algorithm
      const optimizedRoute = await this.optimizeRoute(destinationData, preferences);
      
      // Allocate time and budget to each destination
      const timeAllocation = await this.allocateTimeAndBudget(
        optimizedRoute,
        preferences
      );
      
      // Generate detailed itineraries
      const detailedItineraries = await this.generateDetailedItineraries(
        timeAllocation,
        preferences
      );
      
      // Calculate transportation between destinations
      const travelRoutes = await this.calculateTravelRoutes(
        optimizedRoute,
        preferences
      );
      
      // Generate alternatives and insights
      const alternatives = await this.generateAlternatives(
        detailedItineraries,
        preferences
      );
      
      const insights = await this.generatePersonalizedInsights(
        detailedItineraries,
        preferences,
        userId
      );
      
      // Calculate totals and optimization score
      const totalCost = this.calculateTotalCost(detailedItineraries, travelRoutes);
      const totalDistance = this.calculateTotalDistance(optimizedRoute);
      const optimizationScore = this.calculateOptimizationScore(
        detailedItineraries,
        preferences
      );
      
      return {
        id: `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        destinations: detailedItineraries,
        totalCost,
        totalDuration: preferences.duration.days,
        totalDistance,
        optimizationScore,
        route: travelRoutes,
        alternatives,
        personalizedInsights: insights,
      };
      
    } catch (error) {
      console.error('Advanced trip generation failed:', error);
      throw new Error('Failed to generate optimized trip');
    }
  }

  private async getDestinationData(destinations: string[]): Promise<Destination[]> {
    const destinationData: Destination[] = [];
    
    for (const dest of destinations) {
      const data = this.destinationDatabase.get(dest.toLowerCase());
      if (data) {
        destinationData.push(data);
      } else {
        // Fetch from external API if not in database
        const externalData = await this.fetchDestinationData(dest);
        if (externalData) {
          destinationData.push(externalData);
          this.destinationDatabase.set(dest.toLowerCase(), externalData);
        }
      }
    }
    
    return destinationData;
  }

  private async optimizeRoute(
    destinations: Destination[],
    preferences: TripPreferences
  ): Promise<Destination[]> {
    if (destinations.length <= 2) {
      return destinations;
    }
    
    // Use TSP algorithm with cost and distance optimization
    const distanceMatrix = this.calculateDistanceMatrix(destinations);
    const costMatrix = await this.calculateCostMatrix(destinations, preferences);
    
    // Weight matrix combining distance and cost
    const weightMatrix = this.combineMatrices(
      distanceMatrix,
      costMatrix,
      preferences.budget.flexibility === 'strict' ? 0.7 : 0.3 // cost weight
    );
    
    // Solve TSP
    const optimizedOrder = this.solveTSP(weightMatrix);
    
    return optimizedOrder.map(index => destinations[index]);
  }

  private calculateDistanceMatrix(destinations: Destination[]): number[][] {
    const matrix: number[][] = [];
    
    for (let i = 0; i < destinations.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < destinations.length; j++) {
        if (i === j) {
          matrix[i][j] = 0;
        } else {
          matrix[i][j] = calculateDistance(
            { lng: destinations[i].coordinates[0], lat: destinations[i].coordinates[1] },
            { lng: destinations[j].coordinates[0], lat: destinations[j].coordinates[1] }
          );
        }
      }
    }
    
    return matrix;
  }

  private async calculateCostMatrix(
    destinations: Destination[],
    preferences: TripPreferences
  ): Promise<number[][] > {
    const matrix: number[][] = [];
    
    for (let i = 0; i < destinations.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < destinations.length; j++) {
        if (i === j) {
          matrix[i][j] = 0;
        } else {
          // Estimate transportation cost between destinations
          const distance = calculateDistance(
            { lng: destinations[i].coordinates[0], lat: destinations[i].coordinates[1] },
            { lng: destinations[j].coordinates[0], lat: destinations[j].coordinates[1] }
          );
          matrix[i][j] = this.estimateTransportCost(
            distance,
            preferences.travelStyle
          );
        }
      }
    }
    
    return matrix;
  }

  private combineMatrices(
    distanceMatrix: number[][],
    costMatrix: number[][],
    costWeight: number
  ): number[][] {
    const combined: number[][] = [];
    const distanceWeight = 1 - costWeight;
    
    // Normalize matrices
    const maxDistance = Math.max(...distanceMatrix.flat());
    const maxCost = Math.max(...costMatrix.flat());
    
    for (let i = 0; i < distanceMatrix.length; i++) {
      combined[i] = [];
      for (let j = 0; j < distanceMatrix[i].length; j++) {
        const normalizedDistance = distanceMatrix[i][j] / maxDistance;
        const normalizedCost = costMatrix[i][j] / maxCost;
        
        combined[i][j] = (
          normalizedDistance * distanceWeight +
          normalizedCost * costWeight
        );
      }
    }
    
    return combined;
  }

  private solveTSP(weightMatrix: number[][]): number[] {
    const n = weightMatrix.length;
    
    if (n <= 1) return [0];
    if (n === 2) return [0, 1];
    
    // Use nearest neighbor heuristic with 2-opt improvement
    let bestRoute = this.nearestNeighborTSP(weightMatrix);
    let bestCost = this.calculateRouteCost(bestRoute, weightMatrix);
    
    // Apply 2-opt improvement
    let improved = true;
    while (improved) {
      improved = false;
      for (let i = 1; i < n - 1; i++) {
        for (let j = i + 1; j < n; j++) {
          const newRoute = this.twoOptSwap(bestRoute, i, j);
          const newCost = this.calculateRouteCost(newRoute, weightMatrix);
          
          if (newCost < bestCost) {
            bestRoute = newRoute;
            bestCost = newCost;
            improved = true;
          }
        }
      }
    }
    
    return bestRoute;
  }

  private nearestNeighborTSP(weightMatrix: number[][]): number[] {
    const n = weightMatrix.length;
    const visited = new Set<number>();
    const route = [0];
    visited.add(0);
    
    let current = 0;
    
    while (visited.size < n) {
      let nearest = -1;
      let nearestDistance = Infinity;
      
      for (let i = 0; i < n; i++) {
        if (!visited.has(i) && weightMatrix[current][i] < nearestDistance) {
          nearest = i;
          nearestDistance = weightMatrix[current][i];
        }
      }
      
      if (nearest !== -1) {
        route.push(nearest);
        visited.add(nearest);
        current = nearest;
      }
    }
    
    return route;
  }

  private twoOptSwap(route: number[], i: number, j: number): number[] {
    const newRoute = [...route];
    
    // Reverse the order between i and j
    while (i < j) {
      [newRoute[i], newRoute[j]] = [newRoute[j], newRoute[i]];
      i++;
      j--;
    }
    
    return newRoute;
  }

  private calculateRouteCost(route: number[], weightMatrix: number[][]): number {
    let totalCost = 0;
    
    for (let i = 0; i < route.length - 1; i++) {
      totalCost += weightMatrix[route[i]][route[i + 1]];
    }
    
    return totalCost;
  }

  private estimateTransportCost(distance: number, travelStyle: string): number {
    // Cost per km by travel style
    const costPerKm = {
      luxury: 0.50,
      premium: 0.35,
      standard: 0.25,
      budget: 0.15,
      backpacker: 0.10,
    };
    
    const rate = costPerKm[travelStyle as keyof typeof costPerKm] || costPerKm.standard;
    return distance * rate;
  }

  private async allocateTimeAndBudget(
    destinations: Destination[],
    preferences: TripPreferences
  ): Promise<Map<string, { days: number; budget: number }>> {
    const allocation = new Map<string, { days: number; budget: number }>();
    
    const totalDays = preferences.duration.days;
    const totalBudget = preferences.budget.total;
    
    // Calculate weights based on destination popularity and user interests
    const weights = destinations.map(dest => {
      let weight = dest.popularity;
      
      // Boost weight if destination matches user interests
      const matchingInterests = dest.attractions.filter(attraction =>
        preferences.interests.some(interest =>
          attraction.category.toLowerCase().includes(interest.toLowerCase())
        )
      ).length;
      
      weight += matchingInterests * 0.1;
      
      return Math.max(0.1, weight); // Minimum weight
    });
    
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    destinations.forEach((dest, index) => {
      const dayAllocation = Math.max(
        1,
        Math.round((weights[index] / totalWeight) * totalDays)
      );
      
      const budgetAllocation = (weights[index] / totalWeight) * totalBudget;
      
      allocation.set(dest.id, {
        days: dayAllocation,
        budget: budgetAllocation,
      });
    });
    
    return allocation;
  }

  private async generateDetailedItineraries(
    timeAllocation: Map<string, { days: number; budget: number }>,
    preferences: TripPreferences
  ): Promise<OptimizedDestination[]> {
    const detailedDestinations: OptimizedDestination[] = [];
    
    for (const [destId, allocation] of Array.from(timeAllocation.entries())) {
      const destination = this.destinationDatabase.get(destId);
      if (!destination) continue;
      
      // Generate daily itineraries
      const itinerary = await this.generateDailyItinerary(
        destination,
        allocation.days,
        allocation.budget,
        preferences
      );
      
      // Suggest accommodation
      const accommodation = await this.suggestAccommodation(
        destination,
        allocation.budget,
        preferences
      );
      
      // Local transportation options
      const localTransport = await this.getLocalTransportation(destination);
      
      detailedDestinations.push({
        ...destination,
        daysAllocated: allocation.days,
        estimatedCost: allocation.budget,
        accommodationSuggestion: accommodation,
        itinerary,
        localTransportation: localTransport,
      });
    }
    
    return detailedDestinations;
  }

  private async generateDailyItinerary(
    destination: Destination,
    days: number,
    budget: number,
    preferences: TripPreferences
  ): Promise<DayItinerary[]> {
    const itinerary: DayItinerary[] = [];
    const dailyBudget = budget / days;
    
    // Filter and rank attractions based on preferences
    const rankedAttractions = this.rankAttractions(
      destination.attractions,
      preferences
    );
    
    for (let day = 1; day <= days; day++) {
      const dayActivities = await this.planDayActivities(
        rankedAttractions,
        dailyBudget * 0.7, // 70% for activities, 30% for meals
        preferences
      );
      
      const dayMeals = await this.planMeals(
        destination,
        dailyBudget * 0.3,
        preferences
      );
      
      itinerary.push({
        day,
        date: '', // Will be set when trip dates are finalized
        activities: dayActivities,
        meals: dayMeals,
        estimatedCost: dailyBudget,
        walkingDistance: this.calculateWalkingDistance(dayActivities),
      });
    }
    
    return itinerary;
  }

  private rankAttractions(
    attractions: Attraction[],
    preferences: TripPreferences
  ): Attraction[] {
    return attractions
      .map(attraction => ({
        ...attraction,
        score: this.calculateAttractionScore(attraction, preferences),
      }))
      .sort((a, b) => b.score - a.score);
  }

  private calculateAttractionScore(
    attraction: Attraction,
    preferences: TripPreferences
  ): number {
    let score = attraction.rating;
    
    // Interest matching
    const matchingInterests = preferences.interests.filter(interest =>
      attraction.category.toLowerCase().includes(interest.toLowerCase()) ||
      attraction.description.toLowerCase().includes(interest.toLowerCase())
    );
    score += matchingInterests.length * 2;
    
    // Accessibility requirements
    if (preferences.accessibility.mobility && !attraction.accessibility.mobility) {
      score -= 5;
    }
    
    // Budget alignment
    const costRatio = attraction.cost / (preferences.budget.total / preferences.duration.days);
    if (costRatio > 0.5) {
      score -= (costRatio - 0.5) * 5;
    }
    
    return Math.max(0, score);
  }

  private async planDayActivities(
    attractions: Attraction[],
    budget: number,
    preferences: TripPreferences
  ): Promise<PlannedActivity[]> {
    const activities: PlannedActivity[] = [];
    let remainingBudget = budget;
    let currentTime = 9; // Start at 9 AM
    const endTime = 18; // End at 6 PM
    
    for (const attraction of attractions) {
      if (remainingBudget < attraction.cost || currentTime >= endTime) {
        break;
      }
      
      const duration = Math.min(attraction.estimatedDuration, endTime - currentTime);
      if (duration < 1) continue; // Skip if less than 1 hour available
      
      activities.push({
        attraction,
        startTime: `${Math.floor(currentTime)}:${(currentTime % 1) * 60 || '00'}`,
        endTime: `${Math.floor(currentTime + duration)}:${((currentTime + duration) % 1) * 60 || '00'}`,
        transportTime: 0, // Will be calculated based on route optimization
        priority: this.determinePriority(attraction, preferences),
      });
      
      remainingBudget -= attraction.cost;
      currentTime += duration + 0.5; // Add 30min buffer
    }
    
    return activities;
  }

  private determinePriority(
    attraction: Attraction,
    preferences: TripPreferences
  ): 'must_see' | 'recommended' | 'optional' {
    const score = this.calculateAttractionScore(attraction, preferences);
    
    if (score >= 8) return 'must_see';
    if (score >= 6) return 'recommended';
    return 'optional';
  }

  // Additional helper methods would be implemented here...
  // Due to space constraints, showing the core architecture

  private initializeDestinationDatabase(): void {
    // This would be populated from a comprehensive database
    // For now, adding a few sample destinations
    this.destinationDatabase.set('paris', {
      id: 'paris',
      name: 'Paris',
      country: 'France',
      coordinates: [2.3522, 48.8566],
      type: 'cultural',
      popularity: 0.95,
      averageCost: 150,
      bestMonths: [4, 5, 6, 9, 10],
      attractions: [],
      transportation: {
        airports: [{ code: 'CDG', name: 'Charles de Gaulle', international: true }],
        railStations: [{ name: 'Gare du Nord', type: 'high_speed' }],
        ports: [{ name: 'Port de la Bourdonnais', type: 'ferry' }],
      },
    });
  }

  private async fetchDestinationData(destination: string): Promise<Destination | null> {
    // This would integrate with external APIs
    return null;
  }

  private async calculateTravelRoutes(
    destinations: Destination[],
    preferences: TripPreferences
  ): Promise<TravelRoute[]> {
    const routes: TravelRoute[] = [];
    
    for (let i = 0; i < destinations.length - 1; i++) {
      const from = destinations[i];
      const to = destinations[i + 1];
      
      const route: TravelRoute = {
        from: from.name,
        to: to.name,
        method: 'flight', // Default, would be optimized
        duration: 0,
        cost: 0,
        carbonFootprint: 0,
        alternatives: [],
      };
      
      routes.push(route);
    }
    
    return routes;
  }

  private async generateAlternatives(
    destinations: OptimizedDestination[],
    preferences: TripPreferences
  ): Promise<TripAlternative[]> {
    return [];
  }

  private async generatePersonalizedInsights(
    destinations: OptimizedDestination[],
    preferences: TripPreferences,
    userId?: string
  ): Promise<PersonalizedInsight[]> {
    return [];
  }

  private calculateTotalCost(
    destinations: OptimizedDestination[],
    routes: TravelRoute[]
  ): number {
    const destinationCosts = destinations.reduce((sum, dest) => sum + dest.estimatedCost, 0);
    const transportCosts = routes.reduce((sum, route) => sum + route.cost, 0);
    return destinationCosts + transportCosts;
  }

  private calculateTotalDistance(destinations: Destination[]): number {
    let totalDistance = 0;
    
    for (let i = 0; i < destinations.length - 1; i++) {
      totalDistance += calculateDistance(
        { lng: destinations[i].coordinates[0], lat: destinations[i].coordinates[1] },
        { lng: destinations[i + 1].coordinates[0], lat: destinations[i + 1].coordinates[1] }
      );
    }
    
    return totalDistance;
  }

  private calculateOptimizationScore(
    destinations: OptimizedDestination[],
    preferences: TripPreferences
  ): number {
    // Complex scoring algorithm considering multiple factors
    return 0.85; // Placeholder
  }

  private async suggestAccommodation(
    destination: Destination,
    budget: number,
    preferences: TripPreferences
  ): Promise<AccommodationSuggestion> {
    return {
      type: 'hotel',
      name: 'Sample Hotel',
      rating: 4.2,
      priceRange: [80, 120],
      location: 'City Center',
      amenities: ['WiFi', 'Breakfast', 'Gym'],
      walkingDistanceToAttractions: 0.5,
    };
  }

  private async getLocalTransportation(destination: Destination): Promise<LocalTransport[]> {
    return [
      {
        type: 'metro',
        dailyCost: 15,
        passOptions: [
          {
            name: '7-Day Pass',
            duration: '7 days',
            cost: 85,
            coverage: ['Metro', 'Bus'],
          },
        ],
      },
    ];
  }

  private async planMeals(
    destination: Destination,
    budget: number,
    preferences: TripPreferences
  ): Promise<MealSuggestion[]> {
    return [
      {
        type: 'breakfast',
        category: 'local',
        estimatedCost: budget * 0.2,
        recommendations: ['Local Café', 'Hotel Breakfast'],
      },
      {
        type: 'lunch',
        category: 'local',
        estimatedCost: budget * 0.3,
        recommendations: ['Bistro', 'Street Food'],
      },
      {
        type: 'dinner',
        category: 'local',
        estimatedCost: budget * 0.5,
        recommendations: ['Traditional Restaurant', 'Fine Dining'],
      },
    ];
  }

  private calculateWalkingDistance(activities: PlannedActivity[]): number {
    let totalDistance = 0;
    
    for (let i = 0; i < activities.length - 1; i++) {
      totalDistance += calculateDistance(
        { lng: activities[i].attraction.coordinates[0], lat: activities[i].attraction.coordinates[1] },
        { lng: activities[i + 1].attraction.coordinates[0], lat: activities[i + 1].attraction.coordinates[1] }
      );
    }
    
    return totalDistance;
  }
}

export const advancedTripGenerator = new AdvancedTripGenerator();
export default AdvancedTripGenerator;