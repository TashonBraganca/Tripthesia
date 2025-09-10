'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mountain, Building2, Landmark, Waves, Users, UtensilsCrossed, Shuffle } from 'lucide-react';
import { InteractiveCard } from '@/components/effects/InteractiveCard';
import { staggerContainer, staggerItem } from '@/lib/animations/variants';
import { trackTripTypeSelected } from '@/lib/analytics/events';

interface TripType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  preview: {
    day: string;
    activities: string[];
    vibe: string;
  };
}

interface TripTypeSelectorProps {
  value?: string;
  onChange: (typeId: string) => void;
  className?: string;
  showPreview?: boolean;
  required?: boolean;
  error?: string;
  onValidation?: (isValid: boolean) => void;
}

const tripTypes: TripType[] = [
  {
    id: 'adventure',
    name: 'Adventure & Trekking',
    description: 'Mountains, hiking, and outdoor exploration',
    icon: Mountain,
    color: 'emerald',
    preview: {
      day: 'Day 1',
      activities: ['Morning trek to viewpoint', 'Rock climbing session', 'Campfire dinner'],
      vibe: 'Adrenaline-filled outdoor adventure'
    }
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Professional travel with comfort focus',
    icon: Building2,
    color: 'slate',
    preview: {
      day: 'Day 1',
      activities: ['Airport lounge access', 'Business hotel check-in', 'Networking dinner'],
      vibe: 'Professional and efficient'
    }
  },
  {
    id: 'culture',
    name: 'Culture & History',
    description: 'Museums, heritage sites, and local traditions',
    icon: Landmark,
    color: 'amber',
    preview: {
      day: 'Day 1',
      activities: ['Historic city walk', 'Local museum visit', 'Traditional cuisine tasting'],
      vibe: 'Rich cultural immersion'
    }
  },
  {
    id: 'beach',
    name: 'Beach & Relaxation',
    description: 'Coastal getaways and peaceful retreats',
    icon: Waves,
    color: 'cyan',
    preview: {
      day: 'Day 1',
      activities: ['Beach sunrise walk', 'Spa treatment', 'Sunset cocktails'],
      vibe: 'Tranquil and rejuvenating'
    }
  },
  {
    id: 'family',
    name: 'Family',
    description: 'Kid-friendly activities and group fun',
    icon: Users,
    color: 'pink',
    preview: {
      day: 'Day 1',
      activities: ['Theme park visit', 'Family picnic', 'Interactive museum'],
      vibe: 'Fun for all ages'
    }
  },
  {
    id: 'foodie',
    name: 'Food & Wine',
    description: 'Culinary experiences and local flavors',
    icon: UtensilsCrossed,
    color: 'orange',
    preview: {
      day: 'Day 1',
      activities: ['Food market tour', 'Cooking class', 'Wine tasting dinner'],
      vibe: 'Gastronomic adventure'
    }
  },
  {
    id: 'mixed',
    name: 'Mixed',
    description: 'A bit of everything for variety',
    icon: Shuffle,
    color: 'purple',
    preview: {
      day: 'Day 1',
      activities: ['City exploration', 'Local experience', 'Flexible evening'],
      vibe: 'Diverse and adaptable'
    }
  }
];

export const TripTypeSelector: React.FC<TripTypeSelectorProps> = ({
  value = '',
  onChange,
  className = '',
  showPreview = true,
  required = false,
  error,
  onValidation
}) => {
  const [selectedType, setSelectedType] = useState(value);
  const [previewType, setPreviewType] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleTypeSelect = (typeId: string) => {
    if (typeId === selectedType) return;
    
    setIsAnimating(true);
    setSelectedType(typeId);
    onChange(typeId);
    
    // Validate selection if required
    if (onValidation) {
      onValidation(true); // Selection made, so it's valid
    }
    
    // Track analytics event
    trackTripTypeSelected(typeId, showPreview);
    
    // Delay preview update for smooth animation
    setTimeout(() => {
      setPreviewType(typeId);
      setIsAnimating(false);
    }, 150);
  };

  // Update selection when value prop changes
  React.useEffect(() => {
    if (value !== selectedType) {
      setSelectedType(value);
      setPreviewType(value || 'adventure');
    }
  }, [value, selectedType]);

  // Validate on mount and when required changes
  React.useEffect(() => {
    if (onValidation) {
      const isValid = !required || Boolean(selectedType);
      onValidation(isValid);
    }
  }, [required, selectedType, onValidation]);

  const selectedTripType = tripTypes.find(t => t.id === previewType) || tripTypes[0];

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <fieldset>
          <legend className="block text-sm font-medium text-navy-100 mb-3">
            Trip Type {required && <span className="text-teal-400">*</span>}
          </legend>
          
          {/* Error Message */}
          {error && (
            <div className="mb-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {tripTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            
            return (
              <motion.div
                key={type.id}
                variants={staggerItem}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  relative p-4 rounded-xl transition-all duration-300 cursor-pointer border
                  ${isSelected 
                    ? `bg-${type.color}-400/20 border-${type.color}-400 ring-2 ring-${type.color}-400/50` 
                    : error && required && !selectedType
                      ? 'bg-navy-800/50 border-red-400/50 hover:border-red-400'
                      : 'bg-navy-800/50 border-navy-600 hover:border-navy-500'
                  }
                  focus:outline-none focus:ring-2 focus:ring-teal-400/50
                `}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => handleTypeSelect(type.id)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTypeSelect(type.id);
                  }
                }}
              >
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className={`
                      p-3 rounded-lg transition-colors duration-300
                      ${isSelected 
                        ? `bg-${type.color}-400/30 text-${type.color}-300` 
                        : 'bg-navy-700 text-navy-400'
                      }
                    `}>
                      <Icon size={20} />
                    </div>
                    
                    <div>
                      <h3 className={`
                        font-medium text-sm transition-colors duration-300
                        ${isSelected ? 'text-navy-100' : 'text-navy-300'}
                      `}>
                        {type.name}
                      </h3>
                      <p className="text-xs text-navy-500 mt-1 line-clamp-2">
                        {type.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Selection indicator */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className={`
                          absolute -top-1 -right-1 w-6 h-6 rounded-full
                          bg-${type.color}-400 flex items-center justify-center
                        `}
                      >
                        <motion.div
                          initial={{ rotate: -90 }}
                          animate={{ rotate: 0 }}
                          transition={{ delay: 0.1 }}
                          className="text-navy-900 text-xs font-bold"
                        >
                          ✓
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
        </fieldset>
      </div>

    </div>
  );
};

export default TripTypeSelector;