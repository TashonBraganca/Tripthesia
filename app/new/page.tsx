"use client";

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Create a super simple fallback component that will always work
function EmergencyFallback({ error }: { error?: string }) {
  return (
    <div 
      style={{ 
        minHeight: '100vh', 
        backgroundColor: '#030B14', 
        color: '#E6F0F8', 
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif'
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ backgroundColor: '#0A2540', padding: '2rem', borderRadius: '1rem', border: '1px solid #1B3B6F' }}>
          <div style={{ width: '4rem', height: '4rem', color: '#FF6B6B', margin: '0 auto 1rem', fontSize: '4rem', textAlign: 'center' }}>✗</div>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#E6F0F8' }}>
            Trip Planning Temporarily Unavailable
          </h1>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: '#B8C7D3' }}>
            We&apos;re experiencing technical difficulties loading the trip planner.
          </p>
          {error && (
            <div style={{ backgroundColor: '#FF6B6B20', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
              <p style={{ color: '#FF6B6B', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                Debug Info: {error}
              </p>
            </div>
          )}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a 
              href="/"
              style={{ 
                backgroundColor: '#15B37D', 
                color: '#030B14', 
                padding: '1rem 2rem', 
                borderRadius: '0.5rem', 
                textDecoration: 'none',
                fontWeight: 'bold',
                display: 'inline-block'
              }}
            >
              ← Back to Home
            </a>
            <button 
              onClick={() => window.location.reload()}
              style={{ 
                backgroundColor: '#1B3B6F', 
                color: '#E6F0F8', 
                padding: '1rem 2rem', 
                borderRadius: '0.5rem', 
                border: '1px solid #4268A3',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple status icons without external dependencies
function LoadingIcon() {
  return (
    <div 
      style={{ 
        width: '16px', 
        height: '16px', 
        border: '2px solid #22C692',
        borderTop: '2px solid transparent',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}
    />
  );
}

function SuccessIcon() {
  return (
    <div style={{ width: '16px', height: '16px', color: '#15B37D' }}>✓</div>
  );
}

function ErrorIcon() {
  return (
    <div style={{ width: '16px', height: '16px', color: '#FF6B6B' }}>✗</div>
  );
}

// Debug status component with safe icons
function DebugStatus({ status, children }: { status: 'loading' | 'success' | 'error'; children: React.ReactNode }) {
  const colors = {
    loading: '#22C692',
    success: '#15B37D',
    error: '#FF6B6B'
  };

  const IconComponent = status === 'loading' ? LoadingIcon : status === 'success' ? SuccessIcon : ErrorIcon;

  return (
    <div className="flex items-center space-x-2 text-sm" style={{ color: colors[status] }}>
      <IconComponent />
      <span>{children}</span>
    </div>
  );
}

// Robust error boundary
class TripPlannerErrorBoundary extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('TripPlanner Error:', error, errorInfo);
  }

  render() {
    if ((this.state as any).hasError) {
      return <EmergencyFallback error={(this.state as any).error} />;
    }

    return (this.props as any).children;
  }
}

// Core interfaces
interface TripData {
  from: any | null;
  to: any | null;
  startDate: string;
  endDate: string;
  travelers: number;
  tripType: string;
}

// Minimal form components
function SimpleLocationInput({ 
  label, 
  value, 
  onChange, 
  placeholder 
}: { 
  label: string; 
  value: string; 
  onChange: (value: string) => void; 
  placeholder: string; 
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium" style={{ color: '#B8C7D3' }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-3 rounded-lg border"
        style={{
          backgroundColor: '#0A2540',
          borderColor: '#1B3B6F',
          color: '#E6F0F8'
        }}
      />
    </div>
  );
}

function SimpleDateInput({ 
  label, 
  value, 
  onChange 
}: { 
  label: string; 
  value: string; 
  onChange: (value: string) => void; 
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium" style={{ color: '#B8C7D3' }}>
        {label}
      </label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 rounded-lg border"
        style={{
          backgroundColor: '#0A2540',
          borderColor: '#1B3B6F',
          color: '#E6F0F8'
        }}
      />
    </div>
  );
}

function SimpleTripTypeSelector({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (value: string) => void; 
}) {
  const tripTypes = [
    { id: 'leisure', name: 'Leisure & Vacation' },
    { id: 'business', name: 'Business Travel' },
    { id: 'adventure', name: 'Adventure & Outdoors' },
    { id: 'family', name: 'Family Trip' },
    { id: 'romantic', name: 'Romantic Getaway' }
  ];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium" style={{ color: '#B8C7D3' }}>
        Trip Type
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 rounded-lg border"
        style={{
          backgroundColor: '#0A2540',
          borderColor: '#1B3B6F',
          color: '#E6F0F8'
        }}
      >
        <option value="">Select trip type...</option>
        {tripTypes.map((type) => (
          <option key={type.id} value={type.id}>
            {type.name}
          </option>
        ))}
      </select>
    </div>
  );
}

// Main trip planning form component
function TripPlanningForm() {
  const [tripData, setTripData] = useState<TripData>({
    from: null,
    to: null,
    startDate: '',
    endDate: '',
    travelers: 1,
    tripType: ''
  });

  const [formValues, setFormValues] = useState({
    fromText: '',
    toText: '',
    startDate: '',
    endDate: '',
    tripType: ''
  });

  const handleSubmit = () => {
    const filledFields = Object.values(formValues).filter(v => v !== '').length;
    alert(`Form submitted! ${filledFields} fields completed. This would normally proceed to the next step.`);
  };

  const isFormValid = formValues.fromText && formValues.toText && formValues.startDate && formValues.endDate && formValues.tripType;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 
          className="text-4xl font-bold mb-4"
          style={{ color: '#E6F0F8' }}
        >
          Plan Your Perfect Journey
        </h1>
        <p 
          className="text-xl"
          style={{ color: '#B8C7D3' }}
        >
          Tell us where you want to go and we&apos;ll create a personalized travel experience just for you
        </p>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SimpleLocationInput
          label="From"
          value={formValues.fromText}
          onChange={(value) => setFormValues({...formValues, fromText: value})}
          placeholder="Where are you starting from?"
        />
        
        <SimpleLocationInput
          label="To"
          value={formValues.toText}
          onChange={(value) => setFormValues({...formValues, toText: value})}
          placeholder="Where do you want to go?"
        />

        <SimpleDateInput
          label="Start Date"
          value={formValues.startDate}
          onChange={(value) => setFormValues({...formValues, startDate: value})}
        />

        <SimpleDateInput
          label="End Date"
          value={formValues.endDate}
          onChange={(value) => setFormValues({...formValues, endDate: value})}
        />
      </div>

      <SimpleTripTypeSelector
        value={formValues.tripType}
        onChange={(value) => setFormValues({...formValues, tripType: value})}
      />

      {/* Submit Button */}
      <div className="text-center">
        <button
          onClick={handleSubmit}
          disabled={!isFormValid}
          className="px-8 py-4 rounded-lg text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: isFormValid ? '#15B37D' : '#1B3B6F',
            color: isFormValid ? '#030B14' : '#B8C7D3'
          }}
        >
          {isFormValid ? 'Continue to Next Step' : 'Please fill all fields'}
        </button>
      </div>
    </div>
  );
}

// Dynamic authentication hook to avoid SSR issues
const useClientAuth = () => {
  const [authState, setAuthState] = useState<{
    isLoaded: boolean;
    isSignedIn: boolean;
    user: { id: string } | null;
    error: string | null;
  }>({
    isLoaded: false,
    isSignedIn: false,
    user: null,
    error: null
  });

  useEffect(() => {
    let mounted = true;

    const loadAuth = async () => {
      try {
        // Dynamically import and use Clerk hook only on client
        const { useUser } = await import('@clerk/nextjs');
        
        // This is a workaround - we'll check auth status manually
        const checkAuth = () => {
          try {
            // Check if we're signed in by looking for auth cookies/tokens
            const hasAuthCookies = document.cookie.includes('__session') || 
                                  document.cookie.includes('__clerk') ||
                                  localStorage.getItem('clerk-user');
            
            if (mounted) {
              setAuthState({
                isLoaded: true,
                isSignedIn: !!hasAuthCookies,
                user: hasAuthCookies ? { id: 'user' } : null,
                error: null
              });
            }
          } catch (error: any) {
            if (mounted) {
              setAuthState({
                isLoaded: true,
                isSignedIn: false,
                user: null,
                error: error?.message || 'Authentication error'
              });
            }
          }
        };

        // Add a small delay to ensure client-side rendering
        setTimeout(checkAuth, 100);
        
      } catch (error: any) {
        if (mounted) {
          setAuthState({
            isLoaded: true,
            isSignedIn: false,
            user: null,
            error: error?.message || 'Failed to load authentication'
          });
        }
      }
    };

    loadAuth();

    return () => {
      mounted = false;
    };
  }, []);

  return authState;
};

// Main component
export default function NewTripPage() {
  const { isLoaded, isSignedIn, user, error } = useClientAuth();
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Debug logging
  useEffect(() => {
    if (!isClient) return;
    
    const info = [
      `Page loaded at: ${new Date().toISOString()}`,
      `Auth isLoaded: ${isLoaded}`,
      `Auth isSignedIn: ${isSignedIn}`,
      `User ID: ${user?.id || 'None'}`,
      `Auth Error: ${error || 'None'}`,
      `Current URL: ${window.location.href}`,
      `User Agent: ${navigator.userAgent.slice(0, 100)}...`
    ];
    setDebugInfo(info);
    console.log('NewTripPage Debug Info:', info);
  }, [isLoaded, isSignedIn, user, error, isClient]);

  // Show loading until client-side hydration is complete
  if (!isClient) {
    return (
      <div 
        style={{ 
          minHeight: '100vh', 
          backgroundColor: '#030B14',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#E6F0F8',
          fontFamily: 'system-ui, sans-serif'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <LoadingIcon />
          <p style={{ marginTop: '1rem' }}>Loading...</p>
        </div>
      </div>
    );
  }

  try {
    return (
      <TripPlannerErrorBoundary>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div 
          className="min-h-screen"
          style={{ 
            backgroundColor: '#030B14',
            backgroundImage: 'linear-gradient(135deg, #030B14 0%, #061A2C 50%, #0A2540 100%)'
          }}
        >
          {/* Debug Toggle */}
          <div className="fixed top-4 right-4 z-50">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="px-3 py-1 text-xs rounded"
              style={{ backgroundColor: '#1B3B6F', color: '#B8C7D3' }}
            >
              Debug {showDebug ? '▼' : '▶'}
            </button>
          </div>

          {/* Debug Panel */}
          {showDebug && (
            <div 
              className="fixed top-12 right-4 p-4 rounded-lg max-w-sm text-xs z-40"
              style={{ backgroundColor: '#0A2540', border: '1px solid #1B3B6F', color: '#B8C7D3' }}
            >
              <h3 className="font-bold mb-2">Debug Info:</h3>
              {debugInfo.map((info, i) => (
                <div key={i} className="mb-1 font-mono text-xs">{info}</div>
              ))}
            </div>
          )}

          {/* Header */}
          <div className="px-6 py-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <Link 
                  href="/" 
                  className="flex items-center space-x-2 text-lg hover:opacity-80 transition-opacity"
                  style={{ color: '#22C692' }}
                >
                  <span>← Back to Home</span>
                </Link>
                <div className="text-sm" style={{ color: '#B8C7D3' }}>
                  New Trip Planner
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="px-6 pb-8">
            <div className="max-w-4xl mx-auto">
              <div 
                className="p-8 rounded-2xl"
                style={{ 
                  backgroundColor: 'rgba(10, 37, 64, 0.8)', 
                  border: '1px solid #1B3B6F',
                  backdropFilter: 'blur(10px)'
                }}
              >
                {/* Status Indicators */}
                <div className="mb-6 space-y-2">
                  <DebugStatus status={isLoaded ? 'success' : 'loading'}>
                    Authentication: {isLoaded ? 'Ready' : 'Loading...'}
                  </DebugStatus>
                  {isLoaded && (
                    <DebugStatus status={isSignedIn ? 'success' : 'error'}>
                      User Status: {isSignedIn ? 'Signed In' : 'Not Signed In'}
                    </DebugStatus>
                  )}
                </div>

                {/* Content based on auth state */}
                {!isLoaded ? (
                  <div className="text-center py-12">
                    <LoadingIcon />
                    <p style={{ color: '#B8C7D3', marginTop: '1rem' }}>Loading authentication...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <ErrorIcon />
                    <h2 className="text-xl font-bold mb-4" style={{ color: '#E6F0F8', marginTop: '1rem' }}>
                      Authentication Error
                    </h2>
                    <p className="mb-6" style={{ color: '#B8C7D3' }}>
                      Having trouble loading authentication. You can still use the planner.
                    </p>
                    <TripPlanningForm />
                  </div>
                ) : !isSignedIn ? (
                  <div className="text-center py-12">
                    <div style={{ width: '48px', height: '48px', margin: '0 auto 1rem', color: '#22C692', fontSize: '48px' }}>⚠</div>
                    <h2 className="text-2xl font-bold mb-4" style={{ color: '#E6F0F8' }}>
                      Sign In Recommended
                    </h2>
                    <p className="mb-6" style={{ color: '#B8C7D3' }}>
                      Sign in to save your trips, or continue as guest.
                    </p>
                    <div className="flex gap-4 justify-center flex-wrap mb-8">
                      <a
                        href="/sign-in"
                        className="px-6 py-3 rounded-lg font-semibold"
                        style={{ backgroundColor: '#15B37D', color: '#030B14' }}
                      >
                        Sign In
                      </a>
                      <a
                        href="/sign-up"
                        className="px-6 py-3 rounded-lg border font-semibold"
                        style={{ borderColor: '#1B3B6F', color: '#E6F0F8' }}
                      >
                        Create Account
                      </a>
                    </div>
                    <hr style={{ border: '1px solid #1B3B6F', margin: '2rem 0' }} />
                    <h3 style={{ color: '#B8C7D3', marginBottom: '1rem' }}>Or continue as guest:</h3>
                    <TripPlanningForm />
                  </div>
                ) : (
                  <Suspense 
                    fallback={
                      <div className="text-center py-12">
                        <LoadingIcon />
                        <p style={{ color: '#B8C7D3', marginTop: '1rem' }}>Loading trip planner...</p>
                      </div>
                    }
                  >
                    <TripPlanningForm />
                  </Suspense>
                )}
              </div>
            </div>
          </div>
        </div>
      </TripPlannerErrorBoundary>
    );
  } catch (error) {
    console.error('NewTripPage render error:', error);
    return <EmergencyFallback error={error instanceof Error ? error.message : 'Unknown error'} />;
  }
}