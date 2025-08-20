'use client';

import { Check, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/use-subscription';
import { GLOBAL_SUBSCRIPTION_TIERS, SubscriptionTier, formatAmount, getTierPrice } from '@/lib/payment-gateways';
import { cn } from '@/lib/utils';

interface PricingCardProps {
  tier: SubscriptionTier;
  featured?: boolean;
  className?: string;
}

export function PricingCard({ tier, featured = false, className }: PricingCardProps) {
  const { 
    tier: currentTier, 
    upgrade, 
    manageBilling, 
    isUpgrading, 
    isManagingBilling 
  } = useSubscription();
  
  const tierConfig = GLOBAL_SUBSCRIPTION_TIERS[tier];
  const isCurrentTier = currentTier === tier;
  const isFree = tier === 'free';
  const isPro = tier === 'pro';
  
  const handleAction = () => {
    if (isCurrentTier && isPro) {
      manageBilling();
    } else if (!isCurrentTier) {
      upgrade(tier);
    }
  };

  const getButtonText = () => {
    if (isCurrentTier && isPro) {
      return isManagingBilling ? 'Loading...' : 'Manage Billing';
    }
    if (isCurrentTier && isFree) {
      return 'Current Plan';
    }
    return isUpgrading ? 'Loading...' : 'Upgrade Now';
  };

  const isButtonDisabled = () => {
    if (isCurrentTier && isFree) return true;
    return isUpgrading || isManagingBilling;
  };

  return (
    <Card className={cn(
      "relative transition-all duration-200",
      featured && "border-primary shadow-lg scale-105",
      isCurrentTier && "ring-2 ring-primary ring-offset-2",
      className
    )}>
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
            Most Popular
          </Badge>
        </div>
      )}

      {isCurrentTier && (
        <div className="absolute -top-3 right-4">
          <Badge variant="secondary">
            Current Plan
          </Badge>
        </div>
      )}

      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2">
          {isPro && <Crown className="h-5 w-5 text-yellow-500" />}
          <CardTitle className="text-xl">{tierConfig.name}</CardTitle>
        </div>
        
        <div className="space-y-1">
          <div className="text-3xl font-bold">
            {isFree ? 'Free' : formatAmount(tierConfig.price, 'USD')}
            {!isFree && <span className="text-lg font-normal text-muted-foreground">/month</span>}
          </div>
          <CardDescription>
            {isFree 
              ? 'Perfect for getting started with AI trip planning'
              : tier === 'pro' 
                ? 'Everything you need for advanced travel planning'
                : 'Complete solution for teams and power users'
            }
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {tierConfig.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Usage limits display */}
        <div className="rounded-lg bg-muted/50 p-3 text-xs">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Monthly trips:</span>
              <span className="font-medium">
                {tierConfig.limits.tripsPerMonth === -1 ? 'Unlimited' : tierConfig.limits.tripsPerMonth}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Activities per day:</span>
              <span className="font-medium">{tierConfig.limits.activitiesPerDay}</span>
            </div>
            <div className="flex justify-between">
              <span>Days per trip:</span>
              <span className="font-medium">{tierConfig.limits.daysPerTrip}</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button 
          onClick={handleAction}
          disabled={isButtonDisabled()}
          className={cn(
            "w-full",
            isPro && !isCurrentTier && "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          )}
          variant={isCurrentTier && isFree ? "outline" : "default"}
        >
          {isPro && !isCurrentTier && <Zap className="mr-2 h-4 w-4" />}
          {getButtonText()}
        </Button>
      </CardFooter>
    </Card>
  );
}

// Pricing comparison component
export function PricingComparison({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-6 lg:grid-cols-2", className)}>
      <PricingCard tier="free" />
      <PricingCard tier="pro" featured />
    </div>
  );
}

// Compact pricing toggle for navigation
export function PricingToggle({ className }: { className?: string }) {
  const { tier, upgrade, isUpgrading, isPro } = useSubscription();

  if (isPro) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Crown className="h-4 w-4 text-yellow-500" />
        <span className="text-sm font-medium">Pro</span>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      onClick={() => upgrade('pro')}
      disabled={isUpgrading}
      className={cn("bg-gradient-to-r from-primary to-primary/80", className)}
    >
      {isUpgrading ? (
        'Loading...'
      ) : (
        <>
          <Zap className="mr-1 h-3 w-3" />
          Upgrade
        </>
      )}
    </Button>
  );
}