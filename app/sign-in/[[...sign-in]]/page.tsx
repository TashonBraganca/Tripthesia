"use client"

import { SignIn } from '@clerk/nextjs';
import { TopographicalGrid } from '@/components/backgrounds/TopographicalGrid';
import { GPSLoader } from '@/components/loading/GPSLoader';
import { MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Suspense } from 'react';
import { useEffect, useState } from 'react';

export default function SignInPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Ensure component is ready for client-side rendering
    setIsLoaded(true);
  }, []);

  // Show loading state during hydration
  if (!isLoaded) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-navy-950 overflow-hidden">
        <div className="relative z-10 text-center bg-navy-800/60 backdrop-blur-md rounded-xl border border-navy-600/50 p-8">
          <div className="w-8 h-8 mx-auto mb-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
          <h1 className="text-2xl font-bold text-navy-100 mb-4">Loading Sign In</h1>
          <p className="text-navy-300">Preparing authentication...</p>
        </div>
      </div>
    );
  }

  try {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-navy-950 overflow-hidden">
        {/* Topographical Background */}
        <TopographicalGrid 
          density="normal" 
          animation={true} 
          parallax={false}
          theme="dark"
          className="absolute inset-0"
        />
        
        {/* Content */}
        <motion.div 
          className="relative z-10 w-full max-w-lg p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              className="flex items-center justify-center mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
            >
              <MapPin className="w-8 h-8 text-teal-400 mr-2" />
              <span className="text-2xl font-bold text-navy-50">Tripthesia</span>
            </motion.div>
            <motion.h1 
              className="text-3xl font-bold bg-gradient-to-r from-navy-50 via-teal-300 to-sky-300 bg-clip-text text-transparent mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Welcome Back
            </motion.h1>
            <motion.p 
              className="text-navy-300 text-base"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Sign in to continue your travel adventures
            </motion.p>
          </div>
          
          {/* Auth Form with Loading State */}
          <Suspense fallback={
            <div className="flex justify-center py-12">
              <GPSLoader 
                size="md" 
                message="Preparing your sign-in..."
                duration={2000}
              />
            </div>
          }>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <SignIn 
                appearance={{
                  elements: {
                    formButtonPrimary: 'bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-navy-900 font-medium text-sm normal-case transition-all duration-300',
                    card: 'bg-navy-800/60 backdrop-blur-md border border-navy-600/50 shadow-2xl rounded-xl',
                    headerTitle: 'text-xl font-semibold text-navy-100',
                    headerSubtitle: 'text-navy-400 text-sm',
                    socialButtonsIconButton: 'bg-navy-700/50 border-navy-600 hover:bg-navy-700 hover:border-navy-500 text-navy-200 transition-all duration-200',
                    formFieldInput: 'bg-navy-800/50 border-navy-600 text-navy-100 placeholder-navy-400 focus:border-teal-400 focus:ring-teal-400/20 rounded-lg transition-all duration-200',
                    formFieldLabel: 'text-navy-200 text-sm font-medium',
                    footerActionLink: 'text-teal-400 hover:text-teal-300 transition-colors duration-200',
                    dividerLine: 'bg-navy-600',
                    dividerText: 'text-navy-400',
                    formFieldInputShowPasswordButton: 'text-navy-400 hover:text-navy-300',
                    identityPreviewEditButton: 'text-teal-400 hover:text-teal-300',
                    formResendCodeLink: 'text-teal-400 hover:text-teal-300',
                    otpCodeFieldInput: 'bg-navy-800/50 border-navy-600 text-navy-100 focus:border-teal-400'
                  },
                  layout: {
                    logoImageUrl: undefined,
                    showOptionalFields: false
                  },
                  variables: {
                    colorPrimary: '#2dd4bf',
                    colorText: '#f1f5f9',
                    colorTextSecondary: '#94a3b8',
                    colorBackground: 'transparent',
                    colorInputText: '#f1f5f9',
                    colorInputBackground: 'rgba(30, 41, 59, 0.5)',
                    fontSize: '14px',
                    borderRadius: '0.75rem'
                  }
                }}
                fallbackRedirectUrl="/trips"
                forceRedirectUrl="/trips"
                signUpUrl="/sign-up"
                routing="path"
                path="/sign-in"
              />
            </motion.div>
          </Suspense>
          
          {/* Back Link */}
          <motion.div 
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Link href="/" className="inline-flex items-center text-teal-400 hover:text-teal-300 text-sm font-medium transition-colors duration-200">
              ← Back to Homepage
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  } catch (error) {
    console.error('Sign-in page error:', error);
    setError(error instanceof Error ? error.message : 'Authentication failed');
    
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-navy-950 overflow-hidden">
        <TopographicalGrid 
          density="normal" 
          animation={true} 
          parallax={false}
          theme="dark"
          className="absolute inset-0"
        />
        <div className="relative z-10 text-center bg-navy-800/60 backdrop-blur-md rounded-xl border border-navy-600/50 p-8 max-w-lg">
          <MapPin className="w-8 h-8 text-teal-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-navy-100 mb-4">Sign In</h1>
          <div className="text-red-400 mb-4">
            <p className="mb-2">Authentication service temporarily unavailable</p>
            <p className="text-sm opacity-75">Please try again in a moment</p>
          </div>
          <GPSLoader 
            size="md" 
            message="Retrying connection..."
            duration={3000}
            className="mb-6"
          />
          <Link href="/" className="text-teal-400 hover:text-teal-300 font-medium transition-colors duration-200">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }
}