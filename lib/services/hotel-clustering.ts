/**
 * Hotel Clustering Service - Phase 3.4
 * Geographic clustering algorithms and price-based grouping for hotel recommendations
 */

import type { HotelOffer, HotelSearchResult } from './hotel-search';

export interface GeographicCluster {
  id: string;
  centroid: {
    lat: number;
    lng: number;
  };
  hotels: HotelOffer[];
  radius: number; // meters
  area: {
    name: string;
    description: string;
    landmarks?: string[];
  };
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  averageRating: number;
  totalHotels: number;
  starRatingDistribution: Record<number, number>;
  amenitiesCount: Record<string, number>;
}

export interface PriceCluster {
  id: string;
  priceRange: {
    min: number;
    max: number;
    label: string; // 'Budget', 'Mid-range', 'Luxury', etc.
  };
  hotels: HotelOffer[];
  averageRating: number;
  averageStarRating: number;
  mostCommonAmenities: string[];
  recommendedFor: string[]; // 'business', 'family', 'romantic', etc.
}

export interface HotelClusterAnalysis {
  geographicClusters: GeographicCluster[];
  priceClusters: PriceCluster[];
  recommendations: {
    bestValue: HotelOffer[];
    highestRated: HotelOffer[];
    mostPopular: HotelOffer[];
    businessFriendly: HotelOffer[];
    familyFriendly: HotelOffer[];
    luxuryOptions: HotelOffer[];
  };
  insights: {
    totalClusters: number;
    averageClusterSize: number;
    priceDistribution: {
      budget: number; // percentage
      midRange: number;
      luxury: number;
    };
    locationSpread: {
      concentrated: boolean;
      mainAreas: string[];
      averageDistance: number; // meters between hotels
    };
    qualityDistribution: {
      starRatings: Record<number, number>;
      guestRatings: {
        excellent: number; // 9+
        veryGood: number; // 8-8.9
        good: number; // 7-7.9
        fair: number; // 6-6.9
      };
    };
  };
}

export interface ClusteringOptions {
  geographicOptions: {
    maxClusterRadius: number; // meters
    minHotelsPerCluster: number;
    maxClusters: number;
    algorithm: 'kmeans' | 'hierarchical' | 'dbscan';
  };
  priceOptions: {
    budgetThreshold: number; // USD
    luxuryThreshold: number; // USD
    numberOfPriceBands: number;
  };
  preferences: {
    prioritizeLocation: boolean;
    prioritizePrice: boolean;
    prioritizeRating: boolean;
    travelPurpose?: 'business' | 'leisure' | 'family' | 'romantic';
  };
}

const DEFAULT_CLUSTERING_OPTIONS: ClusteringOptions = {
  geographicOptions: {
    maxClusterRadius: 2000, // 2km
    minHotelsPerCluster: 2,
    maxClusters: 8,
    algorithm: 'kmeans',
  },
  priceOptions: {
    budgetThreshold: 100,
    luxuryThreshold: 300,
    numberOfPriceBands: 4,
  },
  preferences: {
    prioritizeLocation: true,
    prioritizePrice: false,
    prioritizeRating: true,
  },
};

export class HotelClusteringService {
  /**
   * Perform comprehensive hotel clustering analysis
   */
  async analyzeHotelClusters(
    searchResult: HotelSearchResult,
    options: Partial<ClusteringOptions> = {}
  ): Promise<HotelClusterAnalysis> {
    const opts = { ...DEFAULT_CLUSTERING_OPTIONS, ...options };
    const hotels = searchResult.offers;

    if (hotels.length === 0) {
      return this.createEmptyAnalysis();
    }

    // Perform geographic clustering
    const geographicClusters = await this.performGeographicClustering(hotels, opts.geographicOptions);

    // Perform price-based clustering
    const priceClusters = this.performPriceClustering(hotels, opts.priceOptions);

    // Generate recommendations
    const recommendations = this.generateRecommendations(hotels, geographicClusters, priceClusters, opts.preferences);

    // Generate insights
    const insights = this.generateInsights(hotels, geographicClusters, priceClusters);

    return {
      geographicClusters,
      priceClusters,
      recommendations,
      insights,
    };
  }

  /**
   * Geographic clustering using K-means algorithm
   */
  private async performGeographicClustering(
    hotels: HotelOffer[],
    options: ClusteringOptions['geographicOptions']
  ): Promise<GeographicCluster[]> {
    if (hotels.length < options.minHotelsPerCluster) {
      return [];
    }

    // Extract coordinates
    const points = hotels.map(hotel => ({
      hotel,
      lat: hotel.hotel.address.coordinates[1],
      lng: hotel.hotel.address.coordinates[0],
    }));

    let clusters: GeographicCluster[] = [];

    switch (options.algorithm) {
      case 'kmeans':
        clusters = await this.kMeansClustering(points, options);
        break;
      case 'hierarchical':
        clusters = await this.hierarchicalClustering(points, options);
        break;
      case 'dbscan':
        clusters = await this.dbscanClustering(points, options);
        break;
    }

    // Enhance clusters with metadata
    return clusters.map(cluster => this.enhanceGeographicCluster(cluster));
  }

  /**
   * K-means clustering implementation
   */
  private async kMeansClustering(
    points: Array<{ hotel: HotelOffer; lat: number; lng: number }>,
    options: ClusteringOptions['geographicOptions']
  ): Promise<GeographicCluster[]> {
    const k = Math.min(options.maxClusters, Math.max(1, Math.floor(points.length / options.minHotelsPerCluster)));
    
    // Initialize centroids randomly
    let centroids = this.initializeCentroids(points, k);
    let assignments: number[] = new Array(points.length);
    let converged = false;
    let iterations = 0;
    const maxIterations = 100;

    while (!converged && iterations < maxIterations) {
      // Assign points to nearest centroid
      const newAssignments = points.map(point => 
        this.findNearestCentroid(point, centroids)
      );

      // Check convergence
      converged = assignments.every((assignment, i) => assignment === newAssignments[i]);
      assignments = newAssignments;

      if (!converged) {
        // Update centroids
        centroids = this.updateCentroids(points, assignments, k);
      }

      iterations++;
    }

    // Create clusters
    const clusters: GeographicCluster[] = [];
    for (let i = 0; i < k; i++) {
      const clusterPoints = points.filter((_, index) => assignments[index] === i);
      
      if (clusterPoints.length >= options.minHotelsPerCluster) {
        const cluster = this.createGeographicCluster(
          clusterPoints.map(p => p.hotel),
          centroids[i],
          i
        );
        
        // Check if cluster radius is within limits
        if (cluster.radius <= options.maxClusterRadius) {
          clusters.push(cluster);
        }
      }
    }

    return clusters;
  }

  /**
   * DBSCAN clustering for density-based clustering
   */
  private async dbscanClustering(
    points: Array<{ hotel: HotelOffer; lat: number; lng: number }>,
    options: ClusteringOptions['geographicOptions']
  ): Promise<GeographicCluster[]> {
    const eps = options.maxClusterRadius / 1000; // Convert to km for calculation
    const minPts = options.minHotelsPerCluster;
    
    const visited = new Set<number>();
    const clustered = new Set<number>();
    const clusters: Array<{ hotel: HotelOffer; lat: number; lng: number }[]> = [];

    for (let i = 0; i < points.length; i++) {
      if (visited.has(i)) continue;
      visited.add(i);

      const neighbors = this.getNeighbors(points, i, eps);
      
      if (neighbors.length < minPts) {
        // Point is noise, skip
        continue;
      }

      // Start new cluster
      const cluster: Array<{ hotel: HotelOffer; lat: number; lng: number }> = [];
      this.expandCluster(points, i, neighbors, cluster, clustered, visited, eps, minPts);
      
      if (cluster.length >= minPts) {
        clusters.push(cluster);
      }
    }

    return clusters.slice(0, options.maxClusters).map((clusterPoints, index) => {
      const centroid = this.calculateCentroid(clusterPoints);
      return this.createGeographicCluster(
        clusterPoints.map(p => p.hotel),
        centroid,
        index
      );
    });
  }

  /**
   * Hierarchical clustering (simplified agglomerative)
   */
  private async hierarchicalClustering(
    points: Array<{ hotel: HotelOffer; lat: number; lng: number }>,
    options: ClusteringOptions['geographicOptions']
  ): Promise<GeographicCluster[]> {
    // Initialize each point as its own cluster
    let clusters = points.map((point, index) => ({
      points: [point],
      centroid: { lat: point.lat, lng: point.lng },
      id: index,
    }));

    // Merge clusters until we reach desired number or max radius
    while (clusters.length > options.maxClusters) {
      let minDistance = Infinity;
      let mergeIndices = [-1, -1];

      // Find closest pair of clusters
      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          const distance = this.calculateDistance(clusters[i].centroid, clusters[j].centroid);
          if (distance < minDistance) {
            minDistance = distance;
            mergeIndices = [i, j];
          }
        }
      }

      // Check if minimum distance exceeds maximum radius
      if (minDistance * 1000 > options.maxClusterRadius) {
        break;
      }

      // Merge the two closest clusters
      const [i, j] = mergeIndices;
      const mergedPoints = [...clusters[i].points, ...clusters[j].points];
      const mergedCentroid = this.calculateCentroid(mergedPoints);

      clusters[i] = {
        points: mergedPoints,
        centroid: mergedCentroid,
        id: clusters[i].id,
      };

      clusters.splice(j, 1);
    }

    // Filter out clusters that are too small
    return clusters
      .filter(cluster => cluster.points.length >= options.minHotelsPerCluster)
      .map((cluster, index) => 
        this.createGeographicCluster(
          cluster.points.map(p => p.hotel),
          cluster.centroid,
          index
        )
      );
  }

  /**
   * Price-based clustering
   */
  private performPriceClustering(
    hotels: HotelOffer[],
    options: ClusteringOptions['priceOptions']
  ): PriceCluster[] {
    const sortedByPrice = [...hotels].sort((a, b) => a.pricing.total - b.pricing.total);
    const priceRange = {
      min: sortedByPrice[0].pricing.total,
      max: sortedByPrice[sortedByPrice.length - 1].pricing.total,
    };

    const clusters: PriceCluster[] = [];

    // Define price bands
    const priceBands = this.createPriceBands(priceRange, options);

    for (const band of priceBands) {
      const hotelsInBand = hotels.filter(hotel => 
        hotel.pricing.total >= band.min && hotel.pricing.total < band.max
      );

      if (hotelsInBand.length > 0) {
        clusters.push({
          id: `price_${band.label.toLowerCase().replace(/\s+/g, '_')}`,
          priceRange: band,
          hotels: hotelsInBand,
          averageRating: this.calculateAverageRating(hotelsInBand),
          averageStarRating: this.calculateAverageStarRating(hotelsInBand),
          mostCommonAmenities: this.getMostCommonAmenities(hotelsInBand),
          recommendedFor: this.getRecommendedFor(band.label, hotelsInBand),
        });
      }
    }

    return clusters;
  }

  /**
   * Generate personalized recommendations
   */
  private generateRecommendations(
    hotels: HotelOffer[],
    geographicClusters: GeographicCluster[],
    priceClusters: PriceCluster[],
    preferences: ClusteringOptions['preferences']
  ) {
    const sortedByPrice = [...hotels].sort((a, b) => a.pricing.total - b.pricing.total);
    const sortedByRating = [...hotels].sort((a, b) => (b.hotel.guestRating?.score || 0) - (a.hotel.guestRating?.score || 0));
    const sortedByReviews = [...hotels].sort((a, b) => (b.hotel.guestRating?.reviewCount || 0) - (a.hotel.guestRating?.reviewCount || 0));

    return {
      bestValue: this.getBestValueHotels(hotels),
      highestRated: sortedByRating.slice(0, 5),
      mostPopular: sortedByReviews.slice(0, 5),
      businessFriendly: this.getBusinessFriendlyHotels(hotels),
      familyFriendly: this.getFamilyFriendlyHotels(hotels),
      luxuryOptions: this.getLuxuryHotels(hotels),
    };
  }

  /**
   * Generate insights from clustering analysis
   */
  private generateInsights(
    hotels: HotelOffer[],
    geographicClusters: GeographicCluster[],
    priceClusters: PriceCluster[]
  ) {
    const totalPrice = hotels.reduce((sum, hotel) => sum + hotel.pricing.total, 0);
    const averagePrice = totalPrice / hotels.length;

    const budgetCount = hotels.filter(h => h.pricing.total < 100).length;
    const luxuryCount = hotels.filter(h => h.pricing.total > 300).length;
    const midRangeCount = hotels.length - budgetCount - luxuryCount;

    const starRatings: Record<number, number> = {};
    hotels.forEach(hotel => {
      const stars = hotel.hotel.starRating || 0;
      starRatings[stars] = (starRatings[stars] || 0) + 1;
    });

    let excellent = 0, veryGood = 0, good = 0, fair = 0;
    hotels.forEach(hotel => {
      const rating = hotel.hotel.guestRating?.score || 0;
      if (rating >= 9) excellent++;
      else if (rating >= 8) veryGood++;
      else if (rating >= 7) good++;
      else if (rating >= 6) fair++;
    });

    // Calculate average distance between hotels
    const distances: number[] = [];
    for (let i = 0; i < hotels.length; i++) {
      for (let j = i + 1; j < hotels.length; j++) {
        const distance = this.calculateDistance(
          {
            lat: hotels[i].hotel.address.coordinates[1],
            lng: hotels[i].hotel.address.coordinates[0],
          },
          {
            lat: hotels[j].hotel.address.coordinates[1],
            lng: hotels[j].hotel.address.coordinates[0],
          }
        ) * 1000; // Convert to meters
        distances.push(distance);
      }
    }
    const averageDistance = distances.length > 0 ? distances.reduce((sum, d) => sum + d, 0) / distances.length : 0;

    return {
      totalClusters: geographicClusters.length,
      averageClusterSize: geographicClusters.length > 0 ? 
        geographicClusters.reduce((sum, cluster) => sum + cluster.totalHotels, 0) / geographicClusters.length : 0,
      priceDistribution: {
        budget: Math.round((budgetCount / hotels.length) * 100),
        midRange: Math.round((midRangeCount / hotels.length) * 100),
        luxury: Math.round((luxuryCount / hotels.length) * 100),
      },
      locationSpread: {
        concentrated: averageDistance < 5000, // Within 5km
        mainAreas: geographicClusters.map(cluster => cluster.area.name),
        averageDistance: Math.round(averageDistance),
      },
      qualityDistribution: {
        starRatings,
        guestRatings: {
          excellent: Math.round((excellent / hotels.length) * 100),
          veryGood: Math.round((veryGood / hotels.length) * 100),
          good: Math.round((good / hotels.length) * 100),
          fair: Math.round((fair / hotels.length) * 100),
        },
      },
    };
  }

  // Helper methods

  private createEmptyAnalysis(): HotelClusterAnalysis {
    return {
      geographicClusters: [],
      priceClusters: [],
      recommendations: {
        bestValue: [],
        highestRated: [],
        mostPopular: [],
        businessFriendly: [],
        familyFriendly: [],
        luxuryOptions: [],
      },
      insights: {
        totalClusters: 0,
        averageClusterSize: 0,
        priceDistribution: { budget: 0, midRange: 0, luxury: 0 },
        locationSpread: { concentrated: false, mainAreas: [], averageDistance: 0 },
        qualityDistribution: {
          starRatings: {},
          guestRatings: { excellent: 0, veryGood: 0, good: 0, fair: 0 },
        },
      },
    };
  }

  private initializeCentroids(
    points: Array<{ hotel: HotelOffer; lat: number; lng: number }>,
    k: number
  ): Array<{ lat: number; lng: number }> {
    // Use K-means++ initialization for better initial centroids
    const centroids: Array<{ lat: number; lng: number }> = [];
    
    // First centroid is random
    centroids.push({
      lat: points[Math.floor(Math.random() * points.length)].lat,
      lng: points[Math.floor(Math.random() * points.length)].lng,
    });

    // Subsequent centroids chosen based on distance from existing centroids
    for (let i = 1; i < k; i++) {
      const distances = points.map(point => {
        const minDistToCentroids = Math.min(
          ...centroids.map(centroid => this.calculateDistance(point, centroid))
        );
        return minDistToCentroids * minDistToCentroids;
      });

      const totalDistance = distances.reduce((sum, d) => sum + d, 0);
      const random = Math.random() * totalDistance;
      
      let sum = 0;
      for (let j = 0; j < points.length; j++) {
        sum += distances[j];
        if (sum >= random) {
          centroids.push({ lat: points[j].lat, lng: points[j].lng });
          break;
        }
      }
    }

    return centroids;
  }

  private findNearestCentroid(
    point: { lat: number; lng: number },
    centroids: Array<{ lat: number; lng: number }>
  ): number {
    let minDistance = Infinity;
    let nearestIndex = 0;

    for (let i = 0; i < centroids.length; i++) {
      const distance = this.calculateDistance(point, centroids[i]);
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = i;
      }
    }

    return nearestIndex;
  }

  private updateCentroids(
    points: Array<{ hotel: HotelOffer; lat: number; lng: number }>,
    assignments: number[],
    k: number
  ): Array<{ lat: number; lng: number }> {
    const centroids: Array<{ lat: number; lng: number }> = [];

    for (let i = 0; i < k; i++) {
      const clusterPoints = points.filter((_, index) => assignments[index] === i);
      
      if (clusterPoints.length > 0) {
        const centroid = this.calculateCentroid(clusterPoints);
        centroids.push(centroid);
      } else {
        // If no points assigned, keep previous centroid or random
        centroids.push({
          lat: points[Math.floor(Math.random() * points.length)].lat,
          lng: points[Math.floor(Math.random() * points.length)].lng,
        });
      }
    }

    return centroids;
  }

  private calculateCentroid(points: Array<{ lat: number; lng: number }>): { lat: number; lng: number } {
    const totalLat = points.reduce((sum, point) => sum + point.lat, 0);
    const totalLng = points.reduce((sum, point) => sum + point.lng, 0);
    
    return {
      lat: totalLat / points.length,
      lng: totalLng / points.length,
    };
  }

  private calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    // Haversine formula for distance calculation in kilometers
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private createGeographicCluster(
    hotels: HotelOffer[],
    centroid: { lat: number; lng: number },
    index: number
  ): GeographicCluster {
    const prices = hotels.map(h => h.pricing.total);
    const ratings = hotels.map(h => h.hotel.guestRating?.score || 0).filter(r => r > 0);
    
    // Calculate cluster radius
    const distances = hotels.map(hotel => 
      this.calculateDistance(centroid, {
        lat: hotel.hotel.address.coordinates[1],
        lng: hotel.hotel.address.coordinates[0],
      }) * 1000 // Convert to meters
    );
    const radius = Math.max(...distances);

    // Star rating distribution
    const starRatingDistribution: Record<number, number> = {};
    hotels.forEach(hotel => {
      const stars = hotel.hotel.starRating || 0;
      starRatingDistribution[stars] = (starRatingDistribution[stars] || 0) + 1;
    });

    // Amenities count
    const amenitiesCount: Record<string, number> = {};
    hotels.forEach(hotel => {
      Object.entries(hotel.hotel.amenities).forEach(([amenity, hasIt]) => {
        if (hasIt) {
          amenitiesCount[amenity] = (amenitiesCount[amenity] || 0) + 1;
        }
      });
    });

    return {
      id: `geo_cluster_${index}`,
      centroid,
      hotels,
      radius,
      area: {
        name: this.generateAreaName(centroid, hotels),
        description: `Cluster of ${hotels.length} hotels within ${Math.round(radius)}m`,
        landmarks: this.identifyNearbyLandmarks(centroid, hotels),
      },
      averagePrice: prices.reduce((sum, p) => sum + p, 0) / prices.length,
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices),
      },
      averageRating: ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0,
      totalHotels: hotels.length,
      starRatingDistribution,
      amenitiesCount,
    };
  }

  private enhanceGeographicCluster(cluster: GeographicCluster): GeographicCluster {
    // Add additional metadata and analysis
    return cluster;
  }

  private getNeighbors(
    points: Array<{ hotel: HotelOffer; lat: number; lng: number }>,
    pointIndex: number,
    eps: number
  ): number[] {
    const neighbors: number[] = [];
    const centerPoint = points[pointIndex];

    for (let i = 0; i < points.length; i++) {
      if (i !== pointIndex) {
        const distance = this.calculateDistance(centerPoint, points[i]);
        if (distance <= eps) {
          neighbors.push(i);
        }
      }
    }

    return neighbors;
  }

  private expandCluster(
    points: Array<{ hotel: HotelOffer; lat: number; lng: number }>,
    pointIndex: number,
    neighbors: number[],
    cluster: Array<{ hotel: HotelOffer; lat: number; lng: number }>,
    clustered: Set<number>,
    visited: Set<number>,
    eps: number,
    minPts: number
  ): void {
    cluster.push(points[pointIndex]);
    clustered.add(pointIndex);

    for (const neighborIndex of neighbors) {
      if (!visited.has(neighborIndex)) {
        visited.add(neighborIndex);
        const newNeighbors = this.getNeighbors(points, neighborIndex, eps);
        
        if (newNeighbors.length >= minPts) {
          neighbors.push(...newNeighbors);
        }
      }

      if (!clustered.has(neighborIndex)) {
        cluster.push(points[neighborIndex]);
        clustered.add(neighborIndex);
      }
    }
  }

  private createPriceBands(
    priceRange: { min: number; max: number },
    options: ClusteringOptions['priceOptions']
  ): Array<{ min: number; max: number; label: string }> {
    const bands = [];
    const { budgetThreshold, luxuryThreshold } = options;

    // Budget
    if (priceRange.min < budgetThreshold) {
      bands.push({
        min: priceRange.min,
        max: Math.min(budgetThreshold, priceRange.max),
        label: 'Budget',
      });
    }

    // Mid-range
    const midStart = Math.max(budgetThreshold, priceRange.min);
    const midEnd = Math.min(luxuryThreshold, priceRange.max);
    if (midStart < midEnd) {
      bands.push({
        min: midStart,
        max: midEnd,
        label: 'Mid-range',
      });
    }

    // Luxury
    if (priceRange.max > luxuryThreshold) {
      bands.push({
        min: Math.max(luxuryThreshold, priceRange.min),
        max: priceRange.max,
        label: 'Luxury',
      });
    }

    return bands;
  }

  private calculateAverageRating(hotels: HotelOffer[]): number {
    const ratings = hotels.map(h => h.hotel.guestRating?.score || 0).filter(r => r > 0);
    return ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
  }

  private calculateAverageStarRating(hotels: HotelOffer[]): number {
    const starRatings = hotels.map(h => h.hotel.starRating || 0).filter(r => r > 0);
    return starRatings.length > 0 ? starRatings.reduce((sum, r) => sum + r, 0) / starRatings.length : 0;
  }

  private getMostCommonAmenities(hotels: HotelOffer[]): string[] {
    const amenityCounts: Record<string, number> = {};
    
    hotels.forEach(hotel => {
      Object.entries(hotel.hotel.amenities).forEach(([amenity, hasIt]) => {
        if (hasIt) {
          amenityCounts[amenity] = (amenityCounts[amenity] || 0) + 1;
        }
      });
    });

    return Object.entries(amenityCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([amenity]) => amenity);
  }

  private getRecommendedFor(priceLabel: string, hotels: HotelOffer[]): string[] {
    const recommendations = [];
    
    if (priceLabel === 'Budget') {
      recommendations.push('Budget travelers', 'Backpackers', 'Extended stays');
    } else if (priceLabel === 'Mid-range') {
      recommendations.push('Leisure travelers', 'Couples', 'Weekend getaways');
    } else if (priceLabel === 'Luxury') {
      recommendations.push('Luxury travelers', 'Special occasions', 'Business executives');
    }

    // Check for family-friendly features
    const familyFriendly = hotels.some(hotel => 
      hotel.hotel.amenities.pool || hotel.hotel.propertyType === 'resort'
    );
    if (familyFriendly) recommendations.push('Families');

    // Check for business features
    const businessFriendly = hotels.some(hotel =>
      hotel.hotel.amenities.businessCenter || hotel.hotel.amenities.wifi
    );
    if (businessFriendly) recommendations.push('Business travelers');

    return recommendations;
  }

  private getBestValueHotels(hotels: HotelOffer[]): HotelOffer[] {
    // Calculate value score (rating/price ratio)
    return hotels
      .filter(hotel => hotel.hotel.guestRating?.score && hotel.hotel.guestRating.score > 0)
      .map(hotel => ({
        hotel,
        valueScore: (hotel.hotel.guestRating!.score / 10) / (hotel.pricing.total / 100),
      }))
      .sort((a, b) => b.valueScore - a.valueScore)
      .slice(0, 5)
      .map(item => item.hotel);
  }

  private getBusinessFriendlyHotels(hotels: HotelOffer[]): HotelOffer[] {
    return hotels
      .filter(hotel => 
        hotel.hotel.amenities.wifi && 
        (hotel.hotel.amenities.businessCenter || hotel.hotel.amenities.concierge)
      )
      .sort((a, b) => (b.hotel.guestRating?.score || 0) - (a.hotel.guestRating?.score || 0))
      .slice(0, 5);
  }

  private getFamilyFriendlyHotels(hotels: HotelOffer[]): HotelOffer[] {
    return hotels
      .filter(hotel => 
        hotel.hotel.amenities.pool || 
        hotel.hotel.propertyType === 'resort' ||
        hotel.rooms.some(room => room.maxOccupancy.children > 0)
      )
      .sort((a, b) => (b.hotel.guestRating?.score || 0) - (a.hotel.guestRating?.score || 0))
      .slice(0, 5);
  }

  private getLuxuryHotels(hotels: HotelOffer[]): HotelOffer[] {
    return hotels
      .filter(hotel => 
        (hotel.hotel.starRating && hotel.hotel.starRating >= 4) ||
        hotel.pricing.total > 300 ||
        (hotel.hotel.amenities.spa && hotel.hotel.amenities.concierge)
      )
      .sort((a, b) => (b.hotel.starRating || 0) - (a.hotel.starRating || 0))
      .slice(0, 5);
  }

  private generateAreaName(centroid: { lat: number; lng: number }, hotels: HotelOffer[]): string {
    // Simple area name generation based on first hotel's city
    const city = hotels[0]?.hotel.address.city || 'Unknown Area';
    return `${city} Area`;
  }

  private identifyNearbyLandmarks(centroid: { lat: number; lng: number }, hotels: HotelOffer[]): string[] {
    // This would integrate with a landmarks database in a real implementation
    return ['City Center', 'Main Station', 'Shopping District'].slice(0, Math.floor(Math.random() * 3) + 1);
  }
}

export default HotelClusteringService;