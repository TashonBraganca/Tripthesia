"use client";

import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface NetworkStatusProps {
  className?: string;
  showOnlineStatus?: boolean;
}

export function NetworkStatus({ className, showOnlineStatus = false }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Show brief reconnected message if was offline
      if (wasOffline) {
        setTimeout(() => setWasOffline(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    // Listen for network status changes
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [wasOffline]);

  // Don't show anything if online and not configured to show online status
  if (isOnline && !showOnlineStatus && !wasOffline) {
    return null;
  }

  if (!isOnline) {
    return (
      <Alert className={cn("border-orange-200 bg-orange-50", className)}>
        <WifiOff className="h-4 w-4 text-orange-600" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex-grow">
            <span className="font-medium text-orange-800">You're offline</span>
            <p className="text-sm text-orange-700 mt-1">
              Some features may not work properly. Check your internet connection.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="ml-4 border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (wasOffline) {
    return (
      <Alert className={cn("border-green-200 bg-green-50", className)}>
        <Wifi className="h-4 w-4 text-green-600" />
        <AlertDescription>
          <span className="font-medium text-green-800">Back online!</span>
          <span className="text-sm text-green-700 ml-2">
            Your connection has been restored.
          </span>
        </AlertDescription>
      </Alert>
    );
  }

  if (showOnlineStatus) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-green-600", className)}>
        <Wifi className="h-4 w-4" />
        <span>Connected</span>
      </div>
    );
  }

  return null;
}

// Hook to get network status
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

// Offline fallback component
export function OfflineFallback({ 
  children, 
  message = "This feature requires an internet connection." 
}: {
  children: React.ReactNode;
  message?: string;
}) {
  const isOnline = useNetworkStatus();

  if (!isOnline) {
    return (
      <div className="p-8 text-center space-y-4">
        <WifiOff className="h-12 w-12 text-gray-400 mx-auto" />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-700">Offline</h3>
          <p className="text-sm text-gray-600">{message}</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}