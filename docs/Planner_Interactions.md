# Interactive Planner UX Specifications v1.1

**Version**: 1.1.0  
**Last Updated**: August 19, 2025  
**Status**: Core Interaction Phase  
**Objective**: Transform static timeline into dynamic, drag-and-drop trip planner with AI-powered reflow and reroute capabilities

---

## 🎯 INTERACTIVE PLANNER TRANSFORMATION

### **Current State Critical Issues**
- ❌ **Static timeline display**: No drag-and-drop or reordering capabilities
- ❌ **No reflow system**: Changes don't intelligently update the rest of the plan
- ❌ **Missing lock functionality**: Can't preserve important activities during replanning
- ❌ **No route optimization**: Travel times and logistics not considered
- ❌ **Poor mobile interaction**: Timeline doesn't work well on touch devices
- ❌ **No real-time updates**: Map and timeline not synchronized
- ❌ **Limited customization**: Can't easily modify or replace activities
- ❌ **No collaboration**: Can't share or co-edit plans with others

### **New Vision: Intelligent Interactive Planner**

> **Transform the trip planner into a sophisticated, AI-powered interface where users can drag, drop, lock, and reflow their entire itinerary while the system intelligently handles routing, timing, and logistics in real-time with seamless map integration.**

---

## 🗓️ INTERACTIVE TIMELINE DESIGN

### **Core Timeline Interface**

```html
<div class="interactive-planner">
  <!-- Planner Header -->
  <div class="planner-header">
    <div class="trip-context">
      <div class="trip-title">
        <h1>{{ tripTitle }}</h1>
        <div class="trip-meta">
          <span class="destination">{{ destination }}</span>
          <span class="duration">{{ formatDateRange(startDate, endDate) }}</span>
          <span class="travelers">{{ travelerCount }} travelers</span>
        </div>
      </div>
      
      <div class="trip-stats">
        <div class="stat-item">
          <MapPin class="w-4 h-4 text-emerald-400" />
          <span class="stat-value">{{ totalDistance }}km</span>
          <span class="stat-label">total travel</span>
        </div>
        <div class="stat-item">
          <Clock class="w-4 h-4 text-sky-400" />
          <span class="stat-value">{{ totalDuration }}h</span>
          <span class="stat-label">planned time</span>
        </div>
        <div class="stat-item">
          <DollarSign class="w-4 h-4 text-amber-400" />
          <span class="stat-value">{{ formatPrice(estimatedCost) }}</span>
          <span class="stat-label">estimated cost</span>
        </div>
      </div>
    </div>
    
    <div class="planner-actions">
      <button class="btn-ghost" @click="showPlannerSettings">
        <Settings class="w-4 h-4 mr-2" />
        Settings
      </button>
      <button class="btn-ghost" @click="exportItinerary">
        <Download class="w-4 h-4 mr-2" />
        Export
      </button>
      <button class="btn-ghost" @click="shareItinerary">
        <Share2 class="w-4 h-4 mr-2" />
        Share
      </button>
      <button class="btn-primary" @click="saveItinerary">
        <Save class="w-4 h-4 mr-2" />
        Save Changes
      </button>
    </div>
  </div>

  <!-- Main Planner Content -->
  <div class="planner-content">
    <!-- Timeline Panel -->
    <div class="timeline-panel" :class="{ collapsed: timelineCollapsed }">
      <div class="timeline-header">
        <div class="panel-title">
          <Calendar class="w-5 h-5" />
          <span>Your Itinerary</span>
        </div>
        
        <div class="timeline-controls">
          <button class="control-btn" 
                  :class="{ active: showTravelTimes }"
                  @click="toggleTravelTimes">
            <Route class="w-4 h-4" />
            Travel
          </button>
          <button class="control-btn" 
                  :class="{ active: showPricing }"
                  @click="togglePricing">
            <DollarSign class="w-4 h-4" />
            Costs
          </button>
          <button class="control-btn" @click="collapseTimeline">
            <ChevronLeft class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Day Navigation -->
      <div class="day-navigation">
        <div class="day-nav-scroll" ref="dayNavScroll">
          <button class="day-nav-btn" 
                  v-for="day in itineraryDays" 
                  :key="day.date"
                  :class="{ active: selectedDay === day.date }"
                  @click="selectDay(day.date)">
            <div class="day-info">
              <span class="day-name">{{ formatDayName(day.date) }}</span>
              <span class="day-date">{{ formatShortDate(day.date) }}</span>
            </div>
            <div class="day-summary">
              <span class="activity-count">{{ day.activities.length }}</span>
              <component :is="getWeatherIcon(day.weather)" class="w-3 h-3" />
            </div>
          </button>
        </div>
      </div>

      <!-- Timeline Days -->
      <div class="timeline-days" ref="timelineDays">
        <div class="day-section" 
             v-for="day in itineraryDays" 
             :key="day.date"
             :class="{ 
               selected: selectedDay === day.date,
               'has-changes': day.hasUnsavedChanges 
             }">
          
          <!-- Day Header -->
          <div class="day-header" @click="selectDay(day.date)">
            <div class="day-title">
              <h3 class="day-name">{{ formatDayName(day.date) }}</h3>
              <span class="day-date">{{ formatDate(day.date) }}</span>
              <input 
                v-if="day.editingTitle" 
                v-model="day.customTitle" 
                class="day-title-input"
                @blur="saveDayTitle(day)"
                @keyup.enter="saveDayTitle(day)"
              />
              <span 
                v-else-if="day.customTitle" 
                class="day-custom-title"
                @click="editDayTitle(day)">
                {{ day.customTitle }}
              </span>
            </div>
            
            <div class="day-summary-stats">
              <div class="day-weather">
                <component :is="getWeatherIcon(day.weather)" class="w-4 h-4" />
                <span class="temp-range">{{ day.weather.high }}°/{{ day.weather.low }}°</span>
              </div>
              <div class="day-totals">
                <span class="total-duration">{{ formatDuration(day.totalDuration) }}</span>
                <span class="total-cost">{{ formatPrice(day.totalCost) }}</span>
              </div>
            </div>
            
            <div class="day-actions">
              <button class="day-action-btn" @click="optimizeDay(day)">
                <Zap class="w-4 h-4" />
              </button>
              <button class="day-action-btn" @click="showDayOptions(day)">
                <MoreVertical class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Activities Timeline -->
          <div class="activities-timeline">
            <DraggableContainer 
              v-model="day.activities"
              group="activities"
              :disabled="false"
              class="activity-list"
              @start="onDragStart"
              @end="onDragEnd"
              @change="onActivityReorder">
              
              <TransitionGroup name="activity" tag="div">
                <div 
                  v-for="(activity, index) in day.activities" 
                  :key="activity.id"
                  class="activity-item"
                  :class="{ 
                    locked: activity.isLocked, 
                    selected: selectedActivity === activity.id,
                    dragging: draggingActivity === activity.id 
                  }">
                  
                  <!-- Activity Time -->
                  <div class="activity-time">
                    <div class="time-display">
                      <span class="start-time">{{ formatTime(activity.startTime) }}</span>
                      <span class="end-time">{{ formatTime(activity.endTime) }}</span>
                    </div>
                    <div class="duration">{{ formatDuration(activity.duration) }}</div>
                  </div>

                  <!-- Activity Content -->
                  <div class="activity-content" @click="selectActivity(activity)">
                    <div class="activity-main">
                      <div class="activity-header">
                        <div class="activity-icon">
                          <component :is="activity.icon" 
                                   class="w-5 h-5" 
                                   :class="activity.iconClass" />
                        </div>
                        <div class="activity-title">
                          <h4>{{ activity.name }}</h4>
                          <div class="activity-meta">
                            <span class="activity-type">{{ activity.type }}</span>
                            <span class="activity-location">{{ activity.location.name }}</span>
                          </div>
                        </div>
                        <div class="activity-controls">
                          <button class="control-btn lock-btn" 
                                  :class="{ active: activity.isLocked }"
                                  @click="toggleActivityLock(activity)">
                            <Lock v-if="activity.isLocked" class="w-4 h-4" />
                            <Unlock v-else class="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <!-- Activity Details -->
                      <div class="activity-details" v-if="selectedActivity === activity.id">
                        <div class="detail-tabs">
                          <button class="detail-tab" 
                                  :class="{ active: activeDetailTab === 'info' }"
                                  @click="activeDetailTab = 'info'">
                            Info
                          </button>
                          <button class="detail-tab" 
                                  :class="{ active: activeDetailTab === 'location' }"
                                  @click="activeDetailTab = 'location'">
                            Location
                          </button>
                          <button class="detail-tab" 
                                  :class="{ active: activeDetailTab === 'alternatives' }"
                                  @click="activeDetailTab = 'alternatives'">
                            Alternatives
                          </button>
                        </div>

                        <div class="detail-content">
                          <!-- Info Tab -->
                          <div v-if="activeDetailTab === 'info'" class="info-tab">
                            <div class="activity-description">
                              <p>{{ activity.description }}</p>
                            </div>
                            
                            <div class="activity-practical">
                              <div class="practical-item" v-if="activity.openingHours">
                                <Clock class="w-4 h-4" />
                                <span>{{ activity.openingHours }}</span>
                              </div>
                              <div class="practical-item" v-if="activity.pricing">
                                <DollarSign class="w-4 h-4" />
                                <span>{{ formatPrice(activity.pricing) }}</span>
                              </div>
                              <div class="practical-item" v-if="activity.bookingRequired">
                                <Calendar class="w-4 h-4" />
                                <span>Booking required</span>
                              </div>
                            </div>
                          </div>

                          <!-- Location Tab -->
                          <div v-if="activeDetailTab === 'location'" class="location-tab">
                            <div class="location-info">
                              <div class="address">
                                <MapPin class="w-4 h-4" />
                                <span>{{ activity.location.address }}</span>
                              </div>
                              <div class="coordinates">
                                <span>{{ activity.location.coordinates.lat }}, {{ activity.location.coordinates.lng }}</span>
                              </div>
                            </div>
                            
                            <div class="travel-context">
                              <div class="travel-from" v-if="activity.travelFrom">
                                <span>From {{ activity.travelFrom.name }}: {{ activity.travelFrom.duration }} ({{ activity.travelFrom.distance }})</span>
                              </div>
                              <div class="travel-to" v-if="activity.travelTo">
                                <span>To {{ activity.travelTo.name }}: {{ activity.travelTo.duration }} ({{ activity.travelTo.distance }})</span>
                              </div>
                            </div>
                          </div>

                          <!-- Alternatives Tab -->
                          <div v-if="activeDetailTab === 'alternatives'" class="alternatives-tab">
                            <div class="alternative-activities">
                              <div class="alternative-item" 
                                   v-for="alt in activity.alternatives" 
                                   :key="alt.id">
                                <img :src="alt.image" :alt="alt.name" class="alt-image" />
                                <div class="alt-info">
                                  <h5>{{ alt.name }}</h5>
                                  <div class="alt-meta">
                                    <span class="alt-rating">{{ alt.rating }}/10</span>
                                    <span class="alt-price">{{ formatPrice(alt.price) }}</span>
                                  </div>
                                </div>
                                <button class="btn-ghost btn-sm" @click="replaceActivity(activity, alt)">
                                  Replace
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Activity Actions -->
                    <div class="activity-actions">
                      <button class="action-btn" @click="editActivity(activity)">
                        <Edit3 class="w-4 h-4" />
                      </button>
                      <button class="action-btn" @click="duplicateActivity(activity)">
                        <Copy class="w-4 h-4" />
                      </button>
                      <button class="action-btn danger" @click="removeActivity(activity)">
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <!-- Travel Connector -->
                  <div class="travel-connector" 
                       v-if="index < day.activities.length - 1"
                       :class="{ 'show-details': showTravelTimes }">
                    <div class="travel-line"></div>
                    <div class="travel-info" v-if="showTravelTimes">
                      <component :is="getTravelIcon(activity.travelTo.mode)" class="w-3 h-3" />
                      <span class="travel-duration">{{ activity.travelTo.duration }}</span>
                      <span class="travel-distance">{{ activity.travelTo.distance }}</span>
                    </div>
                  </div>
                </div>
              </TransitionGroup>
            </DraggableContainer>

            <!-- Add Activity Button -->
            <div class="add-activity-zone" @click="showAddActivity(day)">
              <button class="add-activity-btn">
                <Plus class="w-5 h-5" />
                <span>Add activity to {{ formatDayName(day.date) }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Map Panel -->
    <div class="map-panel">
      <div class="map-container" ref="mapContainer">
        <!-- Interactive Map -->
        <div id="itinerary-map" class="itinerary-map"></div>
        
        <!-- Map Overlays -->
        <div class="map-overlays">
          <!-- Map Controls -->
          <div class="map-controls">
            <button class="map-control" 
                    :class="{ active: mapMode === 'overview' }"
                    @click="setMapMode('overview')">
              <Globe class="w-4 h-4" />
              Overview
            </button>
            <button class="map-control" 
                    :class="{ active: mapMode === 'day' }"
                    @click="setMapMode('day')">
              <MapPin class="w-4 h-4" />
              Day View
            </button>
            <button class="map-control" 
                    :class="{ active: showRoutes }"
                    @click="toggleRoutes">
              <Route class="w-4 h-4" />
              Routes
            </button>
          </div>

          <!-- Day Progress Indicator -->
          <div class="day-progress" v-if="mapMode === 'day'">
            <div class="progress-header">
              <span>{{ formatDayName(selectedDay) }}</span>
              <span>{{ currentDayProgress }}% complete</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: currentDayProgress + '%' }"></div>
            </div>
            <div class="progress-activities">
              <div class="progress-activity" 
                   v-for="(activity, index) in selectedDayActivities" 
                   :key="activity.id"
                   :class="{ 
                     current: currentActivity === activity.id,
                     completed: activity.completed 
                   }"
                   @click="focusOnActivity(activity)">
                <div class="activity-marker">{{ index + 1 }}</div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="map-quick-actions">
            <button class="quick-action" @click="centerOnCurrentDay">
              <Target class="w-4 h-4" />
            </button>
            <button class="quick-action" @click="optimizeRoutes">
              <Zap class="w-4 h-4" />
            </button>
            <button class="quick-action" @click="addNearbyActivities">
              <Plus class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## 🎛️ DRAG & DROP SYSTEM

### **Advanced Dragging Mechanics**

```javascript
const dragDropSystem = {
  // Dragging state management
  state: {
    isDragging: false,
    draggedActivity: null,
    dragStartPosition: null,
    dropTargets: [],
    ghostElement: null,
    scrollContainer: null
  },

  // Initialize drag system
  initialize() {
    this.setupDragHandlers();
    this.setupDropZones();
    this.setupAutoScroll();
  },

  // Enhanced drag start
  onDragStart(event, activity) {
    this.state.isDragging = true;
    this.state.draggedActivity = activity;
    this.state.dragStartPosition = { day: activity.day, index: activity.index };
    
    // Create custom ghost element
    this.createCustomGhost(event, activity);
    
    // Highlight valid drop targets
    this.highlightDropTargets(activity);
    
    // Start auto-scroll monitoring
    this.startAutoScroll();
    
    // Track drag analytics
    analytics.track('activity_drag_started', {
      activity_type: activity.type,
      day: activity.day,
      position: activity.index
    });
  },

  // Smart drop zone detection
  onDragOver(event, targetDay, targetIndex) {
    event.preventDefault();
    
    const draggedActivity = this.state.draggedActivity;
    if (!draggedActivity) return;
    
    // Calculate drop position
    const dropPosition = this.calculateDropPosition(event, targetDay, targetIndex);
    
    // Check if drop is valid
    const isValidDrop = this.validateDrop(draggedActivity, dropPosition);
    
    // Update drop indicator
    this.updateDropIndicator(dropPosition, isValidDrop);
    
    // Show reflow preview
    if (isValidDrop) {
      this.showReflowPreview(draggedActivity, dropPosition);
    }
  },

  // Execute drop with reflow
  onDrop(event, targetDay, targetIndex) {
    event.preventDefault();
    
    const draggedActivity = this.state.draggedActivity;
    const dropPosition = { day: targetDay, index: targetIndex };
    
    if (!this.validateDrop(draggedActivity, dropPosition)) {
      this.revertDrag();
      return;
    }
    
    // Execute the move with reflow
    this.executeActivityMove(draggedActivity, dropPosition);
    
    // Clean up drag state
    this.cleanupDrag();
    
    // Track successful drop
    analytics.track('activity_drag_completed', {
      from_day: this.state.dragStartPosition.day,
      to_day: dropPosition.day,
      from_index: this.state.dragStartPosition.index,
      to_index: dropPosition.index,
      reflow_triggered: true
    });
  },

  // Smart reflow logic
  executeActivityMove(activity, newPosition) {
    // 1. Remove from original position
    const originalDay = this.getDay(activity.day);
    const originalIndex = originalDay.activities.findIndex(a => a.id === activity.id);
    originalDay.activities.splice(originalIndex, 1);
    
    // 2. Insert at new position
    const targetDay = this.getDay(newPosition.day);
    targetDay.activities.splice(newPosition.index, 0, activity);
    
    // 3. Update activity day reference
    activity.day = newPosition.day;
    
    // 4. Trigger intelligent reflow
    this.triggerReflow([activity.day, newPosition.day]);
    
    // 5. Update map markers
    this.updateMapMarkers();
    
    // 6. Recalculate routes and times
    this.recalculateRoutesAndTimes();
  },

  // Visual feedback system
  createCustomGhost(event, activity) {
    const ghost = document.createElement('div');
    ghost.className = 'activity-drag-ghost';
    ghost.innerHTML = `
      <div class="ghost-content">
        <div class="ghost-icon">
          <${activity.icon} class="w-5 h-5" />
        </div>
        <div class="ghost-text">
          <span class="ghost-name">${activity.name}</span>
          <span class="ghost-time">${this.formatTime(activity.startTime)}</span>
        </div>
      </div>
    `;
    
    document.body.appendChild(ghost);
    this.state.ghostElement = ghost;
    
    // Position ghost at cursor
    this.updateGhostPosition(event);
  },

  // Auto-scroll while dragging
  startAutoScroll() {
    const scrollContainer = document.querySelector('.timeline-days');
    let scrollSpeed = 0;
    
    const autoScroll = () => {
      if (!this.state.isDragging) return;
      
      const containerRect = scrollContainer.getBoundingClientRect();
      const mouseY = this.lastMousePosition.y;
      
      // Calculate scroll speed based on proximity to edges
      if (mouseY < containerRect.top + 50) {
        scrollSpeed = -((containerRect.top + 50 - mouseY) / 50) * 10;
      } else if (mouseY > containerRect.bottom - 50) {
        scrollSpeed = ((mouseY - containerRect.bottom + 50) / 50) * 10;
      } else {
        scrollSpeed = 0;
      }
      
      if (scrollSpeed !== 0) {
        scrollContainer.scrollTop += scrollSpeed;
      }
      
      requestAnimationFrame(autoScroll);
    };
    
    requestAnimationFrame(autoScroll);
  }
};
```

---

## 🤖 AI REFLOW SYSTEM

### **Intelligent Itinerary Reflow**

```javascript
const aiReflowSystem = {
  // Main reflow orchestrator
  async triggerReflow(affectedDays, options = {}) {
    const reflowConfig = {
      preserveLocked: true,
      optimizeRoutes: true,
      considerWeather: true,
      maintainPreferences: true,
      ...options
    };
    
    // Collect reflow context
    const context = await this.gatherReflowContext(affectedDays);
    
    // Generate reflow plan
    const reflowPlan = await this.generateReflowPlan(context, reflowConfig);
    
    // Apply reflow with user confirmation if major changes
    if (reflowPlan.requiresConfirmation) {
      await this.showReflowConfirmation(reflowPlan);
    } else {
      await this.executeReflow(reflowPlan);
    }
  },

  // Gather comprehensive context
  async gatherReflowContext(affectedDays) {
    const context = {
      days: {},
      constraints: {
        locked: [],
        timeWindows: [],
        preferences: []
      },
      external: {
        weather: {},
        hours: {},
        routes: {}
      }
    };
    
    // Collect day data
    for (const dayDate of affectedDays) {
      const day = this.getDay(dayDate);
      context.days[dayDate] = {
        activities: day.activities,
        weather: await weatherService.getForecast(dayDate),
        constraints: this.extractDayConstraints(day)
      };
      
      // Collect locked activities
      const lockedActivities = day.activities.filter(a => a.isLocked);
      context.constraints.locked.push(...lockedActivities);
    }
    
    // Get opening hours for all activities
    const allActivities = Object.values(context.days)
      .flatMap(day => day.activities);
    context.external.hours = await this.getOpeningHours(allActivities);
    
    // Get route information
    context.external.routes = await this.calculateRouteMatrix(allActivities);
    
    return context;
  },

  // Generate intelligent reflow plan
  async generateReflowPlan(context, config) {
    const prompt = this.buildReflowPrompt(context, config);
    
    const aiResponse = await aiService.generate({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      tools: [
        this.timeOptimizationTool,
        this.routeOptimizationTool,
        this.weatherAdaptationTool
      ]
    });
    
    // Parse and validate AI response
    const reflowPlan = this.parseReflowResponse(aiResponse);
    
    // Calculate impact assessment
    reflowPlan.impact = this.assessReflowImpact(reflowPlan, context);
    
    // Determine if user confirmation needed
    reflowPlan.requiresConfirmation = this.requiresConfirmation(reflowPlan.impact);
    
    return reflowPlan;
  },

  // Build context-aware prompt
  buildReflowPrompt(context, config) {
    return `
You are an intelligent trip planner tasked with optimizing an itinerary after changes.

CURRENT SITUATION:
${JSON.stringify(context, null, 2)}

REFLOW REQUIREMENTS:
- Preserve all locked activities at their current times
- Optimize travel routes and minimize backtracking
- Consider weather conditions for outdoor activities
- Respect opening hours and booking requirements
- Maintain user preferences and trip style
- Keep activities within reasonable time windows

CONSTRAINTS:
${config.preserveLocked ? '- NEVER move locked activities' : ''}
${config.optimizeRoutes ? '- Optimize for minimal travel time' : ''}
${config.considerWeather ? '- Adapt to weather conditions' : ''}

Please provide:
1. Optimized schedule for each affected day
2. Explanation of changes made
3. Alternative options if trade-offs are required
4. Impact assessment (time saved, costs, experience quality)

Return your response in this JSON format:
{
  "days": {
    "YYYY-MM-DD": {
      "activities": [
        {
          "id": "activity_id",
          "startTime": "HH:MM",
          "endTime": "HH:MM",
          "changes": "description of changes"
        }
      ],
      "summary": "day optimization summary"
    }
  },
  "globalChanges": {
    "timeSaved": "minutes",
    "routeOptimization": "description",
    "weatherAdaptations": "description"
  },
  "alternatives": [
    {
      "option": "alternative description",
      "tradeoffs": "what would be different"
    }
  ],
  "explanation": "overall reasoning"
}
`;
  },

  // Execute reflow plan
  async executeReflow(reflowPlan) {
    // Show reflow in progress
    this.showReflowProgress();
    
    try {
      // Apply time changes
      await this.applyTimeChanges(reflowPlan.days);
      
      // Update routes
      await this.updateRoutes(reflowPlan.days);
      
      // Refresh map
      await this.refreshMap();
      
      // Update cost estimates
      await this.updateCostEstimates();
      
      // Show success notification
      this.showReflowSuccess(reflowPlan);
      
    } catch (error) {
      console.error('Reflow execution failed:', error);
      this.showReflowError(error);
      
      // Revert changes
      await this.revertReflow();
    }
  },

  // Smart reflow confirmation dialog
  showReflowConfirmation(reflowPlan) {
    return new Promise((resolve, reject) => {
      const modal = createModal({
        title: 'Optimize Your Itinerary?',
        content: `
          <div class="reflow-confirmation">
            <div class="reflow-summary">
              <h3>Suggested Changes</h3>
              <div class="changes-list">
                ${this.renderChanges(reflowPlan)}
              </div>
            </div>
            
            <div class="reflow-benefits">
              <h3>Benefits</h3>
              <div class="benefit-item">
                <Clock class="w-4 h-4 text-green-400" />
                <span>Save ${reflowPlan.globalChanges.timeSaved} minutes of travel</span>
              </div>
              <div class="benefit-item">
                <Route class="w-4 h-4 text-blue-400" />
                <span>${reflowPlan.globalChanges.routeOptimization}</span>
              </div>
              <div class="benefit-item" v-if="reflowPlan.globalChanges.weatherAdaptations">
                <Cloud class="w-4 h-4 text-sky-400" />
                <span>${reflowPlan.globalChanges.weatherAdaptations}</span>
              </div>
            </div>
            
            ${reflowPlan.alternatives.length > 0 ? `
            <div class="reflow-alternatives">
              <h3>Other Options</h3>
              ${reflowPlan.alternatives.map(alt => `
                <div class="alternative-option">
                  <span>${alt.option}</span>
                  <small>${alt.tradeoffs}</small>
                </div>
              `).join('')}
            </div>
            ` : ''}
          </div>
        `,
        actions: [
          {
            text: 'Cancel',
            variant: 'ghost',
            action: () => reject(new Error('User cancelled reflow'))
          },
          {
            text: 'Apply Changes',
            variant: 'primary',
            action: () => resolve(reflowPlan)
          }
        ]
      });
      
      modal.show();
    });
  }
};
```

---

## 🔐 LOCK SYSTEM

### **Activity Locking Mechanics**

```javascript
const activityLockSystem = {
  // Toggle lock state
  toggleActivityLock(activity) {
    if (activity.isLocked) {
      this.unlockActivity(activity);
    } else {
      this.lockActivity(activity);
    }
  },

  // Lock activity with visual feedback
  lockActivity(activity) {
    activity.isLocked = true;
    activity.lockReason = 'User locked';
    activity.lockedAt = new Date();
    
    // Visual feedback
    this.animateLockAction(activity.id, 'lock');
    
    // Show lock tooltip
    this.showLockTooltip(activity, 'This activity is now locked and won\'t be moved during optimization');
    
    // Track analytics
    analytics.track('activity_locked', {
      activity_type: activity.type,
      day: activity.day,
      lock_reason: 'manual'
    });
  },

  // Unlock activity
  unlockActivity(activity) {
    activity.isLocked = false;
    activity.lockReason = null;
    activity.lockedAt = null;
    
    // Visual feedback
    this.animateLockAction(activity.id, 'unlock');
    
    // Show unlock tooltip
    this.showLockTooltip(activity, 'This activity can now be optimized and moved');
    
    // Track analytics
    analytics.track('activity_unlocked', {
      activity_type: activity.type,
      day: activity.day
    });
  },

  // Auto-lock important activities
  autoLockImportantActivities(activities) {
    const autoLockCriteria = [
      // Ticketed events with specific times
      activity => activity.hasTicket && activity.timeSpecific,
      
      // Restaurant reservations
      activity => activity.type === 'restaurant' && activity.hasReservation,
      
      // Tours with fixed start times
      activity => activity.type === 'tour' && activity.fixedStartTime,
      
      // Transportation bookings
      activity => ['flight', 'train', 'bus'].includes(activity.type)
    ];
    
    activities.forEach(activity => {
      const shouldAutoLock = autoLockCriteria.some(criteria => criteria(activity));
      
      if (shouldAutoLock && !activity.isLocked) {
        activity.isLocked = true;
        activity.lockReason = 'Auto-locked (time-sensitive)';
        activity.autoLocked = true;
        
        // Show notification for auto-locked items
        this.showAutoLockNotification(activity);
      }
    });
  },

  // Lock conflict resolution
  resolveLockConflicts(day, newActivity, proposedTime) {
    const conflicts = day.activities.filter(activity => {
      if (!activity.isLocked) return false;
      
      const activityEnd = new Date(activity.endTime);
      const activityStart = new Date(activity.startTime);
      const newStart = new Date(proposedTime);
      const newEnd = new Date(newStart.getTime() + newActivity.duration * 60000);
      
      // Check for time overlap
      return (newStart < activityEnd && newEnd > activityStart);
    });
    
    if (conflicts.length === 0) return null;
    
    // Generate resolution options
    const resolutionOptions = [];
    
    // Option 1: Schedule before first conflict
    const firstConflict = conflicts.sort((a, b) => 
      new Date(a.startTime) - new Date(b.startTime)
    )[0];
    
    const beforeTime = new Date(new Date(firstConflict.startTime) - newActivity.duration * 60000);
    if (beforeTime > new Date()) {
      resolutionOptions.push({
        type: 'schedule_before',
        time: beforeTime,
        description: `Schedule at ${this.formatTime(beforeTime)} (before ${firstConflict.name})`
      });
    }
    
    // Option 2: Schedule after last conflict
    const lastConflict = conflicts.sort((a, b) => 
      new Date(b.endTime) - new Date(a.endTime)
    )[0];
    
    const afterTime = new Date(lastConflict.endTime);
    resolutionOptions.push({
      type: 'schedule_after',
      time: afterTime,
      description: `Schedule at ${this.formatTime(afterTime)} (after ${lastConflict.name})`
    });
    
    // Option 3: Move to different day
    resolutionOptions.push({
      type: 'move_day',
      description: 'Move to a different day'
    });
    
    return {
      conflicts,
      resolutionOptions,
      showResolutionDialog: true
    };
  }
};
```

---

## 🗺️ MAP INTEGRATION

### **Synchronized Map Interactions**

```javascript
const mapIntegration = {
  // Initialize map with itinerary data
  initializeMap() {
    this.map = new mapboxgl.Map({
      container: 'itinerary-map',
      style: 'mapbox://styles/tripthesia/itinerary-theme',
      center: this.calculateMapCenter(),
      zoom: this.calculateOptimalZoom()
    });
    
    // Add custom controls
    this.map.addControl(new mapboxgl.NavigationControl());
    this.map.addControl(new mapboxgl.FullscreenControl());
    
    // Set up event handlers
    this.setupMapEventHandlers();
    
    // Initial render
    this.renderItineraryOnMap();
  },

  // Render complete itinerary
  renderItineraryOnMap() {
    // Clear existing layers
    this.clearMapLayers();
    
    // Render by current mode
    switch (this.mapMode) {
      case 'overview':
        this.renderOverviewMode();
        break;
      case 'day':
        this.renderDayMode();
        break;
      default:
        this.renderOverviewMode();
    }
  },

  // Overview mode: All days visible
  renderOverviewMode() {
    const allActivities = this.getAllActivities();
    
    // Add activity markers
    allActivities.forEach((activity, index) => {
      const marker = this.createActivityMarker(activity, index + 1);
      marker.addTo(this.map);
    });
    
    // Add day-wise route lines
    this.itineraryDays.forEach((day, dayIndex) => {
      if (day.activities.length > 1) {
        this.addDayRouteLine(day, dayIndex);
      }
    });
    
    // Fit bounds to show all activities
    this.fitMapToAllActivities();
  },

  // Day mode: Focus on single day
  renderDayMode() {
    const selectedDay = this.getSelectedDay();
    if (!selectedDay || selectedDay.activities.length === 0) return;
    
    // Add numbered markers for day activities
    selectedDay.activities.forEach((activity, index) => {
      const marker = this.createDayActivityMarker(activity, index + 1);
      marker.addTo(this.map);
    });
    
    // Add route line connecting activities
    if (selectedDay.activities.length > 1) {
      this.addDayRouteLine(selectedDay);
    }
    
    // Add route information
    this.addRouteSegments(selectedDay);
    
    // Fit bounds to day activities
    this.fitMapToDay(selectedDay);
  },

  // Create interactive activity marker
  createActivityMarker(activity, number) {
    const markerElement = document.createElement('div');
    markerElement.className = `activity-marker ${activity.type}`;
    markerElement.innerHTML = `
      <div class="marker-content">
        <div class="marker-number">${number}</div>
        <div class="marker-icon">
          <${activity.icon} class="w-4 h-4" />
        </div>
      </div>
    `;
    
    // Add click handler
    markerElement.addEventListener('click', () => {
      this.focusOnActivity(activity);
      this.selectActivity(activity);
    });
    
    // Create popup
    const popup = new mapboxgl.Popup({ offset: 25 })
      .setHTML(`
        <div class="activity-popup">
          <div class="popup-header">
            <h3>${activity.name}</h3>
            <span class="activity-time">${this.formatTime(activity.startTime)}</span>
          </div>
          <div class="popup-content">
            <p>${activity.description || ''}</p>
            <div class="popup-meta">
              <span class="duration">${this.formatDuration(activity.duration)}</span>
              <span class="location">${activity.location.name}</span>
            </div>
          </div>
          <div class="popup-actions">
            <button onclick="plannerApp.editActivity('${activity.id}')">Edit</button>
            <button onclick="plannerApp.focusOnActivity('${activity.id}')">Focus</button>
          </div>
        </div>
      `);
    
    const marker = new mapboxgl.Marker({
      element: markerElement,
      anchor: 'bottom'
    })
      .setLngLat([activity.location.coordinates.lng, activity.location.coordinates.lat])
      .setPopup(popup);
    
    return marker;
  },

  // Add route visualization
  addDayRouteLine(day, dayIndex = 0) {
    const coordinates = day.activities.map(activity => [
      activity.location.coordinates.lng,
      activity.location.coordinates.lat
    ]);
    
    const routeId = `route-day-${dayIndex}`;
    
    // Add route line
    this.map.addSource(routeId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: coordinates
        }
      }
    });
    
    this.map.addLayer({
      id: routeId,
      type: 'line',
      source: routeId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': this.getDayColor(dayIndex),
        'line-width': 4,
        'line-opacity': 0.8
      }
    });
    
    // Add directional arrows
    this.addRouteArrows(routeId, coordinates, dayIndex);
  },

  // Real-time map updates during drag operations
  updateMapDuringDrag(draggedActivity, newPosition) {
    // Update marker position temporarily
    const markerId = `marker-${draggedActivity.id}`;
    const marker = this.markers[markerId];
    
    if (marker) {
      // Add visual feedback class
      marker.getElement().classList.add('dragging');
      
      // Update popup content
      const popup = marker.getPopup();
      if (popup) {
        popup.setHTML(this.generateDragPopupContent(draggedActivity, newPosition));
      }
    }
    
    // Update route lines
    this.updateRoutePreview(draggedActivity, newPosition);
  },

  // Synchronize with timeline selection
  syncWithTimeline(selectedActivity, selectedDay) {
    // Highlight selected activity marker
    this.highlightActivityMarker(selectedActivity);
    
    // Update map focus based on selection
    if (this.mapMode === 'day' && selectedDay) {
      this.renderDayMode();
    }
    
    // Pan to selected activity if needed
    if (selectedActivity && !this.isActivityVisible(selectedActivity)) {
      this.panToActivity(selectedActivity);
    }
  }
};
```

This comprehensive interactive planner system transforms the static timeline into a sophisticated, AI-powered interface where users can intuitively manage their entire itinerary through drag-and-drop interactions, intelligent reflow, activity locking, and real-time map synchronization. The system handles all the complex logistics while maintaining a smooth, responsive user experience.
