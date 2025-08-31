'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mountain, Building2, Landmark, Waves, Users, UtensilsCrossed, Shuffle } from 'lucide-react';
import { InteractiveCard } from '@/components/effects/InteractiveCard';
import { staggerContainer, staggerItem } from '@/lib/animations/variants';

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
  value = 'adventure',
  onChange,
  className = '',
  showPreview = true
}) => {
  const [selectedType, setSelectedType] = useState(value);
  const [previewType, setPreviewType] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleTypeSelect = (typeId: string) => {
    if (typeId === selectedType) return;
    
    setIsAnimating(true);
    setSelectedType(typeId);
    onChange(typeId);
    
    // Delay preview update for smooth animation
    setTimeout(() => {
      setPreviewType(typeId);
      setIsAnimating(false);
    }, 150);
  };

  const selectedTripType = tripTypes.find(t => t.id === previewType) || tripTypes[0];

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-navy-100 mb-3">
          Trip Type <span className="text-teal-400">*</span>
        </label>
        
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
              >
                <InteractiveCard
                  variant="glass"
                  particles={false}
                  onClick={() => handleTypeSelect(type.id)}
                  className={`
                    relative p-4 rounded-xl transition-all duration-300 cursor-pointer
                    ${isSelected 
                      ? `bg-${type.color}-400/20 border-${type.color}-400 ring-2 ring-${type.color}-400/50` 
                      : 'bg-navy-800/50 border-navy-600 hover:border-navy-500'
                    }
                  `}
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
                </InteractiveCard>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Live Preview Card */}
      {showPreview && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h4 className="text-sm font-medium text-navy-100 mb-3">Preview</h4>
          
          <InteractiveCard
            variant="glass"
            particles={false}
            className="p-5 bg-navy-800/60 border-navy-600"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedTripType.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: isAnimating ? 0.5 : 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center space-x-3">
                  <div className={`
                    p-2 rounded-lg bg-${selectedTripType.color}-400/20
                  `}>
                    <selectedTripType.icon 
                      size={16} 
                      className={`text-${selectedTripType.color}-400`} 
                    />
                  </div>
                  <div>
                    <h5 className="font-semibold text-navy-100">{selectedTripType.preview.day}</h5>
                    <p className={`text-sm text-${selectedTripType.color}-400`}>
                      {selectedTripType.preview.vibe}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {selectedTripType.preview.activities.map((activity, index) => (
                    <motion.div
                      key={activity}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-2 text-sm text-navy-300"
                    >
                      <div className={`w-2 h-2 rounded-full bg-${selectedTripType.color}-400/60`} />
                      <span>{activity}</span>
                    </motion.div>
                  ))}
                </div>
                
                {isAnimating && (
                  <div className="flex items-center justify-center py-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className={`w-4 h-4 border-2 border-${selectedTripType.color}-400/30 border-t-${selectedTripType.color}-400 rounded-full`}
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </InteractiveCard>
        </motion.div>
      )}
    </div>
  );
};

export default TripTypeSelector;