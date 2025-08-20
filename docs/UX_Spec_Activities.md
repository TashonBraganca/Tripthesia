# Activities Discovery UX Specifications v1.1

**Version**: 1.1.0  
**Last Updated**: August 19, 2025  
**Status**: Visual Discovery Phase  
**Objective**: Transform activity search into engaging exploration experience with intelligent recommendations

---

## 🎯 ACTIVITIES TRANSFORMATION OVERVIEW

### **Current State Critical Issues**
- ❌ **Generic activity lists**: Basic text-based results without visual appeal
- ❌ **No weather integration**: Activities shown regardless of weather suitability
- ❌ **Missing opening hours**: No awareness of when activities are available
- ❌ **Limited categorization**: Poor organization by interests and themes
- ❌ **No difficulty levels**: Missing accessibility and skill level information
- ❌ **Static pricing**: No real-time rates or seasonal variations
- ❌ **Poor mobile UX**: Cards don't work well on small screens
- ❌ **No social proof**: Missing reviews, ratings, and user-generated content

### **New Vision: Intelligent Activity Discovery**

> **Transform activity search into an intelligent, visually rich discovery platform that understands weather conditions, opening hours, user interests, difficulty levels, and seasonal availability to recommend the perfect experiences for every moment of the trip.**

---

## 🎨 ACTIVITY DISCOVERY INTERFACE

### **Activity Card Design System**

```html
<div class="activities-discovery">
  <!-- Activity Category Tabs -->
  <div class="category-navigation">
    <div class="category-scroll" ref="categoryScroll">
      <button class="category-tab" 
              v-for="category in activityCategories" 
              :key="category.id"
              :class="{ active: selectedCategory === category.id }"
              @click="selectCategory(category.id)">
        <component :is="category.icon" class="w-5 h-5" />
        <span>{{ category.name }}</span>
        <span class="category-count">{{ category.count }}</span>
      </button>
    </div>
  </div>

  <!-- Smart Filters Row -->
  <div class="smart-filters">
    <div class="context-filters">
      <button class="context-filter weather-filter" 
              :class="{ active: filters.weatherAware }"
              @click="toggleWeatherFilter">
        <component :is="getWeatherIcon(currentWeather)" class="w-4 h-4" />
        Weather-appropriate
      </button>
      
      <button class="context-filter time-filter" 
              :class="{ active: filters.openNow }"
              @click="toggleOpenNowFilter">
        <Clock class="w-4 h-4" />
        Open now
      </button>
      
      <button class="context-filter distance-filter" 
              :class="{ active: filters.nearby }"
              @click="toggleDistanceFilter">
        <MapPin class="w-4 h-4" />
        Within {{ maxDistance }}km
      </button>
      
      <button class="context-filter rating-filter" 
              :class="{ active: filters.topRated }"
              @click="toggleRatingFilter">
        <Star class="w-4 h-4" />
        Top rated
      </button>
    </div>
    
    <div class="filter-actions">
      <button class="advanced-filters-btn" @click="showAdvancedFilters = !showAdvancedFilters">
        <Filter class="w-4 h-4 mr-2" />
        More filters
      </button>
    </div>
  </div>

  <!-- Activities Grid -->
  <div class="activities-grid">
    <div class="activity-card" 
         v-for="activity in displayedActivities" 
         :key="activity.id"
         :class="{ 
           pinned: activity.isPinned, 
           featured: activity.isFeatured,
           'weather-unsuitable': !activity.weatherSuitable,
           closed: !activity.currentlyOpen 
         }">
      
      <!-- Activity Image & Status -->
      <div class="activity-media">
        <div class="main-image-container">
          <img :src="activity.images.hero" 
               :alt="activity.name" 
               class="activity-image"
               @click="openActivityGallery(activity.id)" />
          
          <!-- Status Overlays -->
          <div class="status-overlays">
            <div class="weather-status" v-if="!activity.weatherSuitable">
              <CloudRain class="w-4 h-4" />
              <span>Weather dependent</span>
            </div>
            
            <div class="time-status" v-if="!activity.currentlyOpen && activity.openingHours">
              <Clock class="w-4 h-4" />
              <span>Opens at {{ activity.openingHours.nextOpen }}</span>
            </div>
            
            <div class="booking-urgency" v-if="activity.urgency">
              <AlertTriangle class="w-4 h-4" />
              <span>{{ activity.urgency }}</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="activity-actions">
            <button class="action-btn pin-btn" 
                    :class="{ active: activity.isPinned }"
                    @click="toggleActivityPin(activity.id)">
              <Pin class="w-4 h-4" />
            </button>
            <button class="action-btn share-btn" 
                    @click="shareActivity(activity.id)">
              <Share2 class="w-4 h-4" />
            </button>
          </div>

          <!-- Image Gallery Indicator -->
          <button class="gallery-indicator" @click="openActivityGallery(activity.id)">
            <Camera class="w-4 h-4" />
            <span>{{ activity.images.total }}</span>
          </button>
        </div>

        <!-- Additional Media -->
        <div class="media-thumbnails" v-if="activity.images.thumbnails.length > 1">
          <img v-for="(thumb, index) in activity.images.thumbnails.slice(0, 3)" 
               :key="index"
               :src="thumb" 
               class="media-thumb"
               @click="openActivityGallery(activity.id, index)" />
          <div class="more-media" 
               v-if="activity.images.total > 4"
               @click="openActivityGallery(activity.id)">
            <Plus class="w-3 h-3" />
          </div>
        </div>
      </div>

      <!-- Activity Information -->
      <div class="activity-info">
        <!-- Header Section -->
        <div class="activity-header">
          <div class="activity-title-section">
            <h3 class="activity-name">{{ activity.name }}</h3>
            <div class="activity-meta">
              <span class="category-badge" :class="activity.category.toLowerCase()">
                <component :is="activity.category.icon" class="w-3 h-3" />
                {{ activity.category.name }}
              </span>
              <span class="difficulty-badge" v-if="activity.difficulty">
                {{ getDifficultyIcon(activity.difficulty) }}
                {{ activity.difficulty }}
              </span>
            </div>
          </div>
          
          <div class="activity-badges">
            <span class="badge featured" v-if="activity.isFeatured">Featured</span>
            <span class="badge new" v-if="activity.isNew">New</span>
            <span class="badge popular" v-if="activity.isPopular">Popular</span>
          </div>
        </div>

        <!-- Quick Info -->
        <div class="activity-quick-info">
          <div class="info-item">
            <MapPin class="w-4 h-4 text-emerald-400" />
            <span class="location">{{ activity.location.area }}</span>
            <span class="distance">{{ activity.location.distance }} away</span>
          </div>
          
          <div class="info-item" v-if="activity.duration">
            <Clock class="w-4 h-4 text-sky-400" />
            <span class="duration">{{ formatDuration(activity.duration) }}</span>
            <span class="duration-type">{{ activity.durationType }}</span>
          </div>
          
          <div class="info-item" v-if="activity.groupSize">
            <Users class="w-4 h-4 text-amber-400" />
            <span class="group-info">{{ activity.groupSize }}</span>
          </div>
        </div>

        <!-- Description -->
        <div class="activity-description">
          <p>{{ activity.description }}</p>
        </div>

        <!-- Highlights -->
        <div class="activity-highlights" v-if="activity.highlights.length">
          <div class="highlight-tags">
            <span class="highlight-tag" 
                  v-for="highlight in activity.highlights.slice(0, 3)" 
                  :key="highlight">
              {{ highlight }}
            </span>
            <button class="more-highlights" 
                    v-if="activity.highlights.length > 3"
                    @click="showAllHighlights(activity.id)">
              +{{ activity.highlights.length - 3 }}
            </button>
          </div>
        </div>

        <!-- Reviews & Rating -->
        <div class="activity-reviews">
          <div class="rating-summary">
            <div class="rating-display">
              <Star class="w-4 h-4 text-amber-400" />
              <span class="rating-score">{{ activity.rating.average }}</span>
              <span class="rating-count">({{ activity.rating.count }})</span>
            </div>
            
            <div class="rating-breakdown" v-if="activity.rating.breakdown">
              <div class="rating-aspect" 
                   v-for="aspect in activity.rating.breakdown" 
                   :key="aspect.name">
                <span class="aspect-name">{{ aspect.name }}</span>
                <div class="aspect-bar">
                  <div class="aspect-fill" :style="{ width: aspect.score * 10 + '%' }"></div>
                </div>
                <span class="aspect-score">{{ aspect.score }}/10</span>
              </div>
            </div>
          </div>

          <!-- Recent Review -->
          <div class="recent-review" v-if="activity.reviews.recent">
            <blockquote>"{{ activity.reviews.recent.text }}"</blockquote>
            <cite>{{ activity.reviews.recent.author }} • {{ formatDate(activity.reviews.recent.date) }}</cite>
          </div>
        </div>

        <!-- Practical Information -->
        <div class="practical-info">
          <!-- Opening Hours -->
          <div class="hours-info" v-if="activity.openingHours">
            <div class="hours-display">
              <Clock class="w-4 h-4" :class="activity.currentlyOpen ? 'text-green-400' : 'text-red-400'" />
              <span class="hours-status">
                {{ activity.currentlyOpen ? 'Open now' : 'Closed' }}
              </span>
              <span class="hours-details">
                {{ activity.openingHours.today }}
              </span>
            </div>
            
            <button class="hours-expand" @click="showFullHours(activity.id)">
              View all hours
            </button>
          </div>

          <!-- Weather Suitability -->
          <div class="weather-info" v-if="showWeatherContext">
            <div class="weather-display">
              <component :is="getWeatherIcon(currentWeather)" class="w-4 h-4" />
              <span class="weather-status" :class="activity.weatherSuitable ? 'suitable' : 'unsuitable'">
                {{ activity.weatherSuitable ? 'Perfect weather' : 'Weather dependent' }}
              </span>
            </div>
            
            <div class="weather-details" v-if="!activity.weatherSuitable">
              <span>Best in {{ activity.idealWeather.join(', ') }} conditions</span>
            </div>
          </div>

          <!-- Booking Requirements -->
          <div class="booking-requirements" v-if="activity.bookingInfo">
            <div class="requirement-item" v-if="activity.bookingInfo.advanceNotice">
              <Calendar class="w-4 h-4 text-blue-400" />
              <span>Book {{ activity.bookingInfo.advanceNotice }} in advance</span>
            </div>
            
            <div class="requirement-item" v-if="activity.bookingInfo.ageRestriction">
              <Users class="w-4 h-4 text-orange-400" />
              <span>{{ activity.bookingInfo.ageRestriction }}</span>
            </div>
            
            <div class="requirement-item" v-if="activity.bookingInfo.fitnessLevel">
              <Zap class="w-4 h-4 text-red-400" />
              <span>{{ activity.bookingInfo.fitnessLevel }} fitness required</span>
            </div>
          </div>
        </div>

        <!-- Pricing Section -->
        <div class="activity-pricing">
          <div class="price-display">
            <div class="main-price">
              <span class="currency">{{ userCurrency }}</span>
              <span class="price-amount">{{ formatPrice(activity.pricing.from) }}</span>
              <span class="price-qualifier">{{ activity.pricing.qualifier }}</span>
            </div>
            
            <div class="price-context">
              <div class="price-range" v-if="activity.pricing.range">
                <span>{{ formatPrice(activity.pricing.from) }} - {{ formatPrice(activity.pricing.to) }}</span>
              </div>
              
              <div class="price-includes" v-if="activity.pricing.includes">
                <span class="includes-text">Includes: {{ activity.pricing.includes.join(', ') }}</span>
              </div>
            </div>
          </div>

          <!-- Booking Options -->
          <div class="booking-options" v-if="activity.bookingOptions">
            <div class="booking-option" 
                 v-for="option in activity.bookingOptions" 
                 :key="option.id">
              <span class="option-name">{{ option.name }}</span>
              <span class="option-price">{{ formatPrice(option.price) }}</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="activity-cta">
          <button class="btn-primary activity-select" @click="addToItinerary(activity)">
            <Plus class="w-4 h-4 mr-2" />
            Add to Day
          </button>
          
          <div class="secondary-actions">
            <button class="btn-ghost btn-sm" @click="viewActivityDetails(activity)">
              View Details
            </button>
            <button class="btn-ghost btn-sm" @click="checkAvailability(activity)">
              Check Times
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Load More Activities -->
  <div class="load-more-section" v-if="hasMoreActivities">
    <button class="btn-outline load-more-btn" 
            :disabled="loadingMore"
            @click="loadMoreActivities">
      <div class="loader" v-if="loadingMore"></div>
      <span v-else>Discover more activities</span>
    </button>
  </div>
</div>
```

---

## 🌦️ WEATHER-AWARE RECOMMENDATIONS

### **Smart Weather Integration**

```html
<div class="weather-intelligence">
  <!-- Current Weather Context -->
  <div class="weather-context-bar">
    <div class="current-weather">
      <component :is="getCurrentWeatherIcon()" class="w-6 h-6" />
      <div class="weather-info">
        <span class="temperature">{{ currentWeather.temperature }}°C</span>
        <span class="condition">{{ currentWeather.condition }}</span>
        <span class="feels-like">Feels like {{ currentWeather.feelsLike }}°C</span>
      </div>
    </div>
    
    <div class="weather-recommendations">
      <span class="recommendation-text">
        {{ getWeatherRecommendation(currentWeather) }}
      </span>
      <button class="weather-filter-btn" @click="filterByWeather">
        Show weather-appropriate activities
      </button>
    </div>
  </div>

  <!-- Weather-Based Activity Suggestions -->
  <div class="weather-suggestions" v-if="weatherBasedSuggestions.length">
    <h3>Perfect for {{ currentWeather.condition.toLowerCase() }} weather</h3>
    <div class="suggestion-carousel">
      <div class="suggestion-card" 
           v-for="activity in weatherBasedSuggestions" 
           :key="activity.id">
        <img :src="activity.images.thumb" :alt="activity.name" />
        <div class="suggestion-info">
          <h4>{{ activity.name }}</h4>
          <div class="weather-match">
            <CheckCircle class="w-4 h-4 text-green-400" />
            <span>Great for {{ currentWeather.condition.toLowerCase() }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Weather Forecast Impact -->
  <div class="forecast-impact" v-if="showForecast">
    <h4>Weather for your trip</h4>
    <div class="forecast-timeline">
      <div class="forecast-day" 
           v-for="day in weatherForecast" 
           :key="day.date">
        <div class="day-header">
          <span class="day-name">{{ formatDayName(day.date) }}</span>
          <span class="day-date">{{ formatShortDate(day.date) }}</span>
        </div>
        
        <div class="day-weather">
          <component :is="getWeatherIcon(day.condition)" class="w-5 h-5" />
          <span class="temperature-range">{{ day.high }}°/{{ day.low }}°</span>
          <span class="rain-chance" v-if="day.precipitation > 20">
            {{ day.precipitation }}% rain
          </span>
        </div>
        
        <div class="day-activities">
          <div class="activity-recommendation" 
               v-for="rec in day.recommendations" 
               :key="rec.type">
            <component :is="rec.icon" class="w-4 h-4" />
            <span>{{ rec.text }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

### **Weather Intelligence Engine**

```javascript
const weatherIntelligence = {
  // Weather-activity matching logic
  getActivitySuitability: (activity, weather) => {
    const suitabilityRules = {
      outdoor: {
        sunny: 1.0,
        cloudy: 0.8,
        lightRain: 0.3,
        heavyRain: 0.1,
        snow: 0.2,
        extreme: 0.0
      },
      indoor: {
        sunny: 0.7,
        cloudy: 0.9,
        lightRain: 1.0,
        heavyRain: 1.0,
        snow: 1.0,
        extreme: 1.0
      },
      covered: {
        sunny: 0.9,
        cloudy: 1.0,
        lightRain: 0.8,
        heavyRain: 0.6,
        snow: 0.7,
        extreme: 0.3
      }
    };

    const baseScore = suitabilityRules[activity.type][weather.condition] || 0.5;
    
    // Adjust for temperature
    let tempAdjustment = 1.0;
    if (activity.temperaturePreference) {
      const ideal = activity.temperaturePreference;
      const diff = Math.abs(weather.temperature - ideal.optimal);
      tempAdjustment = Math.max(0.3, 1 - (diff / ideal.tolerance));
    }
    
    // Adjust for wind
    let windAdjustment = 1.0;
    if (activity.windSensitive && weather.windSpeed > 15) {
      windAdjustment = Math.max(0.4, 1 - (weather.windSpeed - 15) / 20);
    }
    
    return {
      score: baseScore * tempAdjustment * windAdjustment,
      suitable: baseScore * tempAdjustment * windAdjustment > 0.6,
      reasons: generateSuitabilityReasons(activity, weather)
    };
  },

  // Generate weather-based recommendations
  generateWeatherRecommendations: (activities, weather, forecast) => {
    const recommendations = {
      now: [],
      later: [],
      alternatives: []
    };

    activities.forEach(activity => {
      const suitability = this.getActivitySuitability(activity, weather);
      
      if (suitability.suitable) {
        recommendations.now.push({
          ...activity,
          weatherScore: suitability.score,
          weatherReasons: suitability.reasons
        });
      } else {
        // Find better weather windows in forecast
        const betterTimes = forecast.filter(day => 
          this.getActivitySuitability(activity, day).suitable
        );
        
        if (betterTimes.length > 0) {
          recommendations.later.push({
            ...activity,
            betterDays: betterTimes.map(day => day.date),
            weatherAdvice: `Better on ${betterTimes[0].dayName}`
          });
        } else {
          // Suggest indoor alternatives
          const alternatives = this.findIndoorAlternatives(activity);
          recommendations.alternatives.push(...alternatives);
        }
      }
    });

    return recommendations;
  }
};
```

---

## 🕒 TIME-AWARE ACTIVITY PLANNING

### **Opening Hours Intelligence**

```html
<div class="time-intelligence">
  <!-- Current Time Context -->
  <div class="time-context-bar">
    <div class="current-time">
      <Clock class="w-5 h-5 text-sky-400" />
      <span class="local-time">{{ currentLocalTime }}</span>
      <span class="timezone">{{ destinationTimezone }}</span>
    </div>
    
    <div class="time-filters">
      <button class="time-filter" 
              :class="{ active: timeFilter === 'open-now' }"
              @click="setTimeFilter('open-now')">
        Open Now
      </button>
      <button class="time-filter" 
              :class="{ active: timeFilter === 'open-soon' }"
              @click="setTimeFilter('open-soon')">
        Opening Soon
      </button>
      <button class="time-filter" 
              :class="{ active: timeFilter === 'open-later' }"
              @click="setTimeFilter('open-later')">
        Open Later Today
      </button>
    </div>
  </div>

  <!-- Time-Based Suggestions -->
  <div class="time-suggestions">
    <div class="suggestion-section" v-if="openNowActivities.length">
      <h3>
        <CheckCircle class="w-5 h-5 text-green-400" />
        Open right now ({{ openNowActivities.length }} activities)
      </h3>
      <div class="activity-quick-list">
        <div class="quick-activity" 
             v-for="activity in openNowActivities.slice(0, 6)" 
             :key="activity.id">
          <img :src="activity.images.thumb" :alt="activity.name" />
          <div class="quick-info">
            <span class="activity-name">{{ activity.name }}</span>
            <span class="closes-at">Closes at {{ activity.closingTime }}</span>
          </div>
          <button class="add-quick" @click="addToItinerary(activity)">
            <Plus class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <div class="suggestion-section" v-if="openingSoonActivities.length">
      <h3>
        <Clock class="w-5 h-5 text-amber-400" />
        Opening soon (next 2 hours)
      </h3>
      <div class="opening-soon-list">
        <div class="soon-activity" 
             v-for="activity in openingSoonActivities" 
             :key="activity.id">
          <div class="soon-info">
            <span class="activity-name">{{ activity.name }}</span>
            <span class="opening-time">Opens at {{ activity.openingTime }}</span>
            <span class="countdown">{{ getCountdown(activity.openingTime) }}</span>
          </div>
          <button class="schedule-btn" @click="scheduleActivity(activity)">
            Schedule
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Detailed Hours Display -->
  <div class="hours-modal" v-if="showingHours">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ selectedActivity.name }} - Opening Hours</h3>
        <button class="modal-close" @click="closeHoursModal">
          <X class="w-5 h-5" />
        </button>
      </div>
      
      <div class="hours-content">
        <div class="hours-week">
          <div class="day-hours" 
               v-for="day in selectedActivity.weeklyHours" 
               :key="day.day"
               :class="{ today: day.isToday, closed: day.closed }">
            <span class="day-name">{{ day.dayName }}</span>
            <span class="day-times" v-if="!day.closed">
              {{ day.open }} - {{ day.close }}
            </span>
            <span class="closed-text" v-else>Closed</span>
          </div>
        </div>
        
        <div class="hours-notes" v-if="selectedActivity.hoursNotes">
          <h4>Special Hours & Holidays</h4>
          <div class="notes-list">
            <div class="note-item" 
                 v-for="note in selectedActivity.hoursNotes" 
                 :key="note.id">
              <span class="note-date">{{ note.date }}</span>
              <span class="note-hours">{{ note.hours }}</span>
              <span class="note-reason">{{ note.reason }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## 🎨 CATEGORY-BASED DISCOVERY

### **Intelligent Category System**

```html
<div class="category-discovery">
  <!-- Main Category Grid -->
  <div class="category-grid">
    <div class="category-section" v-for="category in activityCategories" :key="category.id">
      <div class="category-header">
        <div class="category-title">
          <component :is="category.icon" class="w-6 h-6" :class="category.iconClass" />
          <h3>{{ category.name }}</h3>
          <span class="category-count">{{ category.activityCount }}</span>
        </div>
        
        <div class="category-actions">
          <button class="view-all-btn" @click="viewAllInCategory(category.id)">
            View all
          </button>
        </div>
      </div>

      <div class="category-description">
        <p>{{ category.description }}</p>
      </div>

      <!-- Featured Activities in Category -->
      <div class="featured-in-category">
        <div class="featured-activity" 
             v-for="activity in category.featured.slice(0, 3)" 
             :key="activity.id">
          <div class="featured-image">
            <img :src="activity.images.thumb" :alt="activity.name" />
            <div class="featured-overlay">
              <span class="featured-price">{{ formatPrice(activity.pricing.from) }}</span>
              <Star class="w-4 h-4 text-amber-400" />
              <span class="featured-rating">{{ activity.rating.average }}</span>
            </div>
          </div>
          
          <div class="featured-info">
            <h4>{{ activity.name }}</h4>
            <div class="featured-meta">
              <span class="duration">{{ formatDuration(activity.duration) }}</span>
              <span class="difficulty" v-if="activity.difficulty">{{ activity.difficulty }}</span>
            </div>
          </div>
          
          <button class="featured-add" @click="addToItinerary(activity)">
            <Plus class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Category Insights -->
      <div class="category-insights">
        <div class="insight-item" v-for="insight in category.insights" :key="insight.type">
          <component :is="insight.icon" class="w-4 h-4" />
          <span>{{ insight.text }}</span>
        </div>
      </div>
    </div>
  </div>
</div>
```

### **Activity Categories Configuration**

```javascript
const activityCategories = [
  {
    id: 'sightseeing',
    name: 'Sightseeing & Landmarks',
    icon: 'Camera',
    iconClass: 'text-blue-500',
    description: 'Iconic attractions, monuments, and must-see sights',
    color: '#3b82f6',
    keywords: ['landmarks', 'monuments', 'attractions', 'viewpoints', 'architecture'],
    typicalDuration: [60, 180], // 1-3 hours
    weatherDependency: 'medium',
    insights: [
      { type: 'peak', icon: 'Users', text: 'Best early morning or late afternoon' },
      { type: 'photo', icon: 'Camera', text: 'Golden hour photography spots' },
      { type: 'access', icon: 'MapPin', text: 'Public transport accessible' }
    ]
  },
  
  {
    id: 'museums',
    name: 'Museums & Galleries',
    icon: 'Building2',
    iconClass: 'text-purple-500',
    description: 'Art, history, science, and cultural exhibitions',
    color: '#8b5cf6',
    keywords: ['museums', 'galleries', 'exhibitions', 'art', 'history', 'science'],
    typicalDuration: [90, 240], // 1.5-4 hours
    weatherDependency: 'low',
    insights: [
      { type: 'weather', icon: 'CloudRain', text: 'Perfect for rainy days' },
      { type: 'time', icon: 'Clock', text: 'Allow 2-3 hours minimum' },
      { type: 'booking', icon: 'Calendar', text: 'Book ahead for popular exhibitions' }
    ]
  },
  
  {
    id: 'outdoor',
    name: 'Outdoor & Adventure',
    icon: 'Mountain',
    iconClass: 'text-green-500',
    description: 'Hiking, parks, outdoor sports, and nature activities',
    color: '#10b981',
    keywords: ['hiking', 'parks', 'nature', 'outdoor', 'adventure', 'sports'],
    typicalDuration: [120, 480], // 2-8 hours
    weatherDependency: 'high',
    insights: [
      { type: 'weather', icon: 'Sun', text: 'Weather dependent - check forecast' },
      { type: 'fitness', icon: 'Zap', text: 'Fitness levels vary' },
      { type: 'gear', icon: 'Backpack', text: 'May require special equipment' }
    ]
  },
  
  {
    id: 'food',
    name: 'Food & Drink',
    icon: 'ChefHat',
    iconClass: 'text-orange-500',
    description: 'Restaurants, food tours, markets, and culinary experiences',
    color: '#f97316',
    keywords: ['restaurants', 'food', 'culinary', 'markets', 'tours', 'tasting'],
    typicalDuration: [60, 180], // 1-3 hours
    weatherDependency: 'low',
    insights: [
      { type: 'booking', icon: 'Calendar', text: 'Reservations recommended' },
      { type: 'timing', icon: 'Clock', text: 'Consider meal times' },
      { type: 'local', icon: 'MapPin', text: 'Experience local specialties' }
    ]
  },
  
  {
    id: 'entertainment',
    name: 'Entertainment & Shows',
    icon: 'Music',
    iconClass: 'text-red-500',
    description: 'Theater, concerts, shows, and nightlife',
    color: '#ef4444',
    keywords: ['theater', 'shows', 'concerts', 'nightlife', 'entertainment'],
    typicalDuration: [90, 300], // 1.5-5 hours
    weatherDependency: 'low',
    insights: [
      { type: 'booking', icon: 'Ticket', text: 'Book tickets in advance' },
      { type: 'dress', icon: 'Shirt', text: 'Dress code may apply' },
      { type: 'timing', icon: 'Moon', text: 'Evening performances common' }
    ]
  },
  
  {
    id: 'shopping',
    name: 'Shopping',
    icon: 'ShoppingBag',
    iconClass: 'text-pink-500',
    description: 'Markets, boutiques, shopping districts, and local crafts',
    color: '#ec4899',
    keywords: ['shopping', 'markets', 'boutiques', 'crafts', 'souvenirs'],
    typicalDuration: [60, 240], // 1-4 hours
    weatherDependency: 'medium',
    insights: [
      { type: 'local', icon: 'Star', text: 'Unique local products' },
      { type: 'bargain', icon: 'DollarSign', text: 'Bargaining may be expected' },
      { type: 'hours', icon: 'Clock', text: 'Check opening hours' }
    ]
  },
  
  {
    id: 'wellness',
    name: 'Wellness & Relaxation',
    icon: 'Heart',
    iconClass: 'text-teal-500',
    description: 'Spas, wellness centers, yoga, and relaxation activities',
    color: '#14b8a6',
    keywords: ['spa', 'wellness', 'relaxation', 'massage', 'yoga'],
    typicalDuration: [60, 180], // 1-3 hours
    weatherDependency: 'low',
    insights: [
      { type: 'booking', icon: 'Calendar', text: 'Book treatments in advance' },
      { type: 'timing', icon: 'Clock', text: 'Perfect after active days' },
      { type: 'dress', icon: 'Shirt', text: 'Comfortable clothing recommended' }
    ]
  },
  
  {
    id: 'families',
    name: 'Family & Kids',
    icon: 'Users',
    iconClass: 'text-yellow-500',
    description: 'Family-friendly attractions, playgrounds, and kid activities',
    color: '#eab308',
    keywords: ['family', 'kids', 'children', 'playground', 'educational'],
    typicalDuration: [90, 300], // 1.5-5 hours
    weatherDependency: 'medium',
    insights: [
      { type: 'age', icon: 'Users', text: 'Age restrictions may apply' },
      { type: 'facilities', icon: 'Baby', text: 'Family facilities available' },
      { type: 'timing', icon: 'Clock', text: 'Plan around nap times' }
    ]
  }
];
```

---

## 🏆 INTELLIGENT RANKING SYSTEM

### **Multi-Factor Activity Scoring**

```javascript
const activityRankingSystem = {
  // Comprehensive scoring algorithm
  calculateActivityScore: (activity, userContext, timeContext, weatherContext) => {
    const weights = {
      relevance: 0.25,    // Match to user interests
      quality: 0.20,      // Reviews and ratings
      practicality: 0.20, // Time, weather, location fit
      value: 0.15,        // Price vs quality ratio
      uniqueness: 0.10,   // Special or unique experiences
      availability: 0.10   // Current availability
    };

    const scores = {
      relevance: calculateRelevanceScore(activity, userContext),
      quality: calculateQualityScore(activity),
      practicality: calculatePracticalityScore(activity, timeContext, weatherContext),
      value: calculateValueScore(activity),
      uniqueness: calculateUniquenessScore(activity),
      availability: calculateAvailabilityScore(activity, timeContext)
    };

    // Calculate weighted total
    let totalScore = 0;
    for (const [factor, score] of Object.entries(scores)) {
      totalScore += weights[factor] * score;
    }

    return {
      totalScore,
      breakdown: scores,
      explanation: generateScoreExplanation(scores, weights),
      badges: generateRecommendationBadges(activity, scores)
    };
  },

  // User interest matching
  calculateRelevanceScore: (activity, userContext) => {
    let score = 0.5; // baseline
    
    // Match primary interests
    const interestMatch = activity.categories.filter(cat => 
      userContext.interests.includes(cat)
    ).length / Math.max(userContext.interests.length, 1);
    score += interestMatch * 0.4;
    
    // Trip type alignment
    const tripTypeMatch = activity.suitableFor.includes(userContext.tripType) ? 0.3 : 0;
    score += tripTypeMatch;
    
    // Previous activity preferences
    if (userContext.activityHistory) {
      const historyMatch = calculateHistoryMatch(activity, userContext.activityHistory);
      score += historyMatch * 0.3;
    }
    
    return Math.min(score, 1);
  },

  // Quality assessment
  calculateQualityScore: (activity) => {
    let score = 0;
    
    // Base rating score (normalized)
    score += (activity.rating.average / 10) * 0.6;
    
    // Review count reliability
    const reviewReliability = Math.min(activity.rating.count / 100, 1) * 0.2;
    score += reviewReliability;
    
    // Recent review trend
    if (activity.rating.trend === 'improving') {
      score += 0.1;
    } else if (activity.rating.trend === 'declining') {
      score -= 0.1;
    }
    
    // Award/recognition bonus
    if (activity.awards && activity.awards.length > 0) {
      score += 0.1;
    }
    
    return Math.max(0, Math.min(score, 1));
  },

  // Practical considerations
  calculatePracticalityScore: (activity, timeContext, weatherContext) => {
    let score = 0.5;
    
    // Time suitability
    if (activity.currentlyOpen || activity.openingSoon) {
      score += 0.3;
    } else if (activity.openToday) {
      score += 0.1;
    } else {
      score -= 0.2;
    }
    
    // Weather suitability
    const weatherScore = weatherIntelligence.getActivitySuitability(activity, weatherContext).score;
    score += (weatherScore - 0.5) * 0.4;
    
    // Location convenience
    const distanceScore = Math.max(0, 1 - activity.distance / 10); // Closer is better
    score += distanceScore * 0.3;
    
    return Math.max(0, Math.min(score, 1));
  },

  // Value for money
  calculateValueScore: (activity) => {
    if (!activity.pricing.from) return 0.5;
    
    // Price per hour calculation
    const pricePerHour = activity.pricing.from / (activity.duration / 60);
    const categoryAveragePrice = getCategoryAveragePrice(activity.category);
    
    // Value relative to category average
    let valueScore = Math.max(0, 1 - (pricePerHour / categoryAveragePrice));
    
    // Free activities get bonus
    if (activity.pricing.from === 0) {
      valueScore = 1;
    }
    
    // Inclusions add value
    if (activity.pricing.includes && activity.pricing.includes.length > 0) {
      valueScore += 0.2;
    }
    
    return Math.min(valueScore, 1);
  },

  // Uniqueness and special appeal
  calculateUniquenessScore: (activity) => {
    let score = 0.5;
    
    // Unique or rare experience
    if (activity.tags.includes('unique') || activity.tags.includes('exclusive')) {
      score += 0.3;
    }
    
    // Local or cultural significance
    if (activity.tags.includes('local-favorite') || activity.tags.includes('cultural')) {
      score += 0.2;
    }
    
    // New or recently opened
    if (activity.isNew && activity.openedWithin < 180) { // within 6 months
      score += 0.2;
    }
    
    // Instagram/social media popularity
    if (activity.socialMediaMentions > 1000) {
      score += 0.1;
    }
    
    return Math.min(score, 1);
  }
};
```

---

## 📅 ITINERARY INTEGRATION

### **Add to Itinerary Flow**

```html
<div class="itinerary-integration">
  <!-- Add to Day Modal -->
  <div class="add-to-day-modal" v-if="showAddModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Add {{ selectedActivity.name }} to your trip</h3>
        <button class="modal-close" @click="closeAddModal">
          <X class="w-5 h-5" />
        </button>
      </div>
      
      <div class="day-selection">
        <h4>Which day?</h4>
        <div class="day-options">
          <div class="day-option" 
               v-for="day in tripDays" 
               :key="day.date"
               :class="{ 
                 selected: selectedDay === day.date,
                 full: day.activities.length >= 6,
                 unavailable: !isActivityAvailable(selectedActivity, day.date)
               }"
               @click="selectDay(day.date)">
            
            <div class="day-header">
              <span class="day-name">{{ formatDayName(day.date) }}</span>
              <span class="day-date">{{ formatShortDate(day.date) }}</span>
            </div>
            
            <div class="day-weather">
              <component :is="getWeatherIcon(day.weather)" class="w-4 h-4" />
              <span class="temp">{{ day.weather.high }}°</span>
            </div>
            
            <div class="day-status">
              <div class="activity-count">
                {{ day.activities.length }}/6 activities
              </div>
              <div class="availability-indicator">
                <CheckCircle v-if="isActivityAvailable(selectedActivity, day.date)" 
                           class="w-4 h-4 text-green-400" />
                <XCircle v-else class="w-4 h-4 text-red-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="time-selection" v-if="selectedDay">
        <h4>What time?</h4>
        <div class="time-suggestions">
          <button class="time-option" 
                  v-for="timeSlot in availableTimeSlots" 
                  :key="timeSlot.start"
                  :class="{ selected: selectedTime === timeSlot.start }"
                  @click="selectTime(timeSlot.start)">
            <span class="time-range">{{ timeSlot.start }} - {{ timeSlot.end }}</span>
            <span class="time-context">{{ timeSlot.context }}</span>
          </button>
          
          <button class="custom-time-btn" @click="showCustomTime = true">
            <Clock class="w-4 h-4 mr-2" />
            Choose custom time
          </button>
        </div>
      </div>
      
      <div class="booking-options" v-if="selectedActivity.bookingRequired">
        <h4>Booking required</h4>
        <div class="booking-info">
          <AlertTriangle class="w-5 h-5 text-amber-400" />
          <div class="booking-text">
            <p>This activity requires advance booking.</p>
            <p>Book now or we'll remind you closer to your trip.</p>
          </div>
        </div>
        
        <div class="booking-actions">
          <button class="btn-primary" @click="bookNow">
            Book Now
          </button>
          <button class="btn-ghost" @click="remindLater">
            Remind Me Later
          </button>
        </div>
      </div>
      
      <div class="modal-actions">
        <button class="btn-ghost" @click="cancelAdd">
          Cancel
        </button>
        <button class="btn-primary" 
                :disabled="!selectedDay || (!selectedTime && selectedActivity.timeSpecific)"
                @click="confirmAddToItinerary">
          <Plus class="w-4 h-4 mr-2" />
          Add to Itinerary
        </button>
      </div>
    </div>
  </div>

  <!-- Quick Add Success -->
  <div class="quick-add-success" v-if="showSuccessMessage">
    <div class="success-content">
      <CheckCircle class="w-6 h-6 text-green-400" />
      <div class="success-text">
        <span class="success-title">Added to {{ addedToDay }}</span>
        <span class="success-subtitle">{{ selectedActivity.name }}</span>
      </div>
    </div>
    
    <div class="success-actions">
      <button class="btn-ghost btn-sm" @click="viewItinerary">
        View Plan
      </button>
      <button class="btn-ghost btn-sm" @click="continueExploring">
        Keep Exploring
      </button>
    </div>
  </div>
</div>
```

This comprehensive activities discovery system transforms basic activity listings into an intelligent, visually rich, and contextually aware exploration platform that considers weather, time, user preferences, and practical constraints to help users discover and plan the perfect experiences for their trip.