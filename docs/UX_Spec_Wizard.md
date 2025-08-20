# Trip Wizard UX Specifications v1.1

**Version**: 1.1.0  
**Last Updated**: August 19, 2025  
**Status**: Core UX Overhaul Phase  
**Objective**: Transform basic form into engaging, AI-powered planning experience

---

## 🎯 WIZARD TRANSFORMATION OVERVIEW

### **Current State Critical Issues**
- ❌ **Theme jumping**: Jarring dark → light transition from landing page
- ❌ **Basic text inputs**: No smart autocomplete or dropdowns
- ❌ **Manual date entry**: Users type dates instead of calendar picker
- ❌ **No AI suggestions**: Missing intelligent recommendations
- ❌ **Poor error handling**: Silent failures and confusing validation
- ❌ **No progress indication**: Users don't know completion status
- ❌ **8-step complexity**: Overwhelming number of steps
- ❌ **No preview**: Can't see what the result will look like

### **New Vision: Intelligent Planning Companion**

> **Transform the trip wizard from a static form into an intelligent, conversational planning experience that guides users effortlessly from idea to itinerary through AI-powered suggestions, smart defaults, and delightful interactions.**

---

## 🧩 WIZARD ARCHITECTURE REDESIGN

### **Simplified 4-Step Flow**

**Old Flow (8 steps - Too Complex):**
```
Destination → Transport → Rental → Stay → Activities → Food → Timeline → Share
```

**New Flow (4 steps - Streamlined):**
```
1. ✈️  Where & When    (Destination + Dates + Travelers)
2. 🎯  Trip Style      (Type + Preferences + Budget)  
3. ⚡  AI Generation   (Live preview + customization)
4. 🚀  Ready to Plan   (Review + launch planner)
```

### **Progressive Disclosure Strategy**
- **Step 1**: Essential trip basics (95% of users complete)
- **Step 2**: Personalization options (80% of users complete)  
- **Step 3**: AI magic happens with live preview (70% engage)
- **Step 4**: Final review and launch (60% convert to planner)

---

## 🎨 VISUAL & THEME CONSISTENCY

### **Theme Continuity**
- **Maintain dark theme** from landing page (no jarring transitions)
- **Emerald gradient backgrounds** for section headers
- **Glass panels** for form sections with subtle backdrop blur
- **Consistent spacing** using 8px grid system
- **Smooth animations** between all state changes

### **Layout Structure**
```
┌─────────────────────────────────────────────────┐
│  [Progress Bar] [1] ━━● [2] ━━○ [3] ━━○ [4]    │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────┬─────────────────────────┐  │
│  │                 │                         │  │
│  │   Form Section  │    Live Preview         │  │
│  │                 │                         │  │
│  │   • Smart inputs│   • AI suggestions      │  │
│  │   • Validation  │   • Cost estimates      │  │  
│  │   • Help text   │   • Destination info    │  │
│  │                 │                         │  │
│  └─────────────────┴─────────────────────────┘  │
│                                                 │
│  [Back] ────────────────────────── [Continue] │
└─────────────────────────────────────────────────┘
```

---

## 📍 STEP 1: WHERE & WHEN - "Tell Us Your Dream"

### **From/To Location Autocomplete**

#### **Smart Omnibox Design**
```html
<div class="location-input-group">
  <div class="input-with-icon">
    <MapPin class="input-icon text-emerald-400" />
    <input 
      type="text" 
      placeholder="From: City, airport, or address"
      class="location-input"
      autocomplete="off"
    />
    <div class="input-actions">
      <button class="location-detect" title="Use my location">
        <Crosshairs class="w-4 h-4" />
      </button>
    </div>
  </div>
  
  <div class="location-swap">
    <button class="swap-button" title="Swap destinations">
      <ArrowUpDown class="w-4 h-4" />
    </button>
  </div>
  
  <div class="input-with-icon">
    <Plane class="input-icon text-sky-400" />
    <input 
      type="text" 
      placeholder="To: Where do you want to go?"
      class="location-input"
      autocomplete="off"
    />
  </div>
</div>
```

#### **Dropdown Results Structure**

**Grouped Results Display:**
```html
<div class="location-dropdown">
  <!-- Recent Searches (if any) -->
  <div class="result-group" v-if="recentSearches.length">
    <div class="group-header">
      <Clock class="w-4 h-4" />
      Recent Searches
    </div>
    <div class="result-item" v-for="recent in recentSearches">
      <div class="result-info">
        <div class="result-name">{{ recent.name }}</div>
        <div class="result-type">{{ recent.type }}</div>
      </div>
    </div>
  </div>

  <!-- Cities -->
  <div class="result-group">
    <div class="group-header">
      <Building class="w-4 h-4" />
      Cities
    </div>
    <div class="result-item" v-for="city in cities">
      <div class="result-flag">{{ city.flag }}</div>
      <div class="result-info">
        <div class="result-name">{{ city.name }}</div>
        <div class="result-country">{{ city.country }}</div>
      </div>
      <div class="result-meta">
        <div class="result-timezone">{{ city.timezone }}</div>
        <div class="result-distance">{{ city.distance }}</div>
      </div>
    </div>
  </div>

  <!-- Airports -->
  <div class="result-group">
    <div class="group-header">
      <Plane class="w-4 h-4" />
      Airports
    </div>
    <div class="result-item" v-for="airport in airports">
      <div class="result-info">
        <div class="result-name">{{ airport.name }}</div>
        <div class="result-code">{{ airport.iata }}</div>
      </div>
      <div class="result-distance">{{ airport.distance }}</div>
    </div>
  </div>

  <!-- States/Regions -->
  <div class="result-group">
    <div class="group-header">
      <Map class="w-4 h-4" />
      Regions
    </div>
    <div class="result-item" v-for="region in regions">
      <div class="result-flag">{{ region.flag }}</div>
      <div class="result-info">
        <div class="result-name">{{ region.name }}</div>
        <div class="result-country">{{ region.country }}</div>
      </div>
    </div>
  </div>
</div>
```

#### **Smart Behavior & Features**

**Auto-detection & Defaults:**
```javascript
// Smart location detection
const detectUserLocation = async () => {
  // 1. Try browser geolocation
  // 2. Fall back to IP-based detection  
  // 3. Use profile saved home location
  // 4. Default to major cities list
};

// Pre-fill "From" field
const smartDefaults = {
  from: userProfile?.homeAirport || detectedLocation || 'New York, NY',
  to: '', // Always empty to focus user attention
  suggestions: getTrendingDestinations(userProfile?.interests)
};
```

**Search Intelligence:**
- **Fuzzy matching**: "nework" → "New York"
- **Alias support**: "NYC" → "New York City"  
- **Multiple languages**: "東京" → "Tokyo"
- **Typo tolerance**: "Parris" → "Paris"
- **Context awareness**: "Portland" shows OR and ME options

**Performance Requirements:**
- **First suggestions**: <150ms after 2nd character
- **Full results**: <300ms with network request
- **Cached responses**: <50ms for repeated searches
- **Minimum results**: 8-10 options per group when available

### **Date Range Selection**

#### **Calendar Interface Design**

```html
<div class="date-selection">
  <div class="date-inputs">
    <div class="date-input-group">
      <Calendar class="input-icon text-emerald-400" />
      <input 
        type="text" 
        placeholder="Departure date"
        class="date-input"
        readonly
        v-model="displayStartDate"
      />
    </div>
    
    <div class="date-separator">
      <ArrowRight class="w-4 h-4 text-zinc-400" />
    </div>
    
    <div class="date-input-group">
      <Calendar class="input-icon text-sky-400" />
      <input 
        type="text" 
        placeholder="Return date"
        class="date-input" 
        readonly
        v-model="displayEndDate"
      />
    </div>
  </div>
  
  <div class="trip-duration" v-if="duration">
    {{ duration }} • {{ weekdayRange }}
  </div>
</div>
```

#### **Calendar Popup Features**

**Quick Presets:**
```html
<div class="calendar-presets">
  <button class="preset-btn" @click="setPreset('weekend')">
    <Calendar class="w-4 h-4" />
    Weekend (2 days)
  </button>
  <button class="preset-btn" @click="setPreset('short')">
    <Plane class="w-4 h-4" />
    Short Trip (3-4 days)
  </button>
  <button class="preset-btn" @click="setPreset('week')">
    <MapPin class="w-4 h-4" />
    Week Away (7 days)
  </button>
  <button class="preset-btn" @click="setPreset('custom')">
    <Settings class="w-4 h-4" />
    Custom Dates
  </button>
</div>
```

**Calendar Grid:**
- **Range selection**: Click start, click end
- **Disabled dates**: Past dates, availability limits
- **Price indicators**: Small price hints on available dates (if data available)
- **Holiday markers**: Major holidays highlighted
- **Season indicators**: Weather/season context for destination

#### **Smart Date Intelligence**

```javascript
const dateIntelligence = {
  // Suggest optimal travel windows
  suggestBestDates: (destination) => {
    return {
      weather: "Best weather: Apr-Jun, Sep-Nov",
      prices: "Cheapest: Jan-Mar, most expensive: Jul-Aug", 
      crowds: "Fewer tourists: Sep-Nov, busiest: Jun-Aug"
    };
  },
  
  // Validate date logic
  validateDates: (start, end) => {
    if (start >= end) return "Return date must be after departure";
    if (daysBetween > 30) return "Trips longer than 30 days need custom planning";
    return null;
  }
};
```

### **Traveler Count & Type**

```html
<div class="traveler-selector">
  <div class="input-with-icon">
    <Users class="input-icon text-amber-400" />
    <div class="traveler-input" @click="showTravelerModal">
      <span>{{ travelerSummary }}</span>
      <ChevronDown class="w-4 h-4" />
    </div>
  </div>
</div>

<!-- Traveler Modal -->
<div class="traveler-modal" v-if="showTravelers">
  <div class="traveler-group">
    <label>Adults</label>
    <div class="counter">
      <button @click="decrementAdults">−</button>
      <span>{{ adults }}</span>
      <button @click="incrementAdults">+</button>
    </div>
  </div>
  
  <div class="traveler-group">
    <label>Children (2-12)</label>
    <div class="counter">
      <button @click="decrementChildren">−</button>
      <span>{{ children }}</span>
      <button @click="incrementChildren">+</button>
    </div>
  </div>
  
  <div class="traveler-group">
    <label>Infants (under 2)</label>
    <div class="counter">
      <button @click="decrementInfants">−</button>
      <span>{{ infants }}</span>
      <button @click="incrementInfants">+</button>
    </div>
  </div>
</div>
```

---

## 🎯 STEP 2: TRIP STYLE - "Make It Yours"

### **Trip Type Selection**

#### **Card-Based Type Selector**

```html
<div class="trip-type-grid">
  <div class="trip-type-card" 
       :class="{ active: selectedType === 'business' }"
       @click="selectType('business')">
    <div class="card-icon">
      <Briefcase class="w-8 h-8 text-blue-400" />
    </div>
    <h3>Business Travel</h3>
    <p>Efficient planning with business amenities and locations</p>
    <div class="card-features">
      <span class="feature-tag">Meeting venues</span>
      <span class="feature-tag">Business hotels</span>
      <span class="feature-tag">Transport efficiency</span>
    </div>
  </div>

  <div class="trip-type-card" 
       :class="{ active: selectedType === 'leisure' }"
       @click="selectType('leisure')">
    <div class="card-icon">
      <Camera class="w-8 h-8 text-emerald-400" />
    </div>
    <h3>Leisure & Tourism</h3>
    <p>Explore attractions, culture, and experiences</p>
    <div class="card-features">
      <span class="feature-tag">Top attractions</span>
      <span class="feature-tag">Photo spots</span>
      <span class="feature-tag">Local culture</span>
    </div>
  </div>

  <div class="trip-type-card" 
       :class="{ active: selectedType === 'adventure' }"
       @click="selectType('adventure')">
    <div class="card-icon">
      <Mountain class="w-8 h-8 text-orange-400" />
    </div>
    <h3>Adventure & Outdoors</h3>
    <p>Hiking, activities, and nature experiences</p>
    <div class="card-features">
      <span class="feature-tag">Outdoor activities</span>
      <span class="feature-tag">Nature spots</span>
      <span class="feature-tag">Adventure gear</span>
    </div>
  </div>

  <div class="trip-type-card" 
       :class="{ active: selectedType === 'food' }"
       @click="selectType('food')">
    <div class="card-icon">
      <ChefHat class="w-8 h-8 text-red-400" />
    </div>
    <h3>Food & Culinary</h3>
    <p>Restaurants, markets, and culinary experiences</p>
    <div class="card-features">
      <span class="feature-tag">Local cuisine</span>
      <span class="feature-tag">Food markets</span>
      <span class="feature-tag">Cooking classes</span>
    </div>
  </div>

  <div class="trip-type-card" 
       :class="{ active: selectedType === 'relax' }"
       @click="selectType('relax')">
    <div class="card-icon">
      <Waves class="w-8 h-8 text-blue-400" />
    </div>
    <h3>Relaxation</h3>
    <p>Spas, beaches, and peaceful experiences</p>
    <div class="card-features">
      <span class="feature-tag">Spa treatments</span>
      <span class="feature-tag">Beach time</span>
      <span class="feature-tag">Quiet venues</span>
    </div>
  </div>

  <div class="trip-type-card" 
       :class="{ active: selectedType === 'mixed' }"
       @click="selectType('mixed')">
    <div class="card-icon">
      <Shuffle class="w-8 h-8 text-purple-400" />
    </div>
    <h3>Mixed Experience</h3>
    <p>Balanced mix of activities and styles</p>
    <div class="card-features">
      <span class="feature-tag">Variety</span>
      <span class="feature-tag">Flexible</span>
      <span class="feature-tag">Personalized</span>
    </div>
  </div>
</div>
```

### **Budget Range Selector**

```html
<div class="budget-section">
  <label class="section-label">
    <DollarSign class="w-5 h-5 text-emerald-400" />
    What's your budget range?
  </label>
  
  <div class="budget-slider">
    <div class="budget-range">
      <input 
        type="range" 
        min="500" 
        max="10000" 
        step="100"
        v-model="budgetMin"
        class="range-input"
      />
      <input 
        type="range" 
        min="500" 
        max="10000" 
        step="100"
        v-model="budgetMax" 
        class="range-input"
      />
    </div>
    
    <div class="budget-display">
      <span class="budget-min">${{ budgetMin }}</span>
      <span class="budget-separator">to</span>
      <span class="budget-max">${{ budgetMax }}</span>
      <span class="budget-per">per person</span>
    </div>
    
    <div class="budget-presets">
      <button class="budget-preset" @click="setBudget(500, 1500)">
        Budget ($500-1.5K)
      </button>
      <button class="budget-preset" @click="setBudget(1500, 3500)">
        Mid-range ($1.5-3.5K)
      </button>
      <button class="budget-preset" @click="setBudget(3500, 8000)">
        Luxury ($3.5K+)
      </button>
    </div>
  </div>
</div>
```

### **Preferences & Interests**

```html
<div class="preferences-section">
  <label class="section-label">
    <Heart class="w-5 h-5 text-red-400" />
    What interests you most? (Select up to 5)
  </label>
  
  <div class="interest-tags">
    <button 
      v-for="interest in availableInterests"
      :key="interest.id"
      class="interest-tag"
      :class="{ selected: selectedInterests.includes(interest.id) }"
      @click="toggleInterest(interest.id)"
    >
      <component :is="interest.icon" class="w-4 h-4" />
      {{ interest.name }}
    </button>
  </div>
</div>
```

**Available Interest Categories:**
```javascript
const interestCategories = [
  { id: 'museums', name: 'Museums & Galleries', icon: 'Building2' },
  { id: 'nightlife', name: 'Nightlife & Bars', icon: 'Moon' },
  { id: 'shopping', name: 'Shopping', icon: 'ShoppingBag' },
  { id: 'nature', name: 'Parks & Nature', icon: 'Trees' },
  { id: 'architecture', name: 'Architecture', icon: 'Building' },
  { id: 'food', name: 'Local Cuisine', icon: 'Utensils' },
  { id: 'history', name: 'Historical Sites', icon: 'Castle' },
  { id: 'beaches', name: 'Beaches', icon: 'Waves' },
  { id: 'adventure', name: 'Adventure Sports', icon: 'Mountain' },
  { id: 'wellness', name: 'Spa & Wellness', icon: 'Heart' },
  { id: 'photography', name: 'Photography', icon: 'Camera' },
  { id: 'music', name: 'Music & Events', icon: 'Music' }
];
```

---

## ⚡ STEP 3: AI GENERATION - "Watch the Magic Happen"

### **Live Preview Interface**

```html
<div class="generation-interface">
  <div class="generation-status">
    <div class="status-indicator" :class="generationStatus">
      <div class="status-icon">
        <Sparkles v-if="status === 'ready'" class="w-5 h-5 text-emerald-400" />
        <Loader v-if="status === 'generating'" class="w-5 h-5 animate-spin text-sky-400" />
        <CheckCircle v-if="status === 'complete'" class="w-5 h-5 text-green-400" />
      </div>
      <span class="status-text">{{ statusMessage }}</span>
    </div>
    
    <div class="generation-progress" v-if="status === 'generating'">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
      <div class="progress-steps">
        <div class="step" :class="{ complete: progress > 20 }">
          <MapPin class="w-4 h-4" />
          <span>Finding places</span>
        </div>
        <div class="step" :class="{ complete: progress > 50 }">
          <Route class="w-4 h-4" />
          <span>Planning routes</span>
        </div>
        <div class="step" :class="{ complete: progress > 80 }">
          <DollarSign class="w-4 h-4" />
          <span>Getting prices</span>
        </div>
        <div class="step" :class="{ complete: progress > 95 }">
          <CheckCircle class="w-4 h-4" />
          <span>Finalizing</span>
        </div>
      </div>
    </div>
  </div>

  <div class="preview-panel">
    <!-- Live preview content that updates during generation -->
    <div class="itinerary-preview" v-if="previewData">
      <h3>Your {{ destination }} Adventure</h3>
      <div class="preview-timeline">
        <div 
          v-for="day in previewData.days" 
          :key="day.number"
          class="preview-day"
        >
          <div class="day-header">
            <span class="day-number">Day {{ day.number }}</span>
            <span class="day-theme">{{ day.theme }}</span>
          </div>
          <div class="day-activities">
            <div 
              v-for="activity in day.activities" 
              :key="activity.id"
              class="activity-item"
            >
              <div class="activity-icon">
                <component :is="activity.icon" class="w-4 h-4" />
              </div>
              <div class="activity-info">
                <span class="activity-name">{{ activity.name }}</span>
                <span class="activity-time">{{ activity.time }}</span>
              </div>
              <span class="activity-price">${{ activity.price }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

### **AI Generation Process**

#### **Streaming Updates**
```javascript
const generateItinerary = async (tripData) => {
  const stream = new EventSource(`/api/trips/generate?data=${encodeURIComponent(JSON.stringify(tripData))}`);
  
  stream.onmessage = (event) => {
    const update = JSON.parse(event.data);
    
    switch (update.type) {
      case 'progress':
        updateProgress(update.percentage, update.stage);
        break;
      case 'places_found':
        addPlacesToPreview(update.places);
        break;
      case 'routes_calculated':
        updateRoutesInPreview(update.routes);
        break;
      case 'prices_loaded':
        addPricesToPreview(update.prices);
        break;
      case 'complete':
        showFinalItinerary(update.itinerary);
        break;
      case 'error':
        showError(update.message);
        break;
    }
  };
};
```

#### **AI Customization Options**

```html
<div class="ai-customization" v-if="showCustomization">
  <h4>Fine-tune your trip:</h4>
  
  <div class="customization-options">
    <div class="option-group">
      <label>Pace of travel:</label>
      <div class="option-buttons">
        <button :class="{ active: pace === 'relaxed' }" @click="pace = 'relaxed'">
          Relaxed
        </button>
        <button :class="{ active: pace === 'moderate' }" @click="pace = 'moderate'">
          Moderate
        </button>
        <button :class="{ active: pace === 'packed' }" @click="pace = 'packed'">
          Packed
        </button>
      </div>
    </div>
    
    <div class="option-group">
      <label>Transportation preference:</label>
      <div class="option-buttons">
        <button :class="{ active: transport === 'walking' }" @click="transport = 'walking'">
          Walking
        </button>
        <button :class="{ active: transport === 'public' }" @click="transport = 'public'">
          Public Transit
        </button>
        <button :class="{ active: transport === 'taxi' }" @click="transport = 'taxi'">
          Taxis/Uber
        </button>
        <button :class="{ active: transport === 'rental' }" @click="transport = 'rental'">
          Rental Car
        </button>
      </div>
    </div>
    
    <div class="option-group">
      <label>Dining style:</label>
      <div class="option-buttons">
        <button :class="{ active: dining === 'budget' }" @click="dining = 'budget'">
          Budget Eats
        </button>
        <button :class="{ active: dining === 'local' }" @click="dining = 'local'">
          Local Favorites  
        </button>
        <button :class="{ active: dining === 'fine' }" @click="dining = 'fine'">
          Fine Dining
        </button>
      </div>
    </div>
  </div>
  
  <button class="regenerate-btn" @click="regenerateWithOptions">
    <RefreshCw class="w-4 h-4 mr-2" />
    Update Trip with These Preferences
  </button>
</div>
```

---

## 🚀 STEP 4: READY TO PLAN - "Your Adventure Awaits"

### **Final Review Interface**

```html
<div class="trip-summary">
  <div class="summary-header">
    <h2>Your {{ destination }} trip is ready!</h2>
    <div class="trip-meta">
      <span class="trip-duration">{{ duration }} days</span>
      <span class="trip-cost">${{ estimatedCost }} estimated</span>
      <span class="trip-activities">{{ activityCount }} activities</span>
    </div>
  </div>
  
  <div class="summary-content">
    <div class="summary-highlights">
      <h3>Trip Highlights:</h3>
      <ul class="highlight-list">
        <li v-for="highlight in tripHighlights" :key="highlight.id">
          <component :is="highlight.icon" class="w-4 h-4 text-emerald-400" />
          {{ highlight.text }}
        </li>
      </ul>
    </div>
    
    <div class="summary-preview">
      <!-- Condensed itinerary preview -->
      <div class="day-summary" v-for="day in summarizedDays" :key="day.number">
        <strong>Day {{ day.number }}:</strong> {{ day.summary }}
      </div>
    </div>
  </div>
  
  <div class="summary-actions">
    <button class="btn-primary btn-lg launch-planner" @click="launchPlanner">
      <Map class="w-5 h-5 mr-2" />
      Open Trip Planner
    </button>
    
    <div class="secondary-actions">
      <button class="btn-ghost" @click="saveForLater">
        <Bookmark class="w-4 h-4 mr-2" />
        Save for Later
      </button>
      <button class="btn-ghost" @click="shareTrip">
        <Share2 class="w-4 h-4 mr-2" />
        Share Trip
      </button>
      <button class="btn-ghost" @click="startOver">
        <RotateCcw class="w-4 h-4 mr-2" />
        Start Over
      </button>
    </div>
  </div>
</div>
```

---

## 🎬 WIZARD ANIMATIONS & INTERACTIONS

### **Step Transitions**

```javascript
const stepTransitions = {
  // Slide transition between steps
  forward: {
    enter: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  },
  
  // Fade for error states
  error: {
    enter: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 }
  }
};

const progressBarAnimation = {
  animate: {
    width: `${currentStep / totalSteps * 100}%`,
    transition: { duration: 0.3, ease: "easeOut" }
  }
};
```

### **Form Field Animations**

```css
.form-field {
  transition: all 0.2s ease-in-out;
}

.form-field:focus-within {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.form-field.error {
  animation: shake 0.5s ease-in-out;
  border-color: #ef4444;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

.input-success {
  border-color: #22c55e;
  background-image: url("data:image/svg+xml,..."); /* checkmark */
}
```

---

## 🔧 ERROR HANDLING & VALIDATION

### **Comprehensive Error States**

```html
<!-- Field-level validation -->
<div class="form-field" :class="{ error: errors.destination }">
  <input v-model="destination" @blur="validateDestination" />
  <div class="error-message" v-if="errors.destination">
    <AlertCircle class="w-4 h-4" />
    {{ errors.destination }}
  </div>
  <div class="help-text" v-else>
    Try typing a city name, airport code, or address
  </div>
</div>

<!-- API error handling -->
<div class="api-error" v-if="apiError">
  <div class="error-content">
    <AlertTriangle class="w-6 h-6 text-red-400" />
    <div class="error-text">
      <h4>Something went wrong</h4>
      <p>{{ apiError.message }}</p>
    </div>
  </div>
  <div class="error-actions">
    <button class="btn-outline" @click="retryLastAction">
      <RefreshCw class="w-4 h-4 mr-2" />
      Try Again
    </button>
    <button class="btn-ghost" @click="contactSupport">
      <MessageCircle class="w-4 h-4 mr-2" />
      Get Help
    </button>
  </div>
</div>
```

### **Validation Rules**

```javascript
const validationRules = {
  destination: {
    required: true,
    minLength: 2,
    message: "Please enter a valid destination"
  },
  
  dates: {
    required: true,
    futureDate: true,
    maxDuration: 30,
    message: "Please select valid travel dates"
  },
  
  travelers: {
    min: 1,
    max: 20,
    message: "Please specify number of travelers (1-20)"
  },
  
  budget: {
    min: 100,
    max: 50000,
    message: "Budget must be between $100 - $50,000"
  }
};

const validateStep = (stepNumber) => {
  const errors = {};
  
  switch (stepNumber) {
    case 1:
      if (!destination) errors.destination = validationRules.destination.message;
      if (!startDate || !endDate) errors.dates = validationRules.dates.message;
      if (travelers < 1) errors.travelers = validationRules.travelers.message;
      break;
    case 2:
      if (!tripType) errors.tripType = "Please select a trip style";
      if (!budget.min) errors.budget = validationRules.budget.message;
      break;
  }
  
  return Object.keys(errors).length === 0 ? null : errors;
};
```

---

## 📱 MOBILE OPTIMIZATION

### **Mobile-Specific Adaptations**

**Simplified Mobile Layout:**
```html
<!-- Mobile: Stack everything vertically -->
<div class="wizard-mobile">
  <div class="mobile-progress">
    <!-- Simplified progress dots -->
    <div class="progress-dots">
      <div class="dot" :class="{ active: currentStep >= 1 }"></div>
      <div class="dot" :class="{ active: currentStep >= 2 }"></div>
      <div class="dot" :class="{ active: currentStep >= 3 }"></div>
      <div class="dot" :class="{ active: currentStep >= 4 }"></div>
    </div>
    <div class="progress-text">
      Step {{ currentStep }} of 4: {{ currentStepName }}
    </div>
  </div>
  
  <div class="mobile-content">
    <!-- Full-width form fields -->
    <!-- Larger touch targets (44px minimum) -->
    <!-- Simplified preview panel -->
  </div>
  
  <div class="mobile-actions">
    <!-- Fixed bottom action bar -->
    <button class="btn-secondary" v-if="currentStep > 1" @click="goBack">
      Back
    </button>
    <button class="btn-primary flex-1" @click="goForward">
      {{ currentStep === 4 ? 'Launch Planner' : 'Continue' }}
    </button>
  </div>
</div>
```

**Touch Optimizations:**
- **Minimum touch targets**: 44px × 44px
- **Swipe gestures**: Left/right to navigate steps
- **Pull-to-refresh**: Regenerate suggestions
- **Long press**: Access advanced options

---

## 📊 SUCCESS METRICS & ANALYTICS

### **Wizard Performance KPIs**

**Completion Metrics:**
- **Step 1 → Step 2**: Target 85%
- **Step 2 → Step 3**: Target 75%  
- **Step 3 → Step 4**: Target 90%
- **Step 4 → Planner**: Target 80%
- **Overall Completion**: Target 50% (huge improvement from ~15%)

**Engagement Metrics:**
- **Time per step**: 
  - Step 1: <60 seconds
  - Step 2: <90 seconds  
  - Step 3: <45 seconds (AI generation)
  - Step 4: <30 seconds
- **Error rates**: <5% per field
- **Retry attempts**: <2 average per user

**Quality Metrics:**
- **Generated trip satisfaction**: 4.5+/5 rating
- **Customization usage**: 40%+ users modify AI suggestions
- **Save for later**: <20% (want immediate planner launch)

### **A/B Testing Framework**

**Test Opportunities:**
1. **Step count**: 4-step vs 3-step vs 5-step flows
2. **AI preview**: Live generation vs final reveal
3. **Trip types**: Card selection vs dropdown
4. **Budget input**: Slider vs preset buttons vs text input

---

## 🔄 TECHNICAL IMPLEMENTATION

### **State Management**

```typescript
interface WizardState {
  currentStep: number;
  completed: boolean[];
  errors: Record<string, string>;
  
  // Step 1 data
  destination: {
    from: LocationData;
    to: LocationData;
  };
  dates: {
    start: Date;
    end: Date;
    duration: number;
  };
  travelers: {
    adults: number;
    children: number;
    infants: number;
  };
  
  // Step 2 data
  tripType: TripType;
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  interests: string[];
  preferences: {
    pace: 'relaxed' | 'moderate' | 'packed';
    transport: string[];
    dining: string;
  };
  
  // Step 3 data
  generationStatus: 'ready' | 'generating' | 'complete' | 'error';
  progress: number;
  previewData: ItineraryPreview;
  
  // Step 4 data
  finalItinerary: Itinerary;
}
```

### **API Integration Points**

```typescript
// Location search
GET /api/search/locations?q={query}&type=all
Response: { cities: [], airports: [], regions: [] }

// Destination info
GET /api/destinations/{slug}/info
Response: { weather: {}, timezone: "", currency: "", tips: [] }

// Trip generation
POST /api/trips/generate
Body: WizardState
Response: EventStream with progress updates

// Save trip
POST /api/trips/save
Body: { itinerary: Itinerary, metadata: {} }
Response: { tripId: string, url: string }
```

---

This comprehensive wizard redesign transforms the trip creation experience from a basic 8-step form into an intelligent, engaging 4-step journey that leverages AI, provides live feedback, and guides users seamlessly from initial idea to detailed itinerary. The new wizard will dramatically improve completion rates while creating a delightful user experience that showcases the power of AI-driven travel planning.

**Next Phase**: Implement these specifications starting with the location autocomplete and calendar components, followed by the AI generation streaming system.