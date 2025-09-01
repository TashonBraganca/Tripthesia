'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cloud, Sun, CloudRain, Thermometer, Wind, Eye, Umbrella, 
  MapPin, Clock, Plane, Car, AlertTriangle, Info, 
  Calendar, TrendingUp, DollarSign, Lightbulb, Star
} from 'lucide-react';
import { LocationData } from '@/lib/data/locations';
import { 
  WeatherData, 
  TravelInfo, 
  BestTimeToVisit, 
  getWeatherInfo, 
  getTravelInfo, 
  getBestTimeToVisit, 
  getSeasonalTips, 
  getEstimatedCosts 
} from '@/lib/services/tripEnhancements';

interface TripEnhancementsProps {
  from: LocationData | null;
  to: LocationData | null;
  travelDate?: string;
  travelers?: number;
  days?: number;
  className?: string;
}

// Weather Widget Component
const WeatherWidget: React.FC<{ location: LocationData; className?: string }> = ({ 
  location, 
  className = '' 
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWeatherInfo(location)
      .then(setWeather)
      .finally(() => setLoading(false));
  }, [location]);

  if (loading) {
    return (
      <div className={`bg-navy-800/60 backdrop-blur-md rounded-xl p-4 border border-navy-600/50 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-navy-600/50 rounded w-1/2"></div>
          <div className="h-8 bg-navy-600/50 rounded w-3/4"></div>
          <div className="flex space-x-4">
            <div className="h-4 bg-navy-600/50 rounded flex-1"></div>
            <div className="h-4 bg-navy-600/50 rounded flex-1"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'clear': return <Sun className="text-yellow-400" size={24} />;
      case 'clouds': return <Cloud className="text-gray-400" size={24} />;
      case 'rain': return <CloudRain className="text-blue-400" size={24} />;
      default: return <Sun className="text-yellow-400" size={24} />;
    }
  };

  return (
    <motion.div 
      className={`bg-navy-800/60 backdrop-blur-md rounded-xl p-4 border border-navy-600/50 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-navy-200">Current Weather</h3>
        {getWeatherIcon(weather.condition.main)}
      </div>
      
      <div className="space-y-3">
        <div>
          <div className="text-2xl font-bold text-navy-100">
            {weather.temperature.current}°{weather.temperature.unit}
          </div>
          <div className="text-sm text-navy-400">
            {weather.condition.description}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center space-x-2 text-navy-300">
            <Thermometer size={12} />
            <span>{weather.temperature.high}°/{weather.temperature.low}°</span>
          </div>
          <div className="flex items-center space-x-2 text-navy-300">
            <Wind size={12} />
            <span>{weather.windSpeed} km/h</span>
          </div>
          <div className="flex items-center space-x-2 text-navy-300">
            <Umbrella size={12} />
            <span>{weather.humidity}%</span>
          </div>
          <div className="flex items-center space-x-2 text-navy-300">
            <Eye size={12} />
            <span>{weather.visibility} km</span>
          </div>
        </div>
        
        {weather.forecast && weather.forecast.length > 0 && (
          <div className="mt-3 pt-3 border-t border-navy-600/50">
            <div className="text-xs text-navy-400 mb-2">7-day forecast</div>
            <div className="flex space-x-2 overflow-x-auto">
              {weather.forecast.slice(0, 5).map((day, index) => (
                <div key={day.date} className="flex-shrink-0 text-center">
                  <div className="text-xs text-navy-400">
                    {index === 0 ? 'Tomorrow' : new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                  </div>
                  <div className="text-xs text-navy-200 mt-1">
                    {day.high}°/{day.low}°
                  </div>
                  <div className="text-xs text-navy-400">
                    {day.precipitation > 0 && `${day.precipitation}mm`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Travel Info Widget Component
const TravelInfoWidget: React.FC<{ from: LocationData; to: LocationData; className?: string }> = ({ 
  from, 
  to, 
  className = '' 
}) => {
  const [travelInfo, setTravelInfo] = useState<TravelInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTravelInfo(from, to)
      .then(setTravelInfo)
      .finally(() => setLoading(false));
  }, [from, to]);

  if (loading) {
    return (
      <div className={`bg-navy-800/60 backdrop-blur-md rounded-xl p-4 border border-navy-600/50 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-navy-600/50 rounded w-1/2"></div>
          <div className="h-6 bg-navy-600/50 rounded w-3/4"></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-4 bg-navy-600/50 rounded"></div>
            <div className="h-4 bg-navy-600/50 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!travelInfo) return null;

  return (
    <motion.div 
      className={`bg-navy-800/60 backdrop-blur-md rounded-xl p-4 border border-navy-600/50 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-navy-200">Travel Info</h3>
        <MapPin className="text-teal-400" size={16} />
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-navy-300">Distance</span>
          <span className="text-sm font-semibold text-navy-100">{travelInfo.distance.text}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 bg-navy-700/50 rounded-lg">
            <Plane size={16} className="text-sky-400 mx-auto mb-1" />
            <div className="text-xs text-navy-400">Flight</div>
            <div className="text-sm font-semibold text-navy-100">{travelInfo.duration.flight.text}</div>
          </div>
          <div className="text-center p-2 bg-navy-700/50 rounded-lg">
            <Car size={16} className="text-green-400 mx-auto mb-1" />
            <div className="text-xs text-navy-400">Driving</div>
            <div className="text-sm font-semibold text-navy-100">{travelInfo.duration.driving.text}</div>
          </div>
        </div>
        
        <div className="space-y-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${travelInfo.route.type === 'international' ? 'bg-orange-400' : 'bg-green-400'}`}></div>
            <span className="text-navy-300">{travelInfo.route.type === 'international' ? 'International' : 'Domestic'} travel</span>
          </div>
          
          {travelInfo.route.visa_required && (
            <div className="flex items-center space-x-2 text-amber-400">
              <AlertTriangle size={12} />
              <span>Visa may be required</span>
            </div>
          )}
          
          {travelInfo.route.popular_route && (
            <div className="flex items-center space-x-2 text-teal-400">
              <Star size={12} />
              <span>Popular route - good flight options</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Best Time to Visit Widget
const BestTimeWidget: React.FC<{ location: LocationData; travelDate?: string; className?: string }> = ({ 
  location, 
  travelDate, 
  className = '' 
}) => {
  const [bestTime, setBestTime] = useState<BestTimeToVisit | null>(null);
  const [seasonalTips, setSeasonalTips] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getBestTimeToVisit(location),
      travelDate ? getSeasonalTips(location, travelDate) : Promise.resolve([])
    ]).then(([bestTimeData, tips]) => {
      setBestTime(bestTimeData);
      setSeasonalTips(tips);
    }).finally(() => setLoading(false));
  }, [location, travelDate]);

  if (loading) {
    return (
      <div className={`bg-navy-800/60 backdrop-blur-md rounded-xl p-4 border border-navy-600/50 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-navy-600/50 rounded w-1/2"></div>
          <div className="h-6 bg-navy-600/50 rounded w-full"></div>
          <div className="h-4 bg-navy-600/50 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!bestTime) return null;

  return (
    <motion.div 
      className={`bg-navy-800/60 backdrop-blur-md rounded-xl p-4 border border-navy-600/50 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-navy-200">Best Time to Visit</h3>
        <Calendar className="text-teal-400" size={16} />
      </div>
      
      <div className="space-y-3">
        <div>
          <div className="text-sm font-medium text-navy-100">
            {bestTime.overall_best.months.join(', ')}
          </div>
          <div className="text-xs text-navy-400 mt-1">
            {bestTime.overall_best.reason}
          </div>
        </div>
        
        {seasonalTips.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-teal-400">Travel Tips:</div>
            {seasonalTips.map((tip, index) => (
              <div key={index} className="flex items-start space-x-2">
                <Lightbulb size={12} className="text-teal-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-navy-300">{tip}</div>
              </div>
            ))}
          </div>
        )}
        
        {bestTime.current_period && (
          <div className={`p-2 rounded-lg ${bestTime.current_period.is_good_time ? 'bg-teal-400/10' : 'bg-amber-400/10'}`}>
            <div className="flex items-center space-x-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${bestTime.current_period.is_good_time ? 'bg-teal-400' : 'bg-amber-400'}`}></div>
              <span className="text-xs font-medium text-navy-200">Current Period</span>
            </div>
            <div className="text-xs text-navy-300">{bestTime.current_period.weather_summary}</div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Cost Estimate Widget
const CostEstimateWidget: React.FC<{ 
  from: LocationData; 
  to: LocationData; 
  travelers: number; 
  days: number; 
  className?: string; 
}> = ({ from, to, travelers, days, className = '' }) => {
  const [costs, setCosts] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const costData = getEstimatedCosts(from, to, travelers, days);
    setCosts(costData);
    setLoading(false);
  }, [from, to, travelers, days]);

  if (loading) {
    return (
      <div className={`bg-navy-800/60 backdrop-blur-md rounded-xl p-4 border border-navy-600/50 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-navy-600/50 rounded w-1/2"></div>
          <div className="h-8 bg-navy-600/50 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!costs) return null;

  return (
    <motion.div 
      className={`bg-navy-800/60 backdrop-blur-md rounded-xl p-4 border border-navy-600/50 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-navy-200">Estimated Costs</h3>
        <DollarSign className="text-teal-400" size={16} />
      </div>
      
      <div className="space-y-3">
        <div className="text-center">
          <div className="text-2xl font-bold text-navy-100">
            ${costs.total.toLocaleString()}
          </div>
          <div className="text-xs text-navy-400">
            ${costs.per_person.toLocaleString()} per person
          </div>
        </div>
        
        <div className="space-y-2">
          {Object.entries(costs.breakdown).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center text-xs">
              <span className="text-navy-300 capitalize">{key.replace('_', ' ')}</span>
              <span className="text-navy-100 font-medium">${(value as number).toLocaleString()}</span>
            </div>
          ))}
        </div>
        
        {costs.savings_tips && costs.savings_tips.length > 0 && (
          <div className="pt-2 border-t border-navy-600/50">
            <div className="text-xs font-medium text-teal-400 mb-2">💡 Money-saving tips:</div>
            <div className="space-y-1">
              {costs.savings_tips.slice(0, 2).map((tip: string, index: number) => (
                <div key={index} className="text-xs text-navy-300">• {tip}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Main Trip Enhancements Component
export const TripEnhancements: React.FC<TripEnhancementsProps> = ({
  from,
  to,
  travelDate,
  travelers = 1,
  days = 7,
  className = ''
}) => {
  if (!from || !to) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <Info className="text-navy-400 mx-auto mb-3" size={32} />
        <p className="text-navy-400">Select your departure and destination to see travel insights</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h2 className="text-lg font-semibold text-navy-100 mb-4">Travel Insights</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <WeatherWidget location={to} />
        <TravelInfoWidget from={from} to={to} />
        <BestTimeWidget location={to} travelDate={travelDate} />
        <CostEstimateWidget from={from} to={to} travelers={travelers} days={days} />
      </div>
    </div>
  );
};

export default TripEnhancements;