"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

// Conditionally import Mapbox only if token is available
let mapboxgl: any = null;
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
  import("mapbox-gl").then((module) => {
    mapboxgl = module.default;
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
    // Import CSS
    import("mapbox-gl/dist/mapbox-gl.css");
  });
}

interface Activity {
  id: string;
  name: string;
  location: {
    name: string;
    coordinates: { lat: number; lng: number };
  };
  category: string;
  timeSlot: {
    start: string;
    end: string;
  };
  isLocked: boolean;
}

interface DayPlan {
  date: string;
  activities: Activity[];
}

interface TripMapProps {
  days: DayPlan[];
  activeDay?: number;
  hoveredActivity?: string | null;
  onActivityClick?: (activityId: string) => void;
  className?: string;
}

const CATEGORY_COLORS = {
  Transportation: "#6B7280",
  Sightseeing: "#10B981", 
  Food: "#F59E0B",
  Shopping: "#8B5CF6",
  Cultural: "#3B82F6",
  Nature: "#059669",
  Entertainment: "#EC4899",
  Business: "#6366F1",
  default: "#6B7280",
};

const CATEGORY_ICONS = {
  Transportation: "🚗",
  Sightseeing: "🏛️",
  Food: "🍽️", 
  Shopping: "🛍️",
  Cultural: "🎭",
  Nature: "🌿",
  Entertainment: "🎪",
  Business: "💼",
  default: "📍",
};

export function TripMap({ 
  days, 
  activeDay = 0, 
  hoveredActivity, 
  onActivityClick,
  className 
}: TripMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapboxAvailable, setMapboxAvailable] = useState(false);

  // Check if Mapbox is available
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
      console.warn("Mapbox token not available, map will not be displayed");
      return;
    }
    setMapboxAvailable(true);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current || !mapboxAvailable || !mapboxgl) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [2.3522, 48.8566], // Default to Paris
      zoom: 12,
      attributionControl: false,
    });

    map.current.addControl(new mapboxgl.AttributionControl(), "bottom-right");
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.current.on("load", () => {
      setIsLoaded(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    if (!map.current || !isLoaded || !days.length) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    const currentDay = days[activeDay] || days[0];
    if (!currentDay?.activities?.length) return;

    const bounds = new mapboxgl.LngLatBounds();
    let validCoordinates = false;

    // Add markers for each activity
    currentDay.activities.forEach((activity, index) => {
      const { lat, lng } = activity.location.coordinates;
      
      if (!lat || !lng || lat === 0 || lng === 0) return;
      
      validCoordinates = true;
      bounds.extend([lng, lat]);

      // Create custom marker element
      const markerEl = document.createElement("div");
      markerEl.className = "custom-marker";
      markerEl.style.cssText = `
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: ${CATEGORY_COLORS[activity.category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.default};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        z-index: ${activity.isLocked ? 1000 : 100 + index};
      `;
      
      // Add activity number or icon
      const iconSpan = document.createElement("span");
      iconSpan.textContent = CATEGORY_ICONS[activity.category as keyof typeof CATEGORY_ICONS] || 
                             CATEGORY_ICONS.default;
      markerEl.appendChild(iconSpan);

      // Add locked indicator
      if (activity.isLocked) {
        markerEl.style.borderColor = "#F59E0B";
        markerEl.style.borderWidth = "4px";
        const lockIcon = document.createElement("div");
        lockIcon.innerHTML = "🔒";
        lockIcon.style.cssText = `
          position: absolute;
          top: -8px;
          right: -8px;
          background: #F59E0B;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
        `;
        markerEl.appendChild(lockIcon);
      }

      // Create marker
      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat([lng, lat])
        .addTo(map.current!);

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        closeOnClick: false,
      }).setHTML(`
        <div class="p-2">
          <h3 class="font-semibold text-sm">${activity.name}</h3>
          <p class="text-xs text-gray-600">${activity.location.name}</p>
          <p class="text-xs text-gray-500">${activity.timeSlot.start} - ${activity.timeSlot.end}</p>
        </div>
      `);

      // Add event listeners
      markerEl.addEventListener("mouseenter", () => {
        popup.addTo(map.current!);
        markerEl.style.transform = "scale(1.1)";
        markerEl.style.zIndex = "1001";
      });

      markerEl.addEventListener("mouseleave", () => {
        popup.remove();
        markerEl.style.transform = "scale(1)";
        markerEl.style.zIndex = activity.isLocked ? "1000" : `${100 + index}`;
      });

      markerEl.addEventListener("click", () => {
        if (onActivityClick) {
          onActivityClick(activity.id);
        }
      });

      markersRef.current[activity.id] = marker;
    });

    // Fit map to bounds if we have valid coordinates
    if (validCoordinates) {
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15,
      });
    }

    // Add route line between activities
    if (currentDay.activities.length > 1) {
      addRouteVisualization(currentDay.activities);
    }

  }, [days, activeDay, isLoaded, onActivityClick]);

  // Highlight hovered activity
  useEffect(() => {
    if (!hoveredActivity || !markersRef.current[hoveredActivity]) return;

    const marker = markersRef.current[hoveredActivity];
    const markerEl = marker.getElement();
    
    // Add highlight effect
    markerEl.style.transform = "scale(1.2)";
    markerEl.style.zIndex = "1002";
    markerEl.style.boxShadow = "0 4px 16px rgba(0,0,0,0.4)";

    return () => {
      markerEl.style.transform = "scale(1)";
      markerEl.style.zIndex = "100";
      markerEl.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
    };
  }, [hoveredActivity]);

  const addRouteVisualization = (activities: Activity[]) => {
    if (!map.current) return;

    const coordinates = activities
      .filter(activity => {
        const { lat, lng } = activity.location.coordinates;
        return lat && lng && lat !== 0 && lng !== 0;
      })
      .map(activity => [
        activity.location.coordinates.lng,
        activity.location.coordinates.lat
      ]);

    if (coordinates.length < 2) return;

    // Remove existing route
    if (map.current.getSource("route")) {
      map.current.removeLayer("route");
      map.current.removeSource("route");
    }

    // Add route source and layer
    map.current.addSource("route", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: coordinates,
        },
      },
    });

    map.current.addLayer({
      id: "route",
      type: "line",
      source: "route",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#3B82F6",
        "line-width": 3,
        "line-opacity": 0.7,
      },
    });
  };

  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p>Mapbox token not configured</p>
            <p className="text-sm mt-2">
              Add NEXT_PUBLIC_MAPBOX_TOKEN to your environment variables
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div
          ref={mapContainer}
          className="w-full h-full min-h-[400px] rounded-lg"
          style={{ minHeight: "400px" }}
        />
        
        {/* Loading overlay */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
          </div>
        )}

        {/* Map legend */}
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm p-3 rounded-lg border shadow-lg">
          <h4 className="text-sm font-semibold mb-2">Activity Types</h4>
          <div className="space-y-1">
            {Object.entries(CATEGORY_ICONS).slice(0, -1).map(([category, icon]) => (
              <div key={category} className="flex items-center gap-2 text-xs">
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center text-xs"
                  style={{
                    backgroundColor: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS],
                    color: "white"
                  }}
                >
                  {icon}
                </div>
                <span>{category}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}