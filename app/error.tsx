"use client"

import { useEffect } from 'react';
import Link from 'next/link';
import { MapPin, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        <div className="bg-navy-800/60 backdrop-blur-md rounded-2xl border border-navy-600/50 p-8">
          {/* Icon */}
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-red-500/20 rounded-full">
              <MapPin className="w-8 h-8 text-red-400" />
            </div>
          </div>

          {/* Content */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-navy-50 mb-4">
              Oops! Something went wrong
            </h1>
            <p className="text-navy-300 mb-6">
              We encountered an unexpected error while loading the application. This might be a temporary issue.
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 text-left">
                <p className="text-red-400 text-sm font-mono">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-red-400/70 text-xs font-mono mt-2">
                    Digest: {error.digest}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-navy-900 font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
            
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-navy-700/50 hover:bg-navy-700 border border-navy-600 hover:border-navy-500 text-navy-200 font-medium rounded-lg transition-all duration-200"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </div>

          {/* Help Text */}
          <p className="text-navy-400 text-sm mt-6">
            If this problem persists, try refreshing the page or clearing your browser cache.
          </p>
        </div>
      </div>
    </div>
  );
}