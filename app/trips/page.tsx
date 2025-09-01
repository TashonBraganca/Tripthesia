"use client";

import { useUser, useAuth, SignInButton } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MapPin, Calendar, Users, Plane, Globe, Star, ArrowRight } from 'lucide-react';
import { TopographicalGrid } from '@/components/backgrounds/TopographicalGrid';
import { GPSLoader } from '@/components/loading/GPSLoader';

const travelQuotes = [
  "Adventure awaits those who dare to explore 🌍",
  "Collect moments, not things ✈️",
  "Travel far, discover yourself 🗺️",
  "Life is short, make it epic 🌟",
  "The world is your playground 🎒"
];

export default function TripsPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Rotate travel quotes every 5 seconds
  useEffect(() => {
    if (!isSignedIn) return;
    
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % travelQuotes.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isSignedIn]);

  // Loading state
  if (!mounted || !isLoaded) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center relative overflow-hidden">
        <TopographicalGrid 
          density="light" 
          animation={true} 
          theme="dark"
          className="absolute inset-0"
        />
        <div className="relative z-10">
          <GPSLoader size="lg" message="Planning your adventures..." />
        </div>
      </div>
    );
  }

  // Not signed in
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center relative overflow-hidden">
        <TopographicalGrid 
          density="normal" 
          animation={true} 
          theme="dark"
          className="absolute inset-0"
        />
        <div className="relative z-10 text-center max-w-md mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl font-bold mb-4 text-navy-50">Access Your Trips</h1>
            <p className="text-navy-200 mb-8">Please sign in to access your trips and start planning amazing adventures!</p>
            
            <div className="space-y-4">
              <SignInButton mode="modal">
                <motion.button 
                  className="w-full bg-teal-500 hover:bg-teal-600 px-6 py-3 rounded-lg text-white font-medium transition-colors duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Sign In
                </motion.button>
              </SignInButton>
              
              <Link 
                href="/" 
                className="block text-teal-400 hover:text-teal-300 transition-colors duration-200"
              >
                Back to Homepage
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Signed in - show redesigned dashboard
  return (
    <div className="min-h-screen bg-navy-950 relative overflow-hidden">
      {/* Topographical Background */}
      <TopographicalGrid 
        density="light" 
        animation={true} 
        theme="dark"
        className="absolute inset-0"
      />
      
      {/* Header with animated greeting */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <motion.h1 
            className="text-4xl sm:text-5xl font-bold text-navy-50 mb-4"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Welcome back, <span className="text-teal-400">{user.firstName || 'Traveler'}</span>!
          </motion.h1>
          
          <AnimatePresence mode="wait">
            <motion.p
              key={currentQuote}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="text-lg text-navy-200 mb-6"
            >
              {travelQuotes[currentQuote]}
            </motion.p>
          </AnimatePresence>
          
          <div className="flex justify-center items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm text-navy-300">Signed in as</p>
              <p className="font-medium text-navy-100">{user.firstName || 'Traveler'}</p>
            </div>
            <motion.button
              onClick={() => signOut()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-navy-800/50 hover:bg-navy-700/50 backdrop-blur-sm px-4 py-2 rounded-lg text-sm text-navy-200 hover:text-navy-100 border border-navy-400/30 transition-all duration-200"
            >
              Sign Out
            </motion.button>
          </div>
        </motion.div>

        {/* Quick Actions - Interactive Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-semibold text-navy-50 mb-8 text-center">Quick Actions</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Create New Trip Card */}
            <motion.div
              whileHover={{ y: -5 }}
              className="group relative"
            >
              <Link href="/new">
                <div className="glass rounded-xl p-8 border border-teal-400/20 hover:border-teal-400/40 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-navy-800/50" />
                  <motion.div
                    className="absolute top-4 right-4"
                    animate={{ x: [-10, 10, -10] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Plane className="h-6 w-6 text-teal-400 opacity-60" />
                  </motion.div>
                  <div className="relative z-10">
                    <div className="flex items-center mb-4">
                      <motion.div
                        whileHover={{ rotate: 90 }}
                        className="p-3 bg-teal-500/20 rounded-lg"
                      >
                        <Plus className="h-8 w-8 text-teal-400" />
                      </motion.div>
                    </div>
                    <h3 className="text-xl font-semibold text-navy-50 mb-2">Create New Trip</h3>
                    <p className="text-navy-200 mb-4">Start planning your perfect adventure</p>
                    <motion.div 
                      className="flex items-center text-teal-400 group-hover:text-teal-300"
                      whileHover={{ x: 5 }}
                    >
                      <span className="text-sm font-medium">Get started</span>
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </motion.div>
                  </div>
                </div>
              </Link>
            </motion.div>
            
            {/* Browse Destinations Card */}
            <motion.div
              whileHover={{ y: -5 }}
              className="group relative"
            >
              <button className="w-full text-left">
                <div className="glass rounded-xl p-8 border border-sky-400/20 hover:border-sky-400/40 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-navy-800/50" />
                  <motion.div
                    className="absolute top-4 right-4"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <Globe className="h-6 w-6 text-sky-400 opacity-60" />
                  </motion.div>
                  <div className="relative z-10">
                    <div className="flex items-center mb-4">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="p-3 bg-sky-500/20 rounded-lg"
                      >
                        <MapPin className="h-8 w-8 text-sky-400" />
                      </motion.div>
                    </div>
                    <h3 className="text-xl font-semibold text-navy-50 mb-2">Browse Destinations</h3>
                    <p className="text-navy-200 mb-4">Discover amazing places worldwide</p>
                    <motion.div 
                      className="flex items-center text-sky-400 group-hover:text-sky-300"
                      whileHover={{ x: 5 }}
                    >
                      <span className="text-sm font-medium">Explore now</span>
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </motion.div>
                  </div>
                </div>
              </button>
            </motion.div>
            
            {/* Upgrade to Pro Card */}
            <motion.div
              whileHover={{ y: -5 }}
              className="group relative"
            >
              <Link href="/upgrade">
                <div className="glass rounded-xl p-8 border border-amber-400/20 hover:border-amber-400/40 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-navy-800/50" />
                  <motion.div
                    className="absolute top-4 right-4"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Star className="h-6 w-6 text-amber-400 opacity-60" />
                  </motion.div>
                  <div className="relative z-10">
                    <div className="flex items-center mb-4">
                      <motion.div
                        whileHover={{ rotate: [-5, 5, -5, 0] }}
                        className="p-3 bg-amber-500/20 rounded-lg"
                      >
                        <Users className="h-8 w-8 text-amber-400" />
                      </motion.div>
                    </div>
                    <h3 className="text-xl font-semibold text-navy-50 mb-2">Upgrade to Pro</h3>
                    <p className="text-navy-200 mb-4">Unlock premium features</p>
                    <motion.div 
                      className="flex items-center text-amber-400 group-hover:text-amber-300"
                      whileHover={{ x: 5 }}
                    >
                      <span className="text-sm font-medium">Learn more</span>
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </motion.div>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Trip Statistics - Animated */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="glass rounded-xl p-6 border border-navy-400/20"
          >
            <div className="flex items-center">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                className="p-3 bg-teal-500/20 rounded-lg"
              >
                <Calendar className="h-8 w-8 text-teal-400" />
              </motion.div>
              <div className="ml-4">
                <motion.h4 
                  className="text-3xl font-bold text-navy-50"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  0
                </motion.h4>
                <p className="text-sm text-navy-300">Trips Planned</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="glass rounded-xl p-6 border border-navy-400/20"
          >
            <div className="flex items-center">
              <motion.div
                animate={{ y: [-2, 2, -2] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="p-3 bg-sky-500/20 rounded-lg"
              >
                <MapPin className="h-8 w-8 text-sky-400" />
              </motion.div>
              <div className="ml-4">
                <motion.h4 
                  className="text-3xl font-bold text-navy-50"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 1.0 }}
                >
                  200+
                </motion.h4>
                <p className="text-sm text-navy-300">Countries Available</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="glass rounded-xl p-6 border border-navy-400/20"
          >
            <div className="flex items-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                className="p-3 bg-amber-500/20 rounded-lg"
              >
                <Users className="h-8 w-8 text-amber-400" />
              </motion.div>
              <div className="ml-4">
                <motion.h4 
                  className="text-3xl font-bold text-navy-50"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 1.2 }}
                >
                  Free
                </motion.h4>
                <p className="text-sm text-navy-300">Current Plan</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Empty State - Engaging Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="glass rounded-2xl p-12 text-center border border-navy-400/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-sky-500/5" />
            
            <motion.div
              className="relative z-10"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.0 }}
            >
              {/* Animated floating icons */}
              <div className="relative mb-8">
                <motion.div
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-block"
                >
                  <MapPin className="h-20 w-20 text-teal-400 mx-auto opacity-80" />
                </motion.div>
                
                {/* Floating mini icons */}
                <motion.div
                  className="absolute -top-2 -left-8"
                  animate={{ x: [0, 10, 0], y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                >
                  <Plane className="h-6 w-6 text-sky-400 opacity-60" />
                </motion.div>
                
                <motion.div
                  className="absolute -top-2 -right-8"
                  animate={{ x: [0, -8, 0], y: [0, -8, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, delay: 1 }}
                >
                  <Globe className="h-6 w-6 text-teal-300 opacity-60" />
                </motion.div>
              </div>

              <h3 className="text-2xl font-bold text-navy-50 mb-4">Your Adventure Awaits</h3>
              <p className="text-navy-200 mb-8 max-w-md mx-auto leading-relaxed">
                Ready to explore the world? Create your first trip and discover amazing destinations tailored just for you.
              </p>
              
              <motion.div
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href="/new"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200"
                >
                  <motion.div
                    whileHover={{ rotate: 90 }}
                    className="mr-3"
                  >
                    <Plus className="h-5 w-5" />
                  </motion.div>
                  Create Your First Trip
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}