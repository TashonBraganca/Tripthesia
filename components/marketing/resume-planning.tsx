"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Clock, MapPin, Calendar, Users, Plane, ChevronRight, Trash2 } from 'lucide-react';
import { fadeInUp, staggerContainer } from '@/lib/motion-variants';

interface DraftTrip {
  id: string;
  currentStep: string;
  completedSteps: string[];
  formData: {
    from?: { name: string };
    to?: { name: string };
    startDate?: string;
    endDate?: string;
    travelers?: number;
    budget?: number;
  };
  lastModified: string;
  createdAt: string;
}

export function ResumePlanning() {
  const { user, isLoaded } = useUser();
  const [draftTrips, setDraftTrips] = useState<DraftTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      fetchDraftTrips();
    } else if (isLoaded) {
      setLoading(false);
    }
  }, [user, isLoaded]);

  const fetchDraftTrips = async () => {
    try {
      const response = await fetch('/api/trips/draft');
      if (response.ok) {
        const data = await response.json();
        setDraftTrips(data.draftTrips || []);
      }
    } catch (error) {
      console.error('Error fetching draft trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteDraftTrip = async (tripId: string) => {
    setDeletingId(tripId);
    try {
      const response = await fetch('/api/trips/draft', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tripId }),
      });
      
      if (response.ok) {
        setDraftTrips(prev => prev.filter(trip => trip.id !== tripId));
      } else {
        console.error('Failed to delete draft trip');
      }
    } catch (error) {
      console.error('Error deleting draft trip:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const formatStepName = (step: string) => {
    const stepNames: Record<string, string> = {
      'destination': 'Destination',
      'transport': 'Transport',
      'rental': 'Local Rides',
      'accommodation': 'Hotels',
      'activities': 'Activities',
      'dining': 'Dining'
    };
    return stepNames[step] || step;
  };

  const getProgressPercentage = (completedSteps: string[]) => {
    const totalSteps = 6;
    return Math.round((completedSteps.length / totalSteps) * 100);
  };

  if (!isLoaded || loading) {
    return (
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-navy-800/30 rounded-lg w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-navy-800/20 rounded w-96 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || draftTrips.length === 0) {
    return null; // Don't show section if no user or no drafts
  }

  return (
    <section className="py-16 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy-900/40 via-navy-800/20 to-teal-900/10"></div>
      <div className="absolute inset-0 backdrop-blur-3xl"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Section Header */}
          <motion.div className="text-center mb-12" variants={fadeInUp}>
            <div className="inline-flex items-center gap-2 bg-teal-500/10 text-teal-400 px-4 py-2 rounded-full text-sm font-medium mb-4 border border-teal-500/20">
              <Clock className="w-4 h-4" />
              Continue Your Journey
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-navy-100 mb-4">
              Resume Your Trip Planning
            </h2>
            <p className="text-navy-300 max-w-2xl mx-auto text-lg">
              Pick up where you left off with your saved trip drafts
            </p>
          </motion.div>

          {/* Draft Trips Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer}
          >
            {draftTrips.map((trip) => (
              <motion.div
                key={trip.id}
                variants={fadeInUp}
                className="group bg-navy-900/20 backdrop-blur-sm rounded-2xl border border-navy-800/30 hover:border-teal-500/30 transition-all duration-300 overflow-hidden hover:shadow-lg hover:shadow-teal-500/10"
              >
                <div className="p-6">
                  {/* Trip Destination */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      {trip.formData.from && trip.formData.to ? (
                        <h3 className="text-lg font-semibold text-navy-100 mb-1 group-hover:text-teal-200 transition-colors">
                          {trip.formData.from.name} → {trip.formData.to.name}
                        </h3>
                      ) : (
                        <h3 className="text-lg font-semibold text-navy-100 mb-1 group-hover:text-teal-200 transition-colors">
                          New Trip Draft
                        </h3>
                      )}
                      <div className="flex items-center text-sm text-navy-400">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(trip.lastModified).toLocaleDateString()}
                      </div>
                    </div>
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => deleteDraftTrip(trip.id)}
                      disabled={deletingId === trip.id}
                      className="opacity-0 group-hover:opacity-100 p-2 text-navy-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                      title="Delete draft"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Trip Details */}
                  <div className="space-y-2 mb-4">
                    {trip.formData.startDate && (
                      <div className="flex items-center text-sm text-navy-300">
                        <Calendar className="w-3 h-3 mr-2" />
                        {new Date(trip.formData.startDate).toLocaleDateString()}
                        {trip.formData.endDate && (
                          <span> - {new Date(trip.formData.endDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    )}
                    {trip.formData.travelers && (
                      <div className="flex items-center text-sm text-navy-300">
                        <Users className="w-3 h-3 mr-2" />
                        {trip.formData.travelers} {trip.formData.travelers === 1 ? 'traveler' : 'travelers'}
                      </div>
                    )}
                    {trip.formData.budget && (
                      <div className="flex items-center text-sm text-navy-300">
                        <span className="mr-2">₹</span>
                        Budget: ₹{trip.formData.budget.toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-navy-300">Progress</span>
                      <span className="text-teal-400 font-medium">
                        {getProgressPercentage(trip.completedSteps)}%
                      </span>
                    </div>
                    <div className="w-full bg-navy-800/40 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-teal-500 to-teal-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${getProgressPercentage(trip.completedSteps)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Current Step */}
                  <div className="mb-6">
                    <div className="text-xs text-navy-400 mb-1">Current Step:</div>
                    <div className="text-sm font-medium text-teal-300">
                      {formatStepName(trip.currentStep)}
                    </div>
                  </div>

                  {/* Continue Button */}
                  <Button
                    asChild
                    className="w-full bg-teal-600 hover:bg-teal-500 text-white font-medium group-hover:shadow-lg group-hover:shadow-teal-500/20 transition-all duration-300"
                  >
                    <Link href="/new" className="flex items-center justify-center">
                      Continue Planning
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Additional CTA */}
          <motion.div className="text-center mt-12" variants={fadeInUp}>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-teal-500/30 text-teal-300 hover:bg-teal-500/10 hover:border-teal-400/50"
            >
              <Link href="/new" className="flex items-center">
                <Plane className="w-4 h-4 mr-2" />
                Start New Trip
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}