# Transport Integration UX Specifications v1.1

**Version**: 1.1.0  
**Last Updated**: August 19, 2025  
**Status**: Multi-Modal Transport Phase  
**Objective**: Transform basic flight search into comprehensive transport discovery

---

## 🚀 TRANSPORT TRANSFORMATION OVERVIEW

### **Current State Critical Issues**
- ❌ **Limited to flights only**: No rail, bus, or road options
- ❌ **Only 3 results shown**: No pagination or infinite scroll
- ❌ **Fixed USD currency**: No regional pricing or conversion
- ❌ **No filtering**: Can't sort by price, duration, or preferences
- ❌ **Static display**: No interactive elements or booking flow
- ❌ **Poor mobile UX**: Results don't scroll or adapt properly
- ❌ **No context**: Missing arrival times, layovers, or travel tips
- ❌ **Limited regions**: US-focused without global coverage

### **New Vision: Comprehensive Travel Intelligence**

> **Transform transport search from basic flight listings into an intelligent, multi-modal discovery platform that compares air, rail, and road options globally with real-time pricing, infinite results, smart filtering, and seamless booking integration.**

---

## 🌐 MULTI-MODAL TRANSPORT SYSTEM

### **Transport Mode Architecture**

```
┌─────────────────────────────────────────────────┐
│  [✈️ Air] [🚄 Rail] [🚌 Road] [🚗 Car Rental]  │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────┬─────────────────────────┐  │
│  │                 │                         │  │
│  │  Results List   │    Map Integration      │  │
│  │                 │                         │  │
│  │  • Infinite     │   • Route visualization │  │
│  │  • Filters      │   • Station markers     │  │
│  │  • Sorting      │   • Travel times        │  │
│  │  • Booking      │   • Price heatmaps      │  │
│  │                 │                         │  │
│  └─────────────────┴─────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### **Mode-Specific Integration Strategy**

#### **✈️ Air Travel (Primary)**
**APIs**: Skyscanner, Kiwi.com Tequila
**Coverage**: Global flights with deep links
**Features**: Multi-airline, codeshare, price alerts

#### **🚄 Rail Travel (Secondary)**  
**APIs**: Rail Europe, Trainline, Omio
**Coverage**: Europe, North America, Japan, China
**Features**: High-speed rail, regional trains, seat selection

#### **🚌 Road Travel (Bus)**
**APIs**: FlixBus, Omio, Rome2Rio
**Coverage**: Intercity and international bus routes
**Features**: Budget options, overnight buses, wifi info

#### **🚗 Car Options**
**Integration**: Rental cars + route planning
**APIs**: DiscoverCars, Kayak
**Features**: Pickup locations, insurance, fuel estimates

---

## ✈️ AIR TRAVEL INTERFACE

### **Flight Search Results Layout**

```html
<div class="transport-section active" data-mode="air">
  <div class="section-header">
    <div class="mode-info">
      <Plane class="w-6 h-6 text-sky-400" />
      <h3>Flights to {{ destination }}</h3>
      <span class="result-count">{{ flightCount }}+ options found</span>
    </div>
    
    <div class="search-controls">
      <div class="sort-dropdown">
        <select v-model="sortBy">
          <option value="price">Best Price</option>
          <option value="duration">Fastest</option>
          <option value="convenience">Best Times</option>
          <option value="stops">Fewest Stops</option>
        </select>
      </div>
      
      <button class="filter-toggle" @click="showFilters = !showFilters">
        <Filter class="w-4 h-4" />
        Filters {{ activeFilterCount ? `(${activeFilterCount})` : '' }}
      </button>
    </div>
  </div>

  <!-- Advanced Filters Panel -->
  <div class="filters-panel" v-show="showFilters">
    <div class="filter-grid">
      <!-- Price Range -->
      <div class="filter-group">
        <label>Price Range</label>
        <div class="price-range-slider">
          <input type="range" 
                 v-model="filters.priceMin" 
                 :min="priceExtents.min" 
                 :max="priceExtents.max" />
          <input type="range" 
                 v-model="filters.priceMax" 
                 :min="priceExtents.min" 
                 :max="priceExtents.max" />
        </div>
        <div class="price-display">
          {{ formatCurrency(filters.priceMin) }} - {{ formatCurrency(filters.priceMax) }}
        </div>
      </div>

      <!-- Departure Times -->
      <div class="filter-group">
        <label>Departure Time</label>
        <div class="time-filters">
          <button class="time-slot" 
                  :class="{ active: filters.times.includes('morning') }"
                  @click="toggleTimeFilter('morning')">
            <Sunrise class="w-4 h-4" />
            Morning (6-12)
          </button>
          <button class="time-slot" 
                  :class="{ active: filters.times.includes('afternoon') }"
                  @click="toggleTimeFilter('afternoon')">
            <Sun class="w-4 h-4" />
            Afternoon (12-18)
          </button>
          <button class="time-slot" 
                  :class="{ active: filters.times.includes('evening') }"
                  @click="toggleTimeFilter('evening')">
            <Sunset class="w-4 h-4" />
            Evening (18-24)
          </button>
        </div>
      </div>

      <!-- Stops -->
      <div class="filter-group">
        <label>Connections</label>
        <div class="stop-options">
          <label class="checkbox-option">
            <input type="checkbox" v-model="filters.nonstop" />
            <span>Non-stop only</span>
          </label>
          <label class="checkbox-option">
            <input type="checkbox" v-model="filters.oneStop" />
            <span>1 stop maximum</span>
          </label>
        </div>
      </div>

      <!-- Airlines -->
      <div class="filter-group">
        <label>Airlines</label>
        <div class="airline-list">
          <label class="checkbox-option" v-for="airline in availableAirlines" :key="airline.code">
            <input type="checkbox" v-model="filters.airlines" :value="airline.code" />
            <img :src="airline.logo" :alt="airline.name" class="airline-logo" />
            <span>{{ airline.name }}</span>
          </label>
        </div>
      </div>
    </div>

    <div class="filter-actions">
      <button class="btn-ghost" @click="clearFilters">Clear All</button>
      <button class="btn-primary" @click="applyFilters">Apply Filters</button>
    </div>
  </div>

  <!-- Flight Results List -->
  <div class="results-list" ref="flightResults">
    <div class="flight-card" 
         v-for="flight in displayedFlights" 
         :key="flight.id"
         :class="{ pinned: flight.isPinned, selected: flight.isSelected }">
      
      <!-- Flight Header -->
      <div class="flight-header">
        <div class="airline-info">
          <img :src="flight.airline.logo" :alt="flight.airline.name" class="airline-logo-small" />
          <div class="flight-numbers">
            <span class="primary-flight">{{ flight.airline.name }} {{ flight.flightNumber }}</span>
            <span class="codeshare" v-if="flight.codeshare">+ {{ flight.codeshare.length }} more</span>
          </div>
        </div>
        
        <div class="flight-actions">
          <button class="action-btn" 
                  :class="{ active: flight.isPinned }" 
                  @click="togglePin(flight.id)">
            <Pin class="w-4 h-4" />
          </button>
          <button class="action-btn" @click="shareFlight(flight.id)">
            <Share2 class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Flight Route -->
      <div class="flight-route">
        <div class="departure">
          <div class="airport-code">{{ flight.departure.airport.iata }}</div>
          <div class="airport-name">{{ flight.departure.airport.name }}</div>
          <div class="departure-time">{{ formatTime(flight.departure.time) }}</div>
          <div class="departure-date">{{ formatDate(flight.departure.date) }}</div>
        </div>

        <div class="flight-path">
          <div class="duration">{{ formatDuration(flight.duration) }}</div>
          <div class="route-line">
            <div class="route-progress"></div>
            <div class="stops" v-if="flight.stops.length">
              <div class="stop-dot" v-for="stop in flight.stops" :key="stop.airport">
                <span class="stop-code">{{ stop.airport }}</span>
                <span class="layover-duration">{{ formatDuration(stop.layover) }}</span>
              </div>
            </div>
          </div>
          <div class="stop-info">
            {{ flight.stops.length === 0 ? 'Non-stop' : `${flight.stops.length} stop${flight.stops.length > 1 ? 's' : ''}` }}
          </div>
        </div>

        <div class="arrival">
          <div class="airport-code">{{ flight.arrival.airport.iata }}</div>
          <div class="airport-name">{{ flight.arrival.airport.name }}</div>
          <div class="arrival-time">{{ formatTime(flight.arrival.time) }}</div>
          <div class="arrival-date">{{ formatDate(flight.arrival.date) }}</div>
          <div class="timezone-diff" v-if="flight.timezoneChange">
            {{ flight.timezoneChange > 0 ? '+' : '' }}{{ flight.timezoneChange }}h
          </div>
        </div>
      </div>

      <!-- Flight Details -->
      <div class="flight-details">
        <div class="flight-specs">
          <span class="spec-item">
            <Plane class="w-4 h-4" />
            {{ flight.aircraft }}
          </span>
          <span class="spec-item" v-if="flight.wifi">
            <Wifi class="w-4 h-4" />
            WiFi
          </span>
          <span class="spec-item" v-if="flight.meals">
            <Utensils class="w-4 h-4" />
            Meals
          </span>
          <span class="spec-item">
            <Luggage class="w-4 h-4" />
            {{ flight.baggage }}
          </span>
        </div>

        <div class="price-section">
          <div class="price-main">
            <span class="currency">{{ userCurrency }}</span>
            <span class="amount">{{ formatPrice(flight.price) }}</span>
          </div>
          <div class="price-details">
            <span class="per-person">per person</span>
            <span class="total-price">{{ formatPrice(flight.price * travelers) }} total</span>
          </div>
          <div class="price-trend" v-if="flight.priceTrend">
            <TrendingUp v-if="flight.priceTrend === 'up'" class="w-3 h-3 text-red-400" />
            <TrendingDown v-if="flight.priceTrend === 'down'" class="w-3 h-3 text-green-400" />
            <Minus v-if="flight.priceTrend === 'stable'" class="w-3 h-3 text-gray-400" />
            <span class="trend-text">{{ getPriceTrendText(flight.priceTrend) }}</span>
          </div>
        </div>

        <div class="booking-section">
          <button class="btn-primary btn-sm" @click="selectFlight(flight)">
            Select Flight
          </button>
          <button class="btn-ghost btn-sm" @click="viewFlightDetails(flight)">
            View Details
          </button>
        </div>
      </div>

      <!-- Expandable Details -->
      <div class="flight-expanded" v-show="flight.showDetails">
        <div class="segment-details" v-for="segment in flight.segments" :key="segment.id">
          <h4>{{ segment.departure.airport.city }} → {{ segment.arrival.airport.city }}</h4>
          <div class="segment-info">
            <div class="timing">
              <span>Depart: {{ formatDateTime(segment.departure.time) }}</span>
              <span>Arrive: {{ formatDateTime(segment.arrival.time) }}</span>
              <span>Duration: {{ formatDuration(segment.duration) }}</span>
            </div>
            <div class="aircraft-info">
              <span>Aircraft: {{ segment.aircraft }}</span>
              <span>Operated by: {{ segment.operator }}</span>
            </div>
          </div>
        </div>
        
        <div class="fare-breakdown">
          <h4>Price Breakdown</h4>
          <div class="fare-items">
            <div class="fare-item">
              <span>Base Fare</span>
              <span>{{ formatPrice(flight.fareBreakdown.base) }}</span>
            </div>
            <div class="fare-item">
              <span>Taxes & Fees</span>
              <span>{{ formatPrice(flight.fareBreakdown.taxes) }}</span>
            </div>
            <div class="fare-item total">
              <span>Total per Person</span>
              <span>{{ formatPrice(flight.price) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Infinite Scroll Loader -->
    <div class="scroll-loader" v-show="loadingMore" ref="scrollLoader">
      <div class="loader-spinner"></div>
      <span>Loading more flights...</span>
    </div>

    <!-- End of Results -->
    <div class="end-of-results" v-if="reachedEnd">
      <Plane class="w-6 h-6 text-zinc-400" />
      <span>That's all the flights we found</span>
      <button class="btn-ghost" @click="expandSearch">
        <Plus class="w-4 h-4 mr-2" />
        Search Nearby Airports
      </button>
    </div>
  </div>
</div>
```

---

## 🚄 RAIL TRAVEL INTERFACE

### **Rail Search Integration**

```html
<div class="transport-section" data-mode="rail">
  <div class="rail-availability-check">
    <div class="availability-status">
      <div class="status-icon">
        <CheckCircle v-if="railAvailable" class="w-5 h-5 text-green-400" />
        <AlertCircle v-else class="w-5 h-5 text-amber-400" />
      </div>
      <div class="status-text">
        <span v-if="railAvailable">{{ railRouteCount }} rail routes available</span>
        <span v-else>Limited rail service for this route</span>
      </div>
    </div>
  </div>

  <div class="rail-results" v-if="railAvailable">
    <div class="rail-card" v-for="train in trainResults" :key="train.id">
      <!-- Train Header -->
      <div class="train-header">
        <div class="train-operator">
          <img :src="train.operator.logo" :alt="train.operator.name" class="operator-logo" />
          <div class="train-info">
            <span class="train-name">{{ train.name }}</span>
            <span class="train-type">{{ train.type }}</span>
          </div>
        </div>
        
        <div class="train-class">
          <span class="class-badge" :class="train.class.toLowerCase()">
            {{ train.class }}
          </span>
        </div>
      </div>

      <!-- Train Route -->
      <div class="train-route">
        <div class="departure">
          <div class="station-name">{{ train.departure.station.name }}</div>
          <div class="departure-time">{{ formatTime(train.departure.time) }}</div>
          <div class="platform" v-if="train.departure.platform">
            Platform {{ train.departure.platform }}
          </div>
        </div>

        <div class="train-path">
          <div class="duration">{{ formatDuration(train.duration) }}</div>
          <div class="route-visualization">
            <div class="train-line"></div>
            <div class="intermediate-stops" v-if="train.stops.length">
              <div class="stop-marker" v-for="stop in train.stops" :key="stop.station.id">
                <span class="stop-name">{{ stop.station.name }}</span>
                <span class="stop-time">{{ formatTime(stop.arrival) }}</span>
              </div>
            </div>
          </div>
          <div class="stop-summary">
            {{ train.stops.length }} stops
          </div>
        </div>

        <div class="arrival">
          <div class="station-name">{{ train.arrival.station.name }}</div>
          <div class="arrival-time">{{ formatTime(train.arrival.time) }}</div>
          <div class="platform" v-if="train.arrival.platform">
            Platform {{ train.arrival.platform }}
          </div>
        </div>
      </div>

      <!-- Train Amenities -->
      <div class="train-amenities">
        <span class="amenity-item" v-if="train.amenities.wifi">
          <Wifi class="w-4 h-4" />
          WiFi
        </span>
        <span class="amenity-item" v-if="train.amenities.dining">
          <Coffee class="w-4 h-4" />
          Dining Car
        </span>
        <span class="amenity-item" v-if="train.amenities.power">
          <Zap class="w-4 h-4" />
          Power Outlets
        </span>
        <span class="amenity-item" v-if="train.amenities.quiet">
          <Volume1 class="w-4 h-4" />
          Quiet Cars
        </span>
      </div>

      <!-- Pricing & Booking -->
      <div class="train-booking">
        <div class="price-options">
          <div class="price-option" 
               v-for="fare in train.fares" 
               :key="fare.type"
               :class="{ selected: selectedFare[train.id] === fare.type }">
            <div class="fare-type">{{ fare.name }}</div>
            <div class="fare-price">{{ formatPrice(fare.price) }}</div>
            <div class="fare-features">
              <span v-for="feature in fare.features" :key="feature">{{ feature }}</span>
            </div>
          </div>
        </div>
        
        <div class="booking-actions">
          <button class="btn-primary" @click="selectTrain(train)">
            Select Train
          </button>
          <button class="btn-ghost" @click="viewTrainDetails(train)">
            Details & Map
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- No Rail Service Available -->
  <div class="no-rail-service" v-else>
    <div class="no-service-content">
      <Train class="w-12 h-12 text-zinc-400" />
      <h3>Limited rail service available</h3>
      <p>This route has limited or no direct rail connections. Consider:</p>
      <div class="alternative-suggestions">
        <button class="suggestion-btn" @click="searchNearbyRailStations">
          <MapPin class="w-4 h-4 mr-2" />
          Check nearby rail stations
        </button>
        <button class="suggestion-btn" @click="searchConnectingRoutes">
          <Route class="w-4 h-4 mr-2" />
          Find connecting routes
        </button>
      </div>
    </div>
  </div>
</div>
```

---

## 🚌 ROAD TRAVEL & BUS INTERFACE

### **Bus Search Results**

```html
<div class="transport-section" data-mode="road">
  <div class="road-options-tabs">
    <button class="tab-btn" 
            :class="{ active: roadMode === 'bus' }" 
            @click="roadMode = 'bus'">
      <Bus class="w-4 h-4" />
      Bus Routes
    </button>
    <button class="tab-btn" 
            :class="{ active: roadMode === 'drive' }" 
            @click="roadMode = 'drive'">
      <Car class="w-4 h-4" />
      Driving Route
    </button>
  </div>

  <!-- Bus Results -->
  <div class="bus-results" v-show="roadMode === 'bus'">
    <div class="bus-card" v-for="bus in busResults" :key="bus.id">
      <div class="bus-header">
        <div class="bus-operator">
          <img :src="bus.operator.logo" :alt="bus.operator.name" class="operator-logo" />
          <div class="bus-info">
            <span class="operator-name">{{ bus.operator.name }}</span>
            <span class="bus-type">{{ bus.type }}</span>
          </div>
        </div>
        
        <div class="bus-rating" v-if="bus.rating">
          <Star class="w-4 h-4 text-amber-400" />
          <span>{{ bus.rating }}/5</span>
        </div>
      </div>

      <div class="bus-route">
        <div class="departure">
          <div class="station-name">{{ bus.departure.station.name }}</div>
          <div class="station-address">{{ bus.departure.station.address }}</div>
          <div class="departure-time">{{ formatTime(bus.departure.time) }}</div>
        </div>

        <div class="bus-path">
          <div class="duration">{{ formatDuration(bus.duration) }}</div>
          <div class="route-type">
            <span v-if="bus.overnight" class="route-badge overnight">Overnight</span>
            <span v-if="bus.express" class="route-badge express">Express</span>
            <span v-if="bus.direct" class="route-badge direct">Direct</span>
          </div>
        </div>

        <div class="arrival">
          <div class="station-name">{{ bus.arrival.station.name }}</div>
          <div class="station-address">{{ bus.arrival.station.address }}</div>
          <div class="arrival-time">{{ formatTime(bus.arrival.time) }}</div>
        </div>
      </div>

      <div class="bus-amenities">
        <span class="amenity" v-if="bus.amenities.wifi">
          <Wifi class="w-3 h-3" />
          WiFi
        </span>
        <span class="amenity" v-if="bus.amenities.power">
          <Zap class="w-3 h-3" />
          Charging
        </span>
        <span class="amenity" v-if="bus.amenities.toilet">
          <Home class="w-3 h-3" />
          Restroom
        </span>
        <span class="amenity" v-if="bus.amenities.entertainment">
          <Monitor class="w-3 h-3" />
          Entertainment
        </span>
      </div>

      <div class="bus-pricing">
        <div class="price-main">{{ formatPrice(bus.price) }}</div>
        <button class="btn-primary btn-sm" @click="selectBus(bus)">
          Select Bus
        </button>
      </div>
    </div>
  </div>

  <!-- Driving Route -->
  <div class="driving-route" v-show="roadMode === 'drive'">
    <div class="route-summary">
      <div class="route-distance">
        <MapPin class="w-5 h-5 text-emerald-400" />
        <span>{{ drivingRoute.distance }} km</span>
      </div>
      <div class="route-duration">
        <Clock class="w-5 h-5 text-sky-400" />
        <span>{{ formatDuration(drivingRoute.duration) }}</span>
      </div>
      <div class="route-cost">
        <DollarSign class="w-5 h-5 text-amber-400" />
        <span>~{{ formatPrice(drivingRoute.estimatedCost) }} fuel + tolls</span>
      </div>
    </div>

    <div class="route-options">
      <div class="route-option" 
           v-for="route in drivingRoute.alternatives" 
           :key="route.id"
           :class="{ selected: selectedRoute === route.id }">
        <div class="route-name">{{ route.name }}</div>
        <div class="route-details">
          <span>{{ route.distance }} km</span>
          <span>{{ formatDuration(route.duration) }}</span>
          <span v-if="route.tolls">{{ formatPrice(route.tolls) }} tolls</span>
        </div>
        <div class="route-highlights">
          <span v-for="highlight in route.highlights" :key="highlight">{{ highlight }}</span>
        </div>
      </div>
    </div>

    <div class="rental-car-integration">
      <h4>Need a rental car?</h4>
      <div class="rental-suggestions">
        <div class="rental-option" v-for="rental in rentalSuggestions" :key="rental.id">
          <img :src="rental.company.logo" :alt="rental.company.name" class="rental-logo" />
          <div class="rental-info">
            <span class="car-model">{{ rental.vehicle.model }}</span>
            <span class="rental-price">{{ formatPrice(rental.price) }}/day</span>
          </div>
          <button class="btn-outline btn-sm" @click="viewRental(rental)">
            View Details
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## 🗺️ MAP INTEGRATION

### **Route Visualization**

```html
<div class="transport-map">
  <div class="map-container" ref="transportMap">
    <!-- Mapbox integration showing routes -->
  </div>
  
  <div class="map-controls">
    <button class="map-control" 
            :class="{ active: showFlights }" 
            @click="toggleFlightPaths">
      <Plane class="w-4 h-4" />
      Flight Paths
    </button>
    <button class="map-control" 
            :class="{ active: showRail }" 
            @click="toggleRailRoutes">
      <Train class="w-4 h-4" />
      Rail Routes
    </button>
    <button class="map-control" 
            :class="{ active: showRoads }" 
            @click="toggleDrivingRoutes">
      <Car class="w-4 h-4" />
      Driving Routes
    </button>
  </div>
  
  <div class="map-legend">
    <div class="legend-item">
      <div class="legend-color flight"></div>
      <span>Flight routes</span>
    </div>
    <div class="legend-item">
      <div class="legend-color rail"></div>
      <span>Rail connections</span>
    </div>
    <div class="legend-item">
      <div class="legend-color road"></div>
      <span>Driving routes</span>
    </div>
  </div>
</div>
```

### **Interactive Map Features**

```javascript
const mapFeatures = {
  // Flight path visualization
  showFlightPaths: (flights) => {
    flights.forEach(flight => {
      map.addLayer({
        id: `flight-${flight.id}`,
        type: 'line',
        source: {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [
                [flight.departure.airport.lng, flight.departure.airport.lat],
                [flight.arrival.airport.lng, flight.arrival.airport.lat]
              ]
            }
          }
        },
        paint: {
          'line-color': '#0ea5e9',
          'line-width': 2,
          'line-opacity': 0.8
        }
      });
    });
  },

  // Airport markers
  addAirportMarkers: (airports) => {
    airports.forEach(airport => {
      const marker = new mapboxgl.Marker({
        color: '#0ea5e9'
      })
      .setLngLat([airport.lng, airport.lat])
      .setPopup(new mapboxgl.Popup().setHTML(`
        <div class="airport-popup">
          <h3>${airport.name}</h3>
          <p>${airport.iata} • ${airport.city}</p>
        </div>
      `))
      .addTo(map);
    });
  },

  // Route comparison
  compareRoutes: (routes) => {
    routes.forEach((route, index) => {
      const color = getRouteColor(route.mode);
      map.addLayer({
        id: `route-${index}`,
        type: 'line',
        source: {
          type: 'geojson',
          data: route.geometry
        },
        paint: {
          'line-color': color,
          'line-width': 3,
          'line-opacity': route.isSelected ? 1 : 0.6
        }
      });
    });
  }
};
```

---

## 🔄 INFINITE SCROLL & PERFORMANCE

### **Infinite Scroll Implementation**

```javascript
const useInfiniteScroll = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const newResults = await fetchTransportResults({
        ...searchParams,
        page,
        limit: 25
      });
      
      if (newResults.length < 25) {
        setHasMore(false);
      }
      
      setResults(prev => [...prev, ...newResults]);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Failed to load more results:', error);
    } finally {
      setLoading(false);
    }
  }, [page, searchParams, loading, hasMore]);
  
  // Intersection Observer for automatic loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    
    const sentinel = document.querySelector('.scroll-loader');
    if (sentinel) observer.observe(sentinel);
    
    return () => observer.disconnect();
  }, [loadMore, hasMore, loading]);
  
  return { results, loading, hasMore, loadMore };
};
```

### **Performance Optimizations**

```javascript
const performanceOptimizations = {
  // Virtual scrolling for large result sets
  virtualScrolling: {
    itemHeight: 200,
    bufferSize: 10,
    renderWindow: 20
  },
  
  // Image lazy loading
  lazyLoadImages: () => {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  },
  
  // Debounced search
  debouncedSearch: debounce((query) => {
    searchTransport(query);
  }, 300)
};
```

---

## 💰 REGIONAL PRICING & CURRENCY

### **Currency Detection & Conversion**

```javascript
const useCurrencySystem = () => {
  const [userCurrency, setUserCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState({});
  
  // Detect user's preferred currency
  const detectCurrency = async () => {
    try {
      // 1. Check user profile
      if (userProfile?.preferredCurrency) {
        setUserCurrency(userProfile.preferredCurrency);
        return;
      }
      
      // 2. Detect by location
      const location = await getUserLocation();
      const currency = getCurrencyByCountry(location.country);
      setUserCurrency(currency);
    } catch (error) {
      // 3. Default to USD
      setUserCurrency('USD');
    }
  };
  
  // Real-time exchange rates
  const updateExchangeRates = async () => {
    try {
      const rates = await fetch('/api/exchange-rates').then(r => r.json());
      setExchangeRates(rates);
    } catch (error) {
      console.error('Failed to update exchange rates:', error);
    }
  };
  
  // Convert price to user's currency
  const convertPrice = (amount, fromCurrency) => {
    if (fromCurrency === userCurrency) return amount;
    
    const rate = exchangeRates[`${fromCurrency}_${userCurrency}`] || 1;
    return Math.round(amount * rate * 100) / 100;
  };
  
  return {
    userCurrency,
    setUserCurrency,
    convertPrice,
    formatPrice: (amount) => new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: userCurrency
    }).format(amount)
  };
};
```

### **Regional Pricing Display**

```html
<div class="price-display">
  <div class="primary-price">
    <span class="currency-code">{{ userCurrency }}</span>
    <span class="amount">{{ formatPrice(convertedPrice) }}</span>
  </div>
  
  <div class="price-alternatives" v-if="showAlternativePrices">
    <button class="alt-price" 
            v-for="alt in alternativePrices" 
            :key="alt.currency"
            @click="setUserCurrency(alt.currency)">
      {{ alt.currency }} {{ formatPrice(alt.amount, alt.currency) }}
    </button>
  </div>
  
  <div class="price-context">
    <span class="price-per">per person</span>
    <span class="price-trend" v-if="priceTrend">
      <TrendingUp v-if="priceTrend.direction === 'up'" class="w-3 h-3 text-red-400" />
      <TrendingDown v-if="priceTrend.direction === 'down'" class="w-3 h-3 text-green-400" />
      {{ priceTrend.change }}%
    </span>
  </div>
</div>
```

---

## 🎯 SMART FILTERING & SORTING

### **Advanced Filter System**

```html
<div class="advanced-filters">
  <!-- Quick Filters -->
  <div class="quick-filters">
    <button class="filter-chip" 
            :class="{ active: quickFilters.cheapest }"
            @click="toggleQuickFilter('cheapest')">
      <DollarSign class="w-4 h-4" />
      Cheapest
    </button>
    <button class="filter-chip" 
            :class="{ active: quickFilters.fastest }"
            @click="toggleQuickFilter('fastest')">
      <Zap class="w-4 h-4" />
      Fastest
    </button>
    <button class="filter-chip" 
            :class="{ active: quickFilters.nonstop }"
            @click="toggleQuickFilter('nonstop')">
      <ArrowRight class="w-4 h-4" />
      Non-stop
    </button>
    <button class="filter-chip" 
            :class="{ active: quickFilters.morning }"
            @click="toggleQuickFilter('morning')">
      <Sunrise class="w-4 h-4" />
      Morning
    </button>
  </div>

  <!-- Advanced Filters -->
  <div class="detailed-filters" v-show="showAdvancedFilters">
    <!-- Duration Range -->
    <div class="filter-section">
      <h4>Journey Duration</h4>
      <div class="duration-range">
        <input type="range" 
               v-model="filters.minDuration" 
               :min="durationLimits.min" 
               :max="durationLimits.max" />
        <div class="range-labels">
          <span>{{ formatDuration(filters.minDuration) }}</span>
          <span>{{ formatDuration(filters.maxDuration) }}</span>
        </div>
      </div>
    </div>

    <!-- Environmental Impact -->
    <div class="filter-section">
      <h4>Environmental Impact</h4>
      <div class="eco-filters">
        <label class="eco-option">
          <input type="radio" name="eco-filter" value="lowest" v-model="filters.ecoMode" />
          <span class="eco-badge low">Lowest CO2</span>
        </label>
        <label class="eco-option">
          <input type="radio" name="eco-filter" value="balanced" v-model="filters.ecoMode" />
          <span class="eco-badge medium">Balanced</span>
        </label>
        <label class="eco-option">
          <input type="radio" name="eco-filter" value="any" v-model="filters.ecoMode" />
          <span class="eco-badge any">Any Option</span>
        </label>
      </div>
    </div>

    <!-- Booking Flexibility -->
    <div class="filter-section">
      <h4>Booking Options</h4>
      <div class="booking-filters">
        <label class="checkbox-filter">
          <input type="checkbox" v-model="filters.refundable" />
          <span>Refundable tickets only</span>
        </label>
        <label class="checkbox-filter">
          <input type="checkbox" v-model="filters.changeable" />
          <span>Free changes allowed</span>
        </label>
        <label class="checkbox-filter">
          <input type="checkbox" v-model="filters.holdPrice" />
          <span>Can hold price (24h+)</span>
        </label>
      </div>
    </div>
  </div>
</div>
```

### **Intelligent Sorting Algorithms**

```javascript
const sortingAlgorithms = {
  // Multi-criteria sorting
  bestValue: (results) => {
    return results.sort((a, b) => {
      // Weighted score: 40% price, 30% duration, 20% convenience, 10% rating
      const scoreA = (
        (1 - a.priceRank) * 0.4 +
        (1 - a.durationRank) * 0.3 +
        a.convenienceScore * 0.2 +
        a.rating * 0.1
      );
      const scoreB = (
        (1 - b.priceRank) * 0.4 +
        (1 - b.durationRank) * 0.3 +
        b.convenienceScore * 0.2 +
        b.rating * 0.1
      );
      return scoreB - scoreA;
    });
  },

  // Price per hour of travel time
  efficiency: (results) => {
    return results.sort((a, b) => {
      const efficiencyA = a.price / (a.duration / 60); // price per hour
      const efficiencyB = b.price / (b.duration / 60);
      return efficiencyA - efficiencyB;
    });
  },

  // Departure time preference
  convenience: (results, preferences) => {
    const preferredTimes = preferences.departurePreference || [];
    return results.sort((a, b) => {
      const scoreA = getTimeConvenienceScore(a.departure.time, preferredTimes);
      const scoreB = getTimeConvenienceScore(b.departure.time, preferredTimes);
      return scoreB - scoreA;
    });
  }
};
```

---

## 🔗 BOOKING INTEGRATION

### **Seamless Booking Flow**

```html
<div class="booking-integration">
  <!-- Selected Transport Summary -->
  <div class="selected-transport" v-if="selectedOptions.length">
    <h3>Selected Transportation</h3>
    <div class="selected-items">
      <div class="selected-item" v-for="option in selectedOptions" :key="option.id">
        <div class="item-icon">
          <component :is="getTransportIcon(option.type)" class="w-5 h-5" />
        </div>
        <div class="item-details">
          <span class="item-name">{{ option.name }}</span>
          <span class="item-route">{{ option.route }}</span>
          <span class="item-time">{{ option.departureTime }} → {{ option.arrivalTime }}</span>
        </div>
        <div class="item-price">{{ formatPrice(option.price) }}</div>
        <button class="remove-item" @click="removeSelection(option.id)">
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
    
    <div class="selection-total">
      <div class="total-price">
        <span>Total Transportation:</span>
        <span class="price">{{ formatPrice(totalTransportPrice) }}</span>
      </div>
      <div class="total-travelers">
        For {{ travelers }} {{ travelers === 1 ? 'person' : 'people' }}
      </div>
    </div>
  </div>

  <!-- Booking Actions -->
  <div class="booking-actions" v-if="selectedOptions.length">
    <button class="btn-primary btn-lg" @click="proceedToBooking">
      <CreditCard class="w-5 h-5 mr-2" />
      Continue to Booking
    </button>
    
    <div class="booking-alternatives">
      <button class="btn-ghost" @click="addToItinerary">
        <Plus class="w-4 h-4 mr-2" />
        Add to Trip Planner
      </button>
      <button class="btn-ghost" @click="saveForLater">
        <Bookmark class="w-4 h-4 mr-2" />
        Save Selections
      </button>
      <button class="btn-ghost" @click="shareSelections">
        <Share2 class="w-4 h-4 mr-2" />
        Share with Others
      </button>
    </div>
  </div>

  <!-- Partner Integration Info -->
  <div class="partner-info">
    <p class="info-text">
      <Shield class="w-4 h-4 mr-2" />
      Secure booking through our trusted partners
    </p>
    <div class="partner-badges">
      <img src="/partners/skyscanner-secure.svg" alt="Skyscanner" />
      <img src="/partners/booking-secure.svg" alt="Booking.com" />
      <img src="/partners/raileurope-secure.svg" alt="Rail Europe" />
    </div>
  </div>
</div>
```

---

## 📊 TRANSPORT ANALYTICS & TRACKING

### **User Behavior Tracking**

```javascript
const trackTransportEvents = {
  // Search interactions
  searchInitiated: (params) => {
    analytics.track('transport_search_started', {
      from: params.from,
      to: params.to,
      departure_date: params.departureDate,
      travelers: params.travelers,
      modes_enabled: params.modes
    });
  },

  // Filter usage
  filterApplied: (filterType, filterValue) => {
    analytics.track('transport_filter_applied', {
      filter_type: filterType,
      filter_value: filterValue,
      results_count_before: resultsCount.before,
      results_count_after: resultsCount.after
    });
  },

  // Result interactions
  optionViewed: (option) => {
    analytics.track('transport_option_viewed', {
      transport_type: option.type,
      provider: option.provider,
      price: option.price,
      duration: option.duration,
      result_position: option.position
    });
  },

  // Selection and booking
  optionSelected: (option) => {
    analytics.track('transport_option_selected', {
      transport_type: option.type,
      provider: option.provider,
      price: option.price,
      booking_partner: option.bookingPartner
    });
  },

  // Conversion tracking
  bookingCompleted: (bookingData) => {
    analytics.track('transport_booking_completed', {
      total_price: bookingData.totalPrice,
      options_count: bookingData.optionsCount,
      booking_partner: bookingData.partner,
      conversion_time: bookingData.timeToConversion
    });
  }
};
```

---

This comprehensive transport integration transforms the basic flight search into a sophisticated multi-modal discovery platform that intelligently compares air, rail, and road options with infinite scrolling, smart filtering, regional pricing, and seamless booking integration. The interface provides users with all the information they need to make informed transportation decisions while maintaining the beautiful, consistent design established in earlier phases.

**Next Phase 7**: Rich accommodation and activity discovery with images, reviews, and intelligent ranking systems.