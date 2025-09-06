"use client";

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  DollarSign, 
  FileText, 
  Link as LinkIcon, 
  Save, 
  X,
  Search,
  Loader
} from 'lucide-react';
import TimeSlotManager, { TimeSlot, TimeSlotConflict } from './TimeSlotManager';
import type { Activity } from './TimelineBuilder';

interface ActivityFormProps {
  activity?: Activity; // For editing existing activity
  date: string;
  existingTimeSlots?: TimeSlot[];
  onSave: (activity: Activity) => void;
  onCancel: () => void;
  isOpen: boolean;
}

interface LocationSuggestion {
  id: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  category?: string;
  rating?: number;
}

const ACTIVITY_CATEGORIES = [
  { value: 'sightseeing', label: 'Sightseeing', icon: '🏛️' },
  { value: 'dining', label: 'Dining', icon: '🍽️' },
  { value: 'transport', label: 'Transport', icon: '🚗' },
  { value: 'accommodation', label: 'Accommodation', icon: '🏨' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎭' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️' },
] as const;

// Mock location suggestions - in real app, this would be from Google Places API
const MOCK_LOCATIONS: LocationSuggestion[] = [
  {
    id: '1',
    name: 'Eiffel Tower',
    address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France',
    coordinates: { lat: 48.8584, lng: 2.2945 },
    category: 'sightseeing',
    rating: 4.6,
  },
  {
    id: '2',
    name: 'Louvre Museum',
    address: 'Rue de Rivoli, 75001 Paris, France',
    coordinates: { lat: 48.8606, lng: 2.3376 },
    category: 'sightseeing',
    rating: 4.7,
  },
  {
    id: '3',
    name: 'Le Comptoir du Relais',
    address: '9 Carrefour de l\'Odéon, 75006 Paris, France',
    coordinates: { lat: 48.8515, lng: 2.3388 },
    category: 'dining',
    rating: 4.2,
  },
];

export default function ActivityForm({
  activity,
  date,
  existingTimeSlots = [],
  onSave,
  onCancel,
  isOpen,
}: ActivityFormProps) {
  const [formData, setFormData] = useState<Partial<Activity>>(() => ({
    title: '',
    description: '',
    category: 'sightseeing',
    location: {
      name: '',
      address: '',
      coordinates: { lat: 0, lng: 0 },
    },
    timeSlot: {
      start: new Date(date + 'T09:00:00').toISOString(),
      end: new Date(date + 'T11:00:00').toISOString(),
      duration: 120,
    },
    budget: 0,
    bookingUrl: '',
    notes: '',
    ...activity,
  }));

  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [timeSlotConflicts, setTimeSlotConflicts] = useState<TimeSlotConflict[]>([]);
  const [isValid, setIsValid] = useState(false);

  // Mock location search - in real app, use Google Places API
  const searchLocations = useCallback(async (query: string) => {
    if (query.length < 2) {
      setLocationSuggestions([]);
      return;
    }

    setIsSearchingLocation(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const filtered = MOCK_LOCATIONS.filter(location =>
      location.name.toLowerCase().includes(query.toLowerCase()) ||
      location.address.toLowerCase().includes(query.toLowerCase())
    );
    
    setLocationSuggestions(filtered);
    setIsSearchingLocation(false);
  }, []);

  // Handle location search
  useEffect(() => {
    if (locationQuery) {
      searchLocations(locationQuery);
    } else {
      setLocationSuggestions([]);
    }
  }, [locationQuery, searchLocations]);

  // Validate form
  const validateForm = useCallback(() => {
    const hasTitle = Boolean(formData.title?.trim());
    const hasLocation = Boolean(formData.location?.name?.trim());
    const hasValidTimeSlot = Boolean(formData.timeSlot);
    const hasNoTimeConflicts = timeSlotConflicts.filter(c => c.severity === 'error').length === 0;
    
    const valid = hasTitle && hasLocation && hasValidTimeSlot && hasNoTimeConflicts;
    setIsValid(valid);
    return valid;
  }, [formData, timeSlotConflicts]);

  useEffect(() => {
    validateForm();
  }, [validateForm]);

  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleLocationSelect = useCallback((location: LocationSuggestion) => {
    setFormData(prev => ({
      ...prev,
      location: {
        name: location.name,
        address: location.address,
        coordinates: location.coordinates,
      },
    }));
    setLocationQuery(location.name);
    setShowLocationSuggestions(false);
  }, []);

  const handleTimeSlotChange = useCallback((timeSlot: TimeSlot) => {
    setFormData(prev => ({
      ...prev,
      timeSlot,
    }));
  }, []);

  const handleTimeSlotConflicts = useCallback((conflicts: TimeSlotConflict[]) => {
    setTimeSlotConflicts(conflicts);
  }, []);

  const handleSave = useCallback(() => {
    if (!validateForm()) return;

    const activityToSave: Activity = {
      id: activity?.id || `activity-${Date.now()}`,
      title: formData.title!,
      description: formData.description,
      category: formData.category as Activity['category'],
      location: formData.location!,
      timeSlot: formData.timeSlot!,
      budget: formData.budget || 0,
      bookingUrl: formData.bookingUrl,
      notes: formData.notes,
    };

    onSave(activityToSave);
  }, [formData, activity, validateForm, onSave]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {activity ? 'Edit Activity' : 'Add New Activity'}
            </h2>
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              
              {/* Title */}
              <div>
                <label htmlFor="activity-title-input" className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Title *
                </label>
                <input
                  id="activity-title-input"
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Visit Eiffel Tower"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="activity-category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ACTIVITY_CATEGORIES.map((category) => (
                    <motion.button
                      key={category.value}
                      type="button"
                      onClick={() => handleInputChange('category', category.value)}
                      className={`flex items-center space-x-2 p-3 rounded-lg border text-left transition-colors ${
                        formData.category === category.value
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-lg">{category.icon}</span>
                      <span className="text-sm font-medium">{category.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="activity-description-input" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="activity-description-input"
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Additional details about this activity..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Location</h3>
              
              <div className="relative">
                <label htmlFor="activity-location-input" className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <div className="relative">
                  <input
                    id="activity-location-input"
                    type="text"
                    value={locationQuery || formData.location?.name || ''}
                    onChange={(e) => {
                      setLocationQuery(e.target.value);
                      setShowLocationSuggestions(true);
                    }}
                    onFocus={() => setShowLocationSuggestions(true)}
                    placeholder="Search for a location..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {isSearchingLocation ? (
                      <Loader className="h-4 w-4 text-gray-400 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Location Suggestions */}
                {showLocationSuggestions && locationSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  >
                    {locationSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        onClick={() => handleLocationSelect(suggestion)}
                        className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-start space-x-3">
                          <MapPin className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-gray-900">{suggestion.name}</p>
                            <p className="text-sm text-gray-600">{suggestion.address}</p>
                            {suggestion.rating && (
                              <p className="text-xs text-yellow-600 mt-1">
                                ⭐ {suggestion.rating}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Selected Location Display */}
              {formData.location?.name && (
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-indigo-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">{formData.location.name}</p>
                      <p className="text-sm text-gray-600">{formData.location.address}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Time Slot */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Schedule</h3>
              
              <TimeSlotManager
                initialTimeSlot={formData.timeSlot!}
                date={date}
                existingTimeSlots={existingTimeSlots}
                onTimeSlotChange={handleTimeSlotChange}
                onConflictDetected={handleTimeSlotConflicts}
              />
            </div>

            {/* Additional Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Additional Details</h3>
              
              {/* Budget */}
              <div>
                <label htmlFor="activity-budget-input" className="block text-sm font-medium text-gray-700 mb-2">
                  Budget (optional)
                </label>
                <div className="relative">
                  <input
                    id="activity-budget-input"
                    type="number"
                    value={formData.budget || ''}
                    onChange={(e) => handleInputChange('budget', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Booking URL */}
              <div>
                <label htmlFor="activity-booking-url-input" className="block text-sm font-medium text-gray-700 mb-2">
                  Booking/Website URL (optional)
                </label>
                <div className="relative">
                  <input
                    id="activity-booking-url-input"
                    type="url"
                    value={formData.bookingUrl || ''}
                    onChange={(e) => handleInputChange('bookingUrl', e.target.value)}
                    placeholder="https://..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LinkIcon className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="activity-notes-input" className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <div className="relative">
                  <textarea
                    id="activity-notes-input"
                    value={formData.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Any additional notes or reminders..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <motion.button
              type="button"
              onClick={handleSave}
              disabled={!isValid}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isValid
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              whileHover={isValid ? { scale: 1.02 } : {}}
              whileTap={isValid ? { scale: 0.98 } : {}}
            >
              <Save className="h-4 w-4" />
              <span>{activity ? 'Update Activity' : 'Add Activity'}</span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}