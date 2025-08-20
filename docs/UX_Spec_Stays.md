# Accommodation Discovery UX Specifications v1.1

**Version**: 1.1.0  
**Last Updated**: August 19, 2025  
**Status**: Rich Discovery Phase  
**Objective**: Transform accommodation search into immersive visual discovery experience

---

## 🏨 ACCOMMODATION TRANSFORMATION OVERVIEW

### **Current State Critical Issues**
- ❌ **Basic hotel listings**: Text-only results without compelling visuals
- ❌ **No location context**: Hotels shown without proximity to user's interests
- ❌ **Limited filtering**: Only basic price/star filters available
- ❌ **No visual storytelling**: Missing photos, virtual tours, neighborhood context
- ❌ **Poor mobile experience**: Cards don't adapt to small screens
- ❌ **No smart ranking**: Results not personalized or optimized
- ❌ **Missing reviews integration**: No guest feedback or ratings context
- ❌ **Static booking flow**: Generic "View Hotel" links without context

### **New Vision: Immersive Visual Discovery**

> **Transform accommodation search into a rich, visual discovery experience with high-quality imagery, neighborhood context, intelligent ranking, guest reviews, and seamless booking integration that helps users find not just a place to stay, but the perfect base for their adventure.**

---

## 🎨 VISUAL DISCOVERY INTERFACE

### **Hotel Card Design System**

```html
<div class="accommodation-grid">
  <div class="hotel-card" 
       v-for="hotel in displayedHotels" 
       :key="hotel.id"
       :class="{ pinned: hotel.isPinned, featured: hotel.isFeatured }">
    
    <!-- Image Gallery -->
    <div class="hotel-gallery">
      <div class="main-image-container">
        <img 
          :src="hotel.images.hero" 
          :alt="hotel.name"
          class="main-image"
          @click="openGallery(hotel.id, 0)"
        />
        <div class="image-overlay">
          <button class="gallery-btn" @click="openGallery(hotel.id)">
            <Camera class="w-4 h-4" />
            {{ hotel.images.total }}
          </button>
          
          <div class="hotel-actions">
            <button class="action-btn" 
                    :class="{ active: hotel.isPinned }" 
                    @click="togglePin(hotel.id)">
              <Pin class="w-4 h-4" />
            </button>
            <button class="action-btn" @click="shareHotel(hotel.id)">
              <Share2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      <div class="image-thumbnails">
        <img 
          v-for="(thumb, index) in hotel.images.thumbnails.slice(0, 4)" 
          :key="index"
          :src="thumb" 
          class="thumbnail"
          @click="openGallery(hotel.id, index + 1)"
        />
        <div class="more-images" v-if="hotel.images.total > 5" @click="openGallery(hotel.id)">
          <Plus class="w-3 h-3" />
          +{{ hotel.images.total - 4 }}
        </div>
      </div>
    </div>

    <!-- Hotel Information -->
    <div class="hotel-info">
      <!-- Header -->
      <div class="hotel-header">
        <div class="hotel-name-section">
          <h3 class="hotel-name">{{ hotel.name }}</h3>
          <div class="hotel-category">
            <div class="star-rating">
              <Star 
                v-for="star in 5" 
                :key="star"
                class="star"
                :class="{ filled: star <= hotel.starRating }"
              />
            </div>
            <span class="property-type">{{ hotel.propertyType }}</span>
          </div>
        </div>
        
        <div class="hotel-badges">
          <span class="badge featured" v-if="hotel.isFeatured">Featured</span>
          <span class="badge sustainable" v-if="hotel.sustainability.certified">
            <Leaf class="w-3 h-3" />
            Eco-friendly
          </span>
          <span class="badge new" v-if="hotel.isNew">New</span>
        </div>
      </div>

      <!-- Location Context -->
      <div class="location-context">
        <div class="address-info">
          <MapPin class="w-4 h-4 text-emerald-400" />
          <span class="neighborhood">{{ hotel.location.neighborhood }}</span>
          <span class="distance">{{ hotel.location.distanceToCenter }} to center</span>
        </div>
        
        <div class="location-highlights">
          <div class="nearby-highlight" 
               v-for="highlight in hotel.location.highlights.slice(0, 2)" 
               :key="highlight.id">
            <component :is="highlight.icon" class="w-3 h-3 text-zinc-400" />
            <span>{{ highlight.distance }} to {{ highlight.name }}</span>
          </div>
        </div>
      </div>

      <!-- Reviews & Ratings -->
      <div class="reviews-section">
        <div class="rating-summary">
          <div class="rating-score">
            <span class="score">{{ hotel.reviews.averageRating }}</span>
            <div class="rating-bars">
              <div class="rating-bar">
                <span class="rating-label">Cleanliness</span>
                <div class="bar">
                  <div class="bar-fill" :style="{ width: hotel.reviews.breakdown.cleanliness * 10 + '%' }"></div>
                </div>
                <span class="rating-value">{{ hotel.reviews.breakdown.cleanliness }}/10</span>
              </div>
              <div class="rating-bar">
                <span class="rating-label">Location</span>
                <div class="bar">
                  <div class="bar-fill" :style="{ width: hotel.reviews.breakdown.location * 10 + '%' }"></div>
                </div>
                <span class="rating-value">{{ hotel.reviews.breakdown.location }}/10</span>
              </div>
            </div>
          </div>
          
          <div class="review-summary">
            <span class="rating-text">{{ getRatingText(hotel.reviews.averageRating) }}</span>
            <span class="review-count">{{ hotel.reviews.totalReviews }} reviews</span>
          </div>
        </div>
        
        <div class="recent-review" v-if="hotel.reviews.recent">
          <div class="review-text">"{{ hotel.reviews.recent.snippet }}"</div>
          <div class="review-author">
            <span class="author-name">{{ hotel.reviews.recent.author }}</span>
            <span class="review-date">{{ formatDate(hotel.reviews.recent.date) }}</span>
          </div>
        </div>
      </div>

      <!-- Amenities -->
      <div class="amenities-section">
        <div class="key-amenities">
          <div class="amenity-item" 
               v-for="amenity in hotel.amenities.key" 
               :key="amenity.id"
               :title="amenity.description">
            <component :is="amenity.icon" class="w-4 h-4" :class="amenity.iconClass" />
            <span>{{ amenity.name }}</span>
          </div>
        </div>
        
        <button class="show-all-amenities" @click="showAllAmenities(hotel.id)" v-if="hotel.amenities.total > 6">
          <Plus class="w-3 h-3 mr-1" />
          +{{ hotel.amenities.total - 6 }} more
        </button>
      </div>

      <!-- Pricing Section -->
      <div class="pricing-section">
        <div class="price-info">
          <div class="nightly-rate">
            <span class="currency">{{ userCurrency }}</span>
            <span class="price-amount">{{ formatPrice(hotel.pricing.nightlyRate) }}</span>
            <span class="price-period">/night</span>
          </div>
          
          <div class="total-stay">
            <span class="total-label">{{ tripDuration }} nights total:</span>
            <span class="total-amount">{{ formatPrice(hotel.pricing.totalStay) }}</span>
          </div>
        </div>
        
        <div class="price-context">
          <div class="price-comparison" v-if="hotel.pricing.comparison">
            <TrendingDown v-if="hotel.pricing.comparison.trend === 'lower'" class="w-3 h-3 text-green-400" />
            <TrendingUp v-if="hotel.pricing.comparison.trend === 'higher'" class="w-3 h-3 text-red-400" />
            <span class="comparison-text">{{ hotel.pricing.comparison.text }}</span>
          </div>
          
          <div class="booking-urgency" v-if="hotel.availability.urgency">
            <Clock class="w-3 h-3 text-amber-400" />
            <span>{{ hotel.availability.urgency }}</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="hotel-actions">
        <button class="btn-primary hotel-select" @click="selectHotel(hotel)">
          <Check class="w-4 h-4 mr-2" />
          Select Hotel
        </button>
        
        <div class="secondary-actions">
          <button class="btn-ghost btn-sm" @click="viewHotelDetails(hotel)">
            View Details
          </button>
          <button class="btn-ghost btn-sm" @click="checkAvailability(hotel)">
            Check Rates
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## 🗺️ LOCATION-AWARE DISCOVERY

### **Smart Location Context**

```html
<div class="location-intelligence">
  <!-- Proximity to Arrival Points -->
  <div class="arrival-context" v-if="arrivalPoint">
    <h4>Distance from your arrival</h4>
    <div class="arrival-distances">
      <div class="distance-item">
        <Plane class="w-4 h-4 text-sky-400" />
        <span>{{ distanceToAirport }} km from {{ arrivalAirport }}</span>
        <span class="travel-time">{{ travelTimeToAirport }} by taxi</span>
      </div>
      <div class="distance-item" v-if="nearbyTrainStation">
        <Train class="w-4 h-4 text-green-400" />
        <span>{{ distanceToTrain }} km from {{ nearbyTrainStation }}</span>
        <span class="travel-time">{{ travelTimeToTrain }} walk</span>
      </div>
    </div>
  </div>

  <!-- Neighborhood Explorer -->
  <div class="neighborhood-context">
    <h4>Explore {{ hotel.location.neighborhood }}</h4>
    <div class="neighborhood-grid">
      <div class="poi-category" v-for="category in nearbyPOIs" :key="category.type">
        <div class="category-header">
          <component :is="category.icon" class="w-4 h-4" :class="category.iconClass" />
          <span class="category-name">{{ category.name }}</span>
          <span class="poi-count">{{ category.count }}</span>
        </div>
        
        <div class="top-pois">
          <div class="poi-item" v-for="poi in category.top3" :key="poi.id">
            <span class="poi-name">{{ poi.name }}</span>
            <span class="poi-distance">{{ poi.walkingDistance }}min walk</span>
            <div class="poi-rating">
              <Star class="w-3 h-3 text-amber-400" />
              <span>{{ poi.rating }}</span>
            </div>
          </div>
        </div>
        
        <button class="explore-category" @click="exploreCategory(category.type, hotel.location)">
          Explore {{ category.name.toLowerCase() }}
        </button>
      </div>
    </div>
  </div>

  <!-- Transportation Access -->
  <div class="transport-access">
    <h4>Getting around</h4>
    <div class="transport-options">
      <div class="transport-item" v-for="transport in nearbyTransport" :key="transport.type">
        <component :is="transport.icon" class="w-4 h-4" />
        <div class="transport-info">
          <span class="transport-name">{{ transport.name }}</span>
          <span class="transport-distance">{{ transport.distance }} walk</span>
        </div>
        <div class="transport-lines">
          <span class="line-badge" v-for="line in transport.lines" :key="line">{{ line }}</span>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## 🔍 INTELLIGENT FILTERING & SORTING

### **Advanced Filter Panel**

```html
<div class="accommodation-filters">
  <div class="filter-header">
    <h3>Refine your search</h3>
    <div class="active-filters" v-if="activeFilterCount">
      <span class="filter-count">{{ activeFilterCount }} filters active</span>
      <button class="clear-filters" @click="clearAllFilters">Clear all</button>
    </div>
  </div>

  <!-- Quick Filters -->
  <div class="quick-filter-row">
    <button class="quick-filter" 
            :class="{ active: quickFilters.topRated }"
            @click="toggleQuickFilter('topRated')">
      <Star class="w-4 h-4" />
      Top Rated (9.0+)
    </button>
    <button class="quick-filter" 
            :class="{ active: quickFilters.freeWifi }"
            @click="toggleQuickFilter('freeWifi')">
      <Wifi class="w-4 h-4" />
      Free WiFi
    </button>
    <button class="quick-filter" 
            :class="{ active: quickFilters.freeCancellation }"
            @click="toggleQuickFilter('freeCancellation')">
      <Shield class="w-4 h-4" />
      Free Cancellation
    </button>
    <button class="quick-filter" 
            :class="{ active: quickFilters.breakfast }"
            @click="toggleQuickFilter('breakfast')">
      <Coffee class="w-4 h-4" />
      Breakfast
    </button>
  </div>

  <!-- Detailed Filters -->
  <div class="detailed-filters">
    <!-- Price Range -->
    <div class="filter-group">
      <h4>Price per night</h4>
      <div class="price-range-filter">
        <div class="price-slider">
          <input type="range" 
                 v-model="filters.priceMin" 
                 :min="priceRange.min" 
                 :max="priceRange.max" 
                 step="10" />
          <input type="range" 
                 v-model="filters.priceMax" 
                 :min="priceRange.min" 
                 :max="priceRange.max" 
                 step="10" />
        </div>
        <div class="price-inputs">
          <input type="number" v-model="filters.priceMin" class="price-input" />
          <span>to</span>
          <input type="number" v-model="filters.priceMax" class="price-input" />
        </div>
      </div>
    </div>

    <!-- Property Types -->
    <div class="filter-group">
      <h4>Property type</h4>
      <div class="property-type-grid">
        <label class="property-type-option" v-for="type in propertyTypes" :key="type.id">
          <input type="checkbox" v-model="filters.propertyTypes" :value="type.id" />
          <div class="type-card">
            <component :is="type.icon" class="w-6 h-6" />
            <span class="type-name">{{ type.name }}</span>
            <span class="type-count">{{ type.count }}</span>
          </div>
        </label>
      </div>
    </div>

    <!-- Star Rating -->
    <div class="filter-group">
      <h4>Star rating</h4>
      <div class="star-rating-filters">
        <label class="star-filter" v-for="rating in [5, 4, 3, 2, 1]" :key="rating">
          <input type="checkbox" v-model="filters.starRatings" :value="rating" />
          <div class="star-display">
            <Star v-for="star in rating" :key="star" class="w-4 h-4 text-amber-400" />
            <span class="rating-text">{{ rating }} star{{ rating > 1 ? 's' : '' }}</span>
          </div>
        </label>
      </div>
    </div>

    <!-- Guest Rating -->
    <div class="filter-group">
      <h4>Guest rating</h4>
      <div class="guest-rating-filters">
        <label class="rating-filter" v-for="threshold in ratingThresholds" :key="threshold.value">
          <input type="radio" name="guestRating" v-model="filters.guestRating" :value="threshold.value" />
          <div class="rating-option">
            <span class="rating-score">{{ threshold.value }}+</span>
            <span class="rating-label">{{ threshold.label }}</span>
          </div>
        </label>
      </div>
    </div>

    <!-- Location Preferences -->
    <div class="filter-group">
      <h4>Location preferences</h4>
      <div class="location-filters">
        <label class="location-filter" v-for="area in locationAreas" :key="area.id">
          <input type="checkbox" v-model="filters.locationAreas" :value="area.id" />
          <div class="area-info">
            <span class="area-name">{{ area.name }}</span>
            <span class="area-description">{{ area.description }}</span>
            <span class="hotel-count">{{ area.hotelCount }} hotels</span>
          </div>
        </label>
      </div>
    </div>

    <!-- Amenities -->
    <div class="filter-group">
      <h4>Amenities</h4>
      <div class="amenity-filters">
        <div class="amenity-category" v-for="category in amenityCategories" :key="category.name">
          <h5>{{ category.name }}</h5>
          <div class="amenity-options">
            <label class="amenity-option" v-for="amenity in category.amenities" :key="amenity.id">
              <input type="checkbox" v-model="filters.amenities" :value="amenity.id" />
              <component :is="amenity.icon" class="w-4 h-4" />
              <span>{{ amenity.name }}</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Accessibility -->
    <div class="filter-group">
      <h4>Accessibility</h4>
      <div class="accessibility-filters">
        <label class="accessibility-option" v-for="feature in accessibilityFeatures" :key="feature.id">
          <input type="checkbox" v-model="filters.accessibility" :value="feature.id" />
          <component :is="feature.icon" class="w-4 h-4" />
          <span>{{ feature.name }}</span>
        </label>
      </div>
    </div>

    <!-- Sustainability -->
    <div class="filter-group">
      <h4>Sustainability</h4>
      <div class="sustainability-filters">
        <label class="sustainability-option">
          <input type="checkbox" v-model="filters.sustainabilityOnly" />
          <Leaf class="w-4 h-4 text-green-400" />
          <span>Eco-certified properties only</span>
        </label>
      </div>
    </div>
  </div>
</div>
```

### **Smart Ranking Algorithm**

```javascript
const hotelRankingSystem = {
  // Multi-factor scoring algorithm
  calculateHotelScore: (hotel, userPreferences, tripContext) => {
    const weights = {
      price: 0.25,
      rating: 0.20,
      location: 0.20,
      amenities: 0.15,
      reviews: 0.10,
      availability: 0.10
    };

    const scores = {
      // Price competitiveness (lower is better)
      price: 1 - (hotel.price - priceRange.min) / (priceRange.max - priceRange.min),
      
      // Guest rating score
      rating: hotel.reviews.averageRating / 10,
      
      // Location relevance
      location: calculateLocationScore(hotel, userPreferences, tripContext),
      
      // Amenity match
      amenities: calculateAmenityScore(hotel.amenities, userPreferences),
      
      // Review quality and recency
      reviews: calculateReviewScore(hotel.reviews),
      
      // Availability and booking conditions
      availability: calculateAvailabilityScore(hotel.availability)
    };

    // Calculate weighted score
    let totalScore = 0;
    for (const [factor, score] of Object.entries(scores)) {
      totalScore += weights[factor] * score;
    }

    return {
      totalScore,
      breakdown: scores,
      explanation: generateScoreExplanation(scores, weights)
    };
  },

  // Location scoring based on user interests
  calculateLocationScore: (hotel, preferences, tripContext) => {
    let score = 0;
    
    // Distance to city center (closer is generally better)
    const centerScore = Math.max(0, 1 - hotel.location.distanceToCenter / 10);
    score += centerScore * 0.3;
    
    // Proximity to transportation
    const transportScore = hotel.location.nearbyTransport.length / 5;
    score += Math.min(transportScore, 1) * 0.2;
    
    // Match with user interests
    const interestScore = calculateInterestProximity(hotel.location, preferences.interests);
    score += interestScore * 0.3;
    
    // Neighborhood safety and desirability
    const neighborhoodScore = hotel.location.neighborhood.safetyRating / 10;
    score += neighborhoodScore * 0.2;
    
    return Math.min(score, 1);
  },

  // Amenity matching based on user preferences and trip type
  calculateAmenityScore: (hotelAmenities, userPreferences) => {
    const preferenceWeights = {
      business: { wifi: 1.0, gym: 0.3, pool: 0.2, spa: 0.1 },
      leisure: { pool: 1.0, spa: 0.8, wifi: 0.6, gym: 0.4 },
      family: { pool: 1.0, restaurant: 0.8, wifi: 0.7, parking: 0.6 },
      romantic: { spa: 1.0, restaurant: 0.9, pool: 0.7, room_service: 0.6 }
    };
    
    const weights = preferenceWeights[userPreferences.tripType] || preferenceWeights.leisure;
    let score = 0;
    let totalWeight = 0;
    
    for (const [amenity, weight] of Object.entries(weights)) {
      if (hotelAmenities.includes(amenity)) {
        score += weight;
      }
      totalWeight += weight;
    }
    
    return totalWeight > 0 ? score / totalWeight : 0;
  }
};
```

---

## 📱 MOBILE-OPTIMIZED CARDS

### **Responsive Card Layout**

```html
<!-- Mobile-First Hotel Card -->
<div class="hotel-card mobile-optimized">
  <!-- Mobile Image Carousel -->
  <div class="mobile-gallery">
    <div class="image-carousel" ref="carousel">
      <div class="carousel-track" :style="{ transform: `translateX(-${currentImageIndex * 100}%)` }">
        <img v-for="(image, index) in hotel.images.all" 
             :key="index"
             :src="image" 
             class="carousel-image" />
      </div>
    </div>
    
    <div class="carousel-indicators">
      <div class="indicator" 
           v-for="(image, index) in hotel.images.all" 
           :key="index"
           :class="{ active: currentImageIndex === index }"
           @click="currentImageIndex = index"></div>
    </div>
    
    <div class="mobile-actions">
      <button class="mobile-pin" :class="{ active: hotel.isPinned }">
        <Pin class="w-4 h-4" />
      </button>
    </div>
  </div>

  <!-- Condensed Info -->
  <div class="mobile-hotel-info">
    <div class="hotel-header-mobile">
      <h3 class="hotel-name-mobile">{{ hotel.name }}</h3>
      <div class="rating-price-row">
        <div class="rating-compact">
          <span class="rating-score">{{ hotel.reviews.averageRating }}</span>
          <span class="rating-count">({{ hotel.reviews.totalReviews }})</span>
        </div>
        <div class="price-compact">
          <span class="price">{{ formatPrice(hotel.pricing.nightlyRate) }}</span>
          <span class="period">/night</span>
        </div>
      </div>
    </div>
    
    <div class="location-row">
      <MapPin class="w-3 h-3 text-emerald-400" />
      <span class="neighborhood">{{ hotel.location.neighborhood }}</span>
      <span class="distance">{{ hotel.location.distanceToCenter }} to center</span>
    </div>
    
    <div class="amenities-row">
      <div class="key-amenity" v-for="amenity in hotel.amenities.top3" :key="amenity.id">
        <component :is="amenity.icon" class="w-3 h-3" />
      </div>
      <span class="amenity-count">+{{ hotel.amenities.total - 3 }} more</span>
    </div>
    
    <div class="mobile-cta">
      <button class="btn-primary btn-block" @click="selectHotel(hotel)">
        Select Hotel
      </button>
    </div>
  </div>
</div>
```

---

## 🌟 GUEST REVIEWS INTEGRATION

### **Enhanced Review System**

```html
<div class="reviews-detailed" v-if="showDetailedReviews">
  <div class="review-overview">
    <div class="rating-breakdown">
      <div class="overall-rating">
        <span class="rating-large">{{ hotel.reviews.averageRating }}</span>
        <div class="rating-context">
          <span class="rating-label">{{ getRatingLabel(hotel.reviews.averageRating) }}</span>
          <span class="review-count">{{ hotel.reviews.totalReviews }} reviews</span>
        </div>
      </div>
      
      <div class="category-ratings">
        <div class="rating-category" v-for="category in hotel.reviews.categories" :key="category.name">
          <span class="category-name">{{ category.name }}</span>
          <div class="rating-bar">
            <div class="bar-background"></div>
            <div class="bar-fill" :style="{ width: category.score * 10 + '%' }"></div>
          </div>
          <span class="category-score">{{ category.score }}/10</span>
        </div>
      </div>
    </div>
    
    <div class="review-highlights">
      <h4>What guests love</h4>
      <div class="highlight-tags">
        <span class="highlight-tag" v-for="highlight in hotel.reviews.highlights" :key="highlight">
          {{ highlight }}
        </span>
      </div>
    </div>
  </div>

  <div class="recent-reviews">
    <div class="review-filters">
      <select v-model="reviewFilter">
        <option value="all">All reviews</option>
        <option value="recent">Most recent</option>
        <option value="helpful">Most helpful</option>
        <option value="couples">Couples</option>
        <option value="families">Families</option>
        <option value="solo">Solo travelers</option>
        <option value="business">Business</option>
      </select>
    </div>
    
    <div class="review-list">
      <div class="review-item" v-for="review in filteredReviews" :key="review.id">
        <div class="review-header">
          <div class="reviewer-info">
            <div class="reviewer-avatar">
              <img :src="review.author.avatar" :alt="review.author.name" />
            </div>
            <div class="reviewer-details">
              <span class="reviewer-name">{{ review.author.name }}</span>
              <span class="reviewer-location">{{ review.author.location }}</span>
              <span class="traveler-type">{{ review.author.travelerType }}</span>
            </div>
          </div>
          
          <div class="review-meta">
            <div class="review-rating">
              <span class="rating-score">{{ review.rating }}/10</span>
            </div>
            <span class="review-date">{{ formatDate(review.date) }}</span>
          </div>
        </div>
        
        <div class="review-content">
          <div class="review-title">{{ review.title }}</div>
          <div class="review-text">{{ review.text }}</div>
          
          <div class="review-aspects" v-if="review.aspects">
            <div class="aspect" v-for="aspect in review.aspects" :key="aspect.name">
              <span class="aspect-name">{{ aspect.name }}:</span>
              <span class="aspect-rating">{{ aspect.rating }}/10</span>
            </div>
          </div>
        </div>
        
        <div class="review-actions">
          <button class="helpful-btn" :class="{ voted: review.userVoted }" @click="markHelpful(review.id)">
            <ThumbsUp class="w-3 h-3" />
            Helpful ({{ review.helpfulCount }})
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## 🎯 CONTEXTUAL RECOMMENDATIONS

### **Smart Recommendation Engine**

```javascript
const recommendationEngine = {
  // Generate contextual hotel suggestions
  generateRecommendations: (userPreferences, tripContext, currentSelection) => {
    const recommendations = {
      // Price-conscious alternatives
      budgetAlternatives: findBudgetAlternatives(currentSelection, userPreferences.budget),
      
      // Location-based suggestions
      nearbyOptions: findNearbyHotels(currentSelection, 2), // within 2km
      
      // Similar properties with better ratings
      betterRated: findBetterRatedSimilar(currentSelection),
      
      // Unique local experiences
      localExperiences: findUniqueProperties(tripContext.destination),
      
      // Last-minute deals
      deals: findDeals(tripContext.dates, currentSelection.priceRange)
    };

    return recommendations;
  },

  // Personalization based on user behavior
  personalizeResults: (hotels, userProfile, searchHistory) => {
    return hotels.map(hotel => {
      // Calculate personalization score
      let personalScore = 0;
      
      // Previous booking patterns
      if (userProfile.preferredHotelTypes.includes(hotel.propertyType)) {
        personalScore += 0.2;
      }
      
      // Amenity preferences from past stays
      const amenityMatch = hotel.amenities.filter(amenity => 
        userProfile.preferredAmenities.includes(amenity)
      ).length / userProfile.preferredAmenities.length;
      personalScore += amenityMatch * 0.3;
      
      // Price range comfort zone
      const priceComfort = 1 - Math.abs(hotel.price - userProfile.averageSpend) / userProfile.averageSpend;
      personalScore += Math.max(priceComfort, 0) * 0.2;
      
      // Location type preference
      if (userProfile.locationPreferences.includes(hotel.location.type)) {
        personalScore += 0.15;
      }
      
      // Review score weight based on user's sensitivity to ratings
      const reviewWeight = userProfile.reviewSensitivity || 0.5;
      personalScore += (hotel.reviews.averageRating / 10) * reviewWeight * 0.15;
      
      return {
        ...hotel,
        personalScore,
        personalizedReason: generatePersonalizationReason(hotel, userProfile)
      };
    }).sort((a, b) => b.personalScore - a.personalScore);
  }
};
```

---

## 🔄 BOOKING INTEGRATION & FLOW

### **Seamless Selection Process**

```html
<div class="hotel-selection-flow">
  <!-- Selected Hotels Summary -->
  <div class="selected-accommodations" v-if="selectedHotels.length">
    <h3>Selected Accommodations</h3>
    <div class="selected-list">
      <div class="selected-hotel" v-for="hotel in selectedHotels" :key="hotel.id">
        <img :src="hotel.images.thumbnail" :alt="hotel.name" class="selected-thumbnail" />
        <div class="selected-info">
          <h4>{{ hotel.name }}</h4>
          <div class="selected-details">
            <span class="dates">{{ formatDateRange(hotel.checkIn, hotel.checkOut) }}</span>
            <span class="room-type">{{ hotel.selectedRoom.name }}</span>
            <span class="guests">{{ hotel.guests }} guests</span>
          </div>
        </div>
        <div class="selected-price">
          <span class="total">{{ formatPrice(hotel.totalPrice) }}</span>
          <span class="nights">{{ hotel.nights }} nights</span>
        </div>
        <button class="remove-selection" @click="removeHotel(hotel.id)">
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
    
    <div class="accommodation-total">
      <div class="total-breakdown">
        <div class="breakdown-line">
          <span>Accommodation ({{ totalNights }} nights)</span>
          <span>{{ formatPrice(accommodationSubtotal) }}</span>
        </div>
        <div class="breakdown-line" v-if="taxesAndFees > 0">
          <span>Taxes & fees</span>
          <span>{{ formatPrice(taxesAndFees) }}</span>
        </div>
        <div class="breakdown-line total">
          <span>Total accommodation</span>
          <span>{{ formatPrice(accommodationTotal) }}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Room Selection Modal -->
  <div class="room-selection-modal" v-if="showRoomSelection">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Choose your room at {{ selectedHotel.name }}</h3>
        <button class="modal-close" @click="closeRoomSelection">
          <X class="w-5 h-5" />
        </button>
      </div>
      
      <div class="room-options">
        <div class="room-option" 
             v-for="room in availableRooms" 
             :key="room.id"
             :class="{ selected: selectedRoom === room.id }">
          
          <div class="room-image">
            <img :src="room.image" :alt="room.name" />
          </div>
          
          <div class="room-details">
            <h4>{{ room.name }}</h4>
            <div class="room-specs">
              <span class="room-size">{{ room.size }} m²</span>
              <span class="room-bed">{{ room.bedType }}</span>
              <span class="room-capacity">{{ room.maxGuests }} guests</span>
            </div>
            
            <div class="room-amenities">
              <span class="room-amenity" v-for="amenity in room.amenities" :key="amenity">
                {{ amenity }}
              </span>
            </div>
          </div>
          
          <div class="room-pricing">
            <div class="room-price">
              <span class="price-amount">{{ formatPrice(room.price) }}</span>
              <span class="price-period">/night</span>
            </div>
            
            <div class="booking-conditions">
              <span class="condition" v-if="room.freeCancellation">
                <Shield class="w-3 h-3 text-green-400" />
                Free cancellation
              </span>
              <span class="condition" v-if="room.payLater">
                <Clock class="w-3 h-3 text-blue-400" />
                Pay at hotel
              </span>
            </div>
            
            <button class="btn-primary" @click="selectRoom(room)">
              Select Room
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Booking Actions -->
  <div class="booking-actions" v-if="selectedHotels.length">
    <div class="booking-summary">
      <span class="summary-text">{{ selectedHotels.length }} accommodation{{ selectedHotels.length > 1 ? 's' : '' }} selected</span>
      <span class="summary-total">{{ formatPrice(accommodationTotal) }}</span>
    </div>
    
    <div class="action-buttons">
      <button class="btn-primary btn-lg" @click="proceedToBooking">
        <CreditCard class="w-5 h-5 mr-2" />
        Continue to Booking
      </button>
      
      <div class="secondary-actions">
        <button class="btn-ghost" @click="addToItinerary">
          <Calendar class="w-4 h-4 mr-2" />
          Add to Trip Plan
        </button>
        <button class="btn-ghost" @click="saveSelections">
          <Bookmark class="w-4 h-4 mr-2" />
          Save for Later
        </button>
      </div>
    </div>
  </div>
</div>
```

This comprehensive accommodation discovery system transforms the basic hotel listing into a rich, visual, and intelligent discovery experience that helps users find not just a place to stay, but the perfect base for their adventure. The system combines beautiful visuals, smart filtering, location intelligence, and seamless booking integration to create a superior user experience.

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Phase 1: Site Audit & Analysis - Crawl current tripthesia.vercel.app and document all flaws", "status": "completed", "id": "audit-analysis"}, {"content": "Phase 2: Design System & Brand Guidelines - Create comprehensive design tokens and component library", "status": "completed", "id": "design-system"}, {"content": "Phase 3: Information Architecture - Restructure sitemap and navigation flows", "status": "completed", "id": "information-architecture"}, {"content": "Phase 4: Landing Page Redesign - Dynamic hero with interactive world map", "status": "completed", "id": "landing-redesign"}, {"content": "Phase 5: Trip Wizard Overhaul - From/To autocomplete, calendar picker, trip type selector", "status": "completed", "id": "wizard-overhaul"}, {"content": "Phase 6: Transport Integration - Multi-modal air/rail/road with infinite scroll", "status": "completed", "id": "transport-integration"}, {"content": "Phase 7: Accommodation & Activities - Rich cards with images, reviews, and ranking", "status": "in_progress", "id": "accommodation-activities"}, {"content": "Phase 8: Interactive Planner - Drag/drop timeline with reflow and reroute", "status": "pending", "id": "interactive-planner"}, {"content": "Phase 9: Global Features - Multi-currency, localization, regional pricing", "status": "pending", "id": "global-features"}, {"content": "Phase 10: Performance & Accessibility - WCAG AA compliance, performance optimization", "status": "pending", "id": "performance-accessibility"}]