'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Home, MapPin } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
// Simplified card components for offline page
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pb-0 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>{children}</h3>
);

const CardDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Check initial status
    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    
    try {
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.log('Still offline');
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            {isOnline ? (
              <Wifi className="h-8 w-8 text-green-600" />
            ) : (
              <WifiOff className="h-8 w-8 text-red-500" />
            )}
          </div>
          
          <CardTitle className="text-2xl font-bold">
            {isOnline ? 'Connection Restored!' : 'You\'re Offline'}
          </CardTitle>
          
          <CardDescription className="text-lg">
            {isOnline 
              ? 'Your internet connection has been restored. You can now access all features.'
              : 'Check your internet connection and try again. Some features may be limited offline.'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {isOnline ? (
            <div className="space-y-4">
              <Button 
                onClick={() => window.location.href = '/'} 
                className="w-full"
                size="lg"
              >
                <Home className="mr-2 h-5 w-5" />
                Return to Homepage
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Link href="/trips">
                  <Button variant="outline" className="w-full">
                    <MapPin className="mr-2 h-4 w-4" />
                    My Trips
                  </Button>
                </Link>
                
                <Link href="/new">
                  <Button variant="outline" className="w-full">
                    Plan Trip
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Button 
                onClick={handleRetry}
                disabled={isRetrying}
                className="w-full"
                size="lg"
                variant="outline"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    Checking Connection...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Try Again
                  </>
                )}
              </Button>

              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <p className="font-medium">What you can do offline:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>View previously loaded trips</li>
                  <li>Browse cached destinations</li>
                  <li>Access saved itineraries</li>
                  <li>View offline maps (if available)</li>
                </ul>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Limited Offline Features
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  While offline, you can still access previously loaded content and basic features. 
                  New searches and AI features require an internet connection.
                </p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>Network Status</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                <span>{isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}