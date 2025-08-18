"use client";

import { useUser, useAuth, SignInButton } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, MapPin, Calendar, Users } from 'lucide-react';

export default function TripsPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Loading state
  if (!mounted || !isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Not signed in
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Access Restricted</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">Please sign in to access your trips and start planning amazing adventures!</p>
          
          <div className="space-y-4">
            <SignInButton mode="modal">
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-lg text-white font-medium">
                Sign In
              </button>
            </SignInButton>
            
            <Link href="/" className="block text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
              Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Signed in - show clean trips dashboard
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Clean Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user.firstName || 'Traveler'}!
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Ready to plan your next adventure?</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-gray-500 dark:text-gray-400">Signed in as</p>
                <p className="font-medium text-gray-900 dark:text-white">{user.emailAddresses[0]?.emailAddress}</p>
              </div>
              <button
                onClick={() => signOut()}
                className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-4 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Quick Actions */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link
                href="/new"
                className="group bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 p-6 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors duration-200"
              >
                <div className="flex items-center">
                  <Plus className="h-8 w-8 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-200" />
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Trip</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Start planning with AI</p>
                  </div>
                </div>
              </Link>
              
              <button className="group bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 p-6 rounded-lg border border-green-200 dark:border-green-800 transition-colors duration-200">
                <div className="flex items-center">
                  <MapPin className="h-8 w-8 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform duration-200" />
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Browse Destinations</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Explore popular places</p>
                  </div>
                </div>
              </button>
              
              <Link
                href="/upgrade"
                className="group bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 p-6 rounded-lg border border-amber-200 dark:border-amber-800 transition-colors duration-200"
              >
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform duration-200" />
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upgrade to Pro</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Unlock more features</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Trip Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <Calendar className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
              <div className="ml-4">
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white">0</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Trips Planned</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <MapPin className="h-10 w-10 text-green-600 dark:text-green-400" />
              <div className="ml-4">
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white">200+</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Countries Available</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <Users className="h-10 w-10 text-amber-600 dark:text-amber-400" />
              <div className="ml-4">
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white">Free</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Current Plan</p>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm">
            <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No trips yet</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
              Create your first trip and let our AI help you plan the perfect adventure tailored to your preferences.
            </p>
            <Link
              href="/new"
              className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Trip
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}