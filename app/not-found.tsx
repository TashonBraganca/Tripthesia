import Link from 'next/link';
import { MapPin, Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4">
      <div className="text-center max-w-2xl mx-auto">
        {/* 404 Animation */}
        <div className="mb-8">
          <div className="relative">
            <h1 className="text-9xl font-bold text-gray-800 mb-4">404</h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <MapPin className="h-16 w-16 text-blue-500 animate-bounce" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-4">Oops! This destination doesn&apos;t exist</h2>
          <p className="text-xl text-gray-300 mb-6">
            Looks like this page took a wrong turn. Let&apos;s get you back on track for your next adventure!
          </p>
          <p className="text-gray-400">
            The page you&apos;re looking for might have been moved, deleted, or doesn&apos;t exist.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Home className="h-5 w-5 mr-2" />
            Back to Homepage
          </Link>
          
          <Link
            href="/trips"
            className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            <Search className="h-5 w-5 mr-2" />
            View My Trips
          </Link>
        </div>

        {/* Popular Links */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Popular Destinations</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <Link href="/" className="text-blue-400 hover:text-blue-300 transition-colors">
              🏠 Homepage
            </Link>
            <Link href="/sign-in" className="text-blue-400 hover:text-blue-300 transition-colors">
              🔐 Sign In
            </Link>
            <Link href="/sign-up" className="text-blue-400 hover:text-blue-300 transition-colors">
              ✨ Sign Up
            </Link>
            <Link href="/upgrade" className="text-blue-400 hover:text-blue-300 transition-colors">
              ⭐ Upgrade
            </Link>
            <Link href="/test" className="text-blue-400 hover:text-blue-300 transition-colors">
              🧪 Test Page
            </Link>
            <Link href="/#pricing" className="text-blue-400 hover:text-blue-300 transition-colors">
              💰 Pricing
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-gray-500 text-sm">
          <p>Still lost? Contact our support team and we&apos;ll help you find your way!</p>
        </div>
      </div>
    </div>
  );
}