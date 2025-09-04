"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign,
  Plane,
  Car,
  Hotel,
  Camera,
  UtensilsCrossed,
  Clock,
  Star,
  Edit3,
  Share2,
  Download,
  Send,
  ArrowRight,
  AlertTriangle,
  Info,
  Heart,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TripReviewProps {
  tripData: {
    from?: { name: string; };
    to?: { name: string; };
    startDate?: string;
    endDate?: string;
    travelers?: number;
    budget?: number;
    tripType?: string;
    transport?: any;
    rental?: any[];
    accommodation?: any[];
    activities?: any[];
    dining?: any[];
  };
  completedSteps: string[];
  onEdit: (step: string) => void;
  onSubmit: () => void;
  onExport?: () => void;
  onShare?: () => void;
  className?: string;
}

export function TripReview({ 
  tripData, 
  completedSteps, 
  onEdit, 
  onSubmit, 
  onExport, 
  onShare,
  className = "" 
}: TripReviewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateTripDuration = () => {
    if (!tripData.startDate || !tripData.endDate) return 'Not specified';
    const start = new Date(tripData.startDate);
    const end = new Date(tripData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
  };

  const estimateTotalCost = () => {
    let total = 0;
    
    // Transport cost estimation
    if (tripData.transport?.price) {
      const transportCost = typeof tripData.transport.price === 'string' 
        ? parseFloat(tripData.transport.price.replace(/[^\d.]/g, ''))
        : tripData.transport.price;
      total += transportCost * (tripData.travelers || 1);
    }

    // Accommodation cost estimation
    if (tripData.accommodation && tripData.accommodation.length > 0) {
      const duration = calculateTripDuration();
      const nights = parseInt(duration) - 1;
      tripData.accommodation.forEach(acc => {
        const avgCost = 3500; // Average cost per night
        total += avgCost * nights;
      });
    }

    // Activities cost estimation
    if (tripData.activities && tripData.activities.length > 0) {
      const avgActivityCost = 800; // Average cost per activity per person
      total += tripData.activities.length * avgActivityCost * (tripData.travelers || 1);
    }

    return total;
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'destination': return Globe;
      case 'transport': return Plane;
      case 'rental': return Car;
      case 'accommodation': return Hotel;
      case 'activities': return Camera;
      case 'dining': return UtensilsCrossed;
      default: return CheckCircle;
    }
  };

  const getStepTitle = (step: string) => {
    const titles: Record<string, string> = {
      'destination': 'Destination & Dates',
      'transport': 'Transportation',
      'rental': 'Local Rides',
      'accommodation': 'Accommodation',
      'activities': 'Activities',
      'dining': 'Dining'
    };
    return titles[step] || step;
  };

  const getCompletionPercentage = () => {
    const totalSteps = 6;
    return Math.round((completedSteps.length / totalSteps) * 100);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      onSubmit();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-teal-500/10 text-teal-400 px-4 py-2 rounded-full text-sm font-medium mb-4 border border-teal-500/20"
        >
          <CheckCircle className="w-4 h-4" />
          Trip Review
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-bold text-navy-100 mb-2"
        >
          Review Your Perfect Trip
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-navy-300 max-w-2xl mx-auto"
        >
          Take a final look at your trip details before we create your personalized itinerary
        </motion.p>
      </div>

      {/* Trip Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {/* Destination Card */}
        <div className="bg-navy-900/20 backdrop-blur-sm rounded-2xl p-6 border border-navy-800/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <MapPin className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="font-semibold text-navy-100">Destination</h3>
          </div>
          <p className="text-2xl font-bold text-navy-100 mb-1">
            {tripData.from?.name} → {tripData.to?.name}
          </p>
          <p className="text-sm text-navy-400">
            {tripData.tripType} trip
          </p>
        </div>

        {/* Duration Card */}
        <div className="bg-navy-900/20 backdrop-blur-sm rounded-2xl p-6 border border-navy-800/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="font-semibold text-navy-100">Duration</h3>
          </div>
          <p className="text-2xl font-bold text-navy-100 mb-1">
            {calculateTripDuration()}
          </p>
          <p className="text-sm text-navy-400">
            {tripData.startDate && new Date(tripData.startDate).toLocaleDateString()} - {tripData.endDate && new Date(tripData.endDate).toLocaleDateString()}
          </p>
        </div>

        {/* Travelers Card */}
        <div className="bg-navy-900/20 backdrop-blur-sm rounded-2xl p-6 border border-navy-800/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Users className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="font-semibold text-navy-100">Travelers</h3>
          </div>
          <p className="text-2xl font-bold text-navy-100 mb-1">
            {tripData.travelers || 1}
          </p>
          <p className="text-sm text-navy-400">
            {tripData.travelers === 1 ? 'Solo traveler' : 'Group trip'}
          </p>
        </div>

        {/* Budget Card */}
        <div className="bg-navy-900/20 backdrop-blur-sm rounded-2xl p-6 border border-navy-800/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-yellow-400" />
            </div>
            <h3 className="font-semibold text-navy-100">Budget</h3>
          </div>
          <p className="text-2xl font-bold text-navy-100 mb-1">
            ₹{tripData.budget?.toLocaleString() || 'Not set'}
          </p>
          <p className="text-sm text-navy-400">
            Est. total: ₹{estimateTotalCost().toLocaleString()}
          </p>
        </div>
      </motion.div>

      {/* Progress Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-navy-900/20 backdrop-blur-sm rounded-2xl p-6 border border-navy-800/30"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-navy-100">Planning Progress</h3>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-teal-400">{getCompletionPercentage()}%</div>
            <div className="text-sm text-navy-400">Complete</div>
          </div>
        </div>

        <div className="w-full bg-navy-800/40 rounded-full h-3 mb-6">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${getCompletionPercentage()}%` }}
            transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
            className="bg-gradient-to-r from-teal-500 to-teal-400 h-3 rounded-full"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {['destination', 'transport', 'rental', 'accommodation', 'activities', 'dining'].map((step, index) => {
            const IconComponent = getStepIcon(step);
            const isCompleted = completedSteps.includes(step);
            
            return (
              <motion.div
                key={step}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + (index * 0.1) }}
                className={`relative p-4 rounded-xl border cursor-pointer transition-all ${
                  isCompleted
                    ? 'bg-teal-900/30 border-teal-500/50 text-teal-300'
                    : 'bg-navy-800/30 border-navy-700/30 text-navy-400'
                }`}
                onClick={() => onEdit(step)}
              >
                <div className="text-center">
                  <IconComponent className={`w-6 h-6 mx-auto mb-2 ${
                    isCompleted ? 'text-teal-400' : 'text-navy-500'
                  }`} />
                  <div className="text-xs font-medium">{getStepTitle(step)}</div>
                  {isCompleted && (
                    <CheckCircle className="w-4 h-4 text-teal-400 absolute -top-1 -right-1" />
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(step);
                  }}
                  className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity"
                >
                  <Edit3 className="w-3 h-3 text-navy-400 hover:text-navy-300" />
                </button>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Detailed Selections */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="space-y-6"
      >
        {/* Transport Selection */}
        {tripData.transport && (
          <div className="bg-navy-900/20 backdrop-blur-sm rounded-2xl p-6 border border-navy-800/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-navy-100 flex items-center gap-2">
                <Plane className="w-5 h-5 text-blue-400" />
                Transportation
              </h3>
              <Button variant="outline" size="sm" onClick={() => onEdit('transport')}>
                <Edit3 className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between bg-navy-800/20 rounded-lg p-4">
              <div>
                <div className="font-medium text-navy-100">
                  {tripData.transport.airline || tripData.transport.carrier || 'Selected Transport'}
                </div>
                <div className="text-sm text-navy-400">
                  {tripData.transport.departure} - {tripData.transport.arrival}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-navy-100">{tripData.transport.price}</div>
                <div className="text-sm text-navy-400">per person</div>
              </div>
            </div>
          </div>
        )}

        {/* Accommodation Selections */}
        {tripData.accommodation && tripData.accommodation.length > 0 && (
          <div className="bg-navy-900/20 backdrop-blur-sm rounded-2xl p-6 border border-navy-800/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-navy-100 flex items-center gap-2">
                <Hotel className="w-5 h-5 text-purple-400" />
                Accommodation ({tripData.accommodation.length})
              </h3>
              <Button variant="outline" size="sm" onClick={() => onEdit('accommodation')}>
                <Edit3 className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-3">
              {tripData.accommodation.map((acc, index) => (
                <div key={index} className="bg-navy-800/20 rounded-lg p-4">
                  <div className="font-medium text-navy-100">{acc.title}</div>
                  <div className="text-sm text-navy-400">{acc.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activities Selections */}
        {tripData.activities && tripData.activities.length > 0 && (
          <div className="bg-navy-900/20 backdrop-blur-sm rounded-2xl p-6 border border-navy-800/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-navy-100 flex items-center gap-2">
                <Camera className="w-5 h-5 text-green-400" />
                Activities ({tripData.activities.length})
              </h3>
              <Button variant="outline" size="sm" onClick={() => onEdit('activities')}>
                <Edit3 className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tripData.activities.map((activity, index) => (
                <div key={index} className="bg-navy-800/20 rounded-lg p-4">
                  <div className="font-medium text-navy-100">{activity.title}</div>
                  <div className="text-sm text-navy-400">{activity.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dining Selections */}
        {tripData.dining && tripData.dining.length > 0 && (
          <div className="bg-navy-900/20 backdrop-blur-sm rounded-2xl p-6 border border-navy-800/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-navy-100 flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-orange-400" />
                Dining Preferences ({tripData.dining.length})
              </h3>
              <Button variant="outline" size="sm" onClick={() => onEdit('dining')}>
                <Edit3 className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tripData.dining.map((dining, index) => (
                <div key={index} className="bg-navy-800/20 rounded-lg p-4">
                  <div className="font-medium text-navy-100">{dining.title}</div>
                  <div className="text-sm text-navy-400">{dining.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Important Notes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-amber-900/20 backdrop-blur-sm rounded-2xl p-6 border border-amber-500/30"
      >
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-100 mb-2">Before You Proceed</h3>
            <ul className="text-sm text-amber-200 space-y-1">
              <li>• Review all selections carefully - changes after submission may incur additional costs</li>
              <li>• Estimated costs are approximate and may vary based on actual bookings</li>
              <li>• You&apos;ll receive a detailed itinerary with booking links after submission</li>
              <li>• Our travel experts will contact you within 24 hours to finalize arrangements</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        {onShare && (
          <Button variant="outline" onClick={onShare} className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Share Trip
          </Button>
        )}
        
        {onExport && (
          <Button variant="outline" onClick={onExport} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        )}
        
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || completedSteps.length < 2}
          size="lg"
          className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-semibold px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Clock className="w-5 h-5" />
              </motion.div>
              Creating Your Itinerary...
            </>
          ) : (
            <>
              <Heart className="w-5 h-5" />
              Create My Perfect Trip
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
}