'use client';

import { useState } from 'react';
import { X, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useSubscription } from '@/hooks/use-subscription';
import { cn } from '@/lib/utils';

interface UpgradeBannerProps {
  className?: string;
  showProgress?: boolean;
  minimal?: boolean;
}

export function UpgradeBanner({ 
  className, 
  showProgress = true, 
  minimal = false 
}: UpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const { 
    tier, 
    tripsRemaining, 
    usagePercentage, 
    upgrade, 
    isUpgrading,
    isPro 
  } = useSubscription();

  // Don't show banner for Pro users or if dismissed
  if (isPro || dismissed) {
    return null;
  }

  // Show warning when approaching limit
  const shouldShow = tripsRemaining <= 1 || usagePercentage > 60;
  
  if (!shouldShow && !minimal) {
    return null;
  }

  const handleUpgrade = () => {
    upgrade('pro');
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  if (minimal) {
    return (
      <div className={cn("flex items-center gap-2 text-sm", className)}>
        <Crown className="h-4 w-4 text-yellow-500" />
        <span className="text-muted-foreground">
          {tripsRemaining} trips remaining
        </span>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleUpgrade}
          disabled={isUpgrading}
          className="h-6 px-2 text-xs"
        >
          {isUpgrading ? 'Loading...' : 'Upgrade'}
        </Button>
      </div>
    );
  }

  return (
    <Card className={cn(
      "relative border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20",
      className
    )}>
      <div className="p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="absolute right-2 top-2 h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss</span>
        </Button>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <Crown className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {tripsRemaining === 0 
                  ? 'Trip limit reached' 
                  : `${tripsRemaining} trip${tripsRemaining === 1 ? '' : 's'} remaining`
                }
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {tripsRemaining === 0 
                  ? 'Upgrade to Pro for unlimited trips and advanced features'
                  : 'Upgrade to Pro before you run out and unlock unlimited trips'
                }
              </p>
            </div>

            {showProgress && tripsRemaining > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Usage this month</span>
                  <span>{Math.round(usagePercentage)}%</span>
                </div>
                <Progress 
                  value={usagePercentage} 
                  className="h-2"
                  // Change color based on usage
                  style={{
                    '--progress-foreground': usagePercentage > 80 
                      ? 'hsl(var(--destructive))' 
                      : usagePercentage > 60 
                        ? 'hsl(var(--warning))' 
                        : 'hsl(var(--primary))'
                  } as React.CSSProperties}
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button 
                onClick={handleUpgrade}
                disabled={isUpgrading}
                size="sm"
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
              >
                {isUpgrading ? (
                  'Loading...'
                ) : (
                  <>
                    <Zap className="mr-1 h-3 w-3" />
                    Upgrade to Pro
                  </>
                )}
              </Button>
              
              <div className="text-xs text-gray-500">
                Just $9.99/month
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Usage quota component for inline display
export function UsageQuota({ className }: { className?: string }) {
  const { tripsRemaining, usagePercentage, isPro } = useSubscription();

  if (isPro) {
    return (
      <div className={cn("flex items-center gap-1 text-xs text-green-600", className)}>
        <Crown className="h-3 w-3" />
        <span>Pro • Unlimited</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1 text-xs", className)}>
      <div className={cn(
        "h-2 w-2 rounded-full",
        tripsRemaining === 0 ? "bg-red-500" :
        tripsRemaining === 1 ? "bg-yellow-500" :
        "bg-green-500"
      )} />
      <span className="text-muted-foreground">
        {tripsRemaining} trips remaining
      </span>
    </div>
  );
}