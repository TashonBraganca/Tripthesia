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

// Helper function to get consistent selected styles for each color
const getSelectedStyles = (color: string): string => {
  const styleMap: Record<string, string> = {
    emerald: 'bg-emerald-400/20 border-emerald-400 ring-2 ring-emerald-400/50',
    blue: 'bg-blue-400/20 border-blue-400 ring-2 ring-blue-400/50',
    purple: 'bg-purple-400/20 border-purple-400 ring-2 ring-purple-400/50',
    cyan: 'bg-cyan-400/20 border-cyan-400 ring-2 ring-cyan-400/50',
    pink: 'bg-pink-400/20 border-pink-400 ring-2 ring-pink-400/50',
    amber: 'bg-amber-400/20 border-amber-400 ring-2 ring-amber-400/50',
    gray: 'bg-gray-400/20 border-gray-400 ring-2 ring-gray-400/50',
  };
  return styleMap[color] || 'bg-teal-400/20 border-teal-400 ring-2 ring-teal-400/50';
};

const getIconStyles = (color: string, isSelected: boolean): string => {
  if (isSelected) {
    const iconMap: Record<string, string> = {
      emerald: 'bg-emerald-400/30 text-emerald-300',
      blue: 'bg-blue-400/30 text-blue-300',
      purple: 'bg-purple-400/30 text-purple-300',
      cyan: 'bg-cyan-400/30 text-cyan-300',
      pink: 'bg-pink-400/30 text-pink-300',
      amber: 'bg-amber-400/30 text-amber-300',
      gray: 'bg-gray-400/30 text-gray-300',
    };
    return iconMap[color] || 'bg-teal-400/30 text-teal-300';
  }
  return 'bg-navy-700 text-navy-400';
};

const getTickMarkStyles = (color: string): string => {
  const tickMap: Record<string, string> = {
    emerald: 'bg-emerald-400',
    blue: 'bg-blue-400',
    purple: 'bg-purple-400',
    cyan: 'bg-cyan-400',
    pink: 'bg-pink-400',
    amber: 'bg-amber-400',
    gray: 'bg-gray-400',
  };
  return tickMap[color] || 'bg-teal-400';
};

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
  const [selectedType, setSelectedType] = useState<string | undefined>(value);
  const [previewType, setPreviewType] = useState(value || 'adventure');
  const [isAnimating, setIsAnimating] = useState(false);

  const handleTypeSelect = (typeId: string) => {
    console.log('Trip type selected:', typeId, 'current:', selectedType);
    
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
                    ? getSelectedStyles(type.color)
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
                      ${getIconStyles(type.color, isSelected)}
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
                          ${getTickMarkStyles(type.color)} flex items-center justify-center
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