import { Metadata } from 'next';
import { Suspense } from 'react';
import { PricingComparison } from '@/components/subscription/pricing-card';
import { UpgradeBanner } from '@/components/subscription/upgrade-banner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, Check, Star, Users, Globe, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Upgrade to Pro',
  description: 'Unlock unlimited trips and advanced AI planning features with Tripthesia Pro.',
};

function UpgradeContent() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="text-center space-y-4 mb-12">
        <div className="flex items-center justify-center gap-2">
          <Crown className="h-8 w-8 text-yellow-500" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Upgrade to Pro
          </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Unlock unlimited trips, advanced AI planning, and premium features to create the perfect travel experiences.
        </p>
      </div>

      {/* Usage Banner */}
      <div className="mb-8">
        <UpgradeBanner />
      </div>

      {/* Pricing Cards */}
      <div className="mb-12">
        <PricingComparison />
      </div>

      {/* Feature Highlights */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <CardTitle className="text-lg">Unlimited Trips</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create as many trips as you want with no monthly limits. Perfect for frequent travelers and travel enthusiasts.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg">Advanced AI</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Access to our most sophisticated AI models for better recommendations and more detailed itineraries.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg">Real-time Pricing</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Get live pricing for flights, hotels, and activities with direct booking links for the best deals.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-lg">Collaborative Planning</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Share and collaborate on trips with friends and family. Everyone can contribute to the planning process.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              <CardTitle className="text-lg">Priority Support</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Get priority email support and access to exclusive features as they're released.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-500" />
              <CardTitle className="text-lg">Advanced Customization</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Fine-tune your trips with advanced preferences, budget controls, and personalization options.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Social Proof */}
      <Card className="mb-12">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold">Join Thousands of Happy Travelers</h2>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span>10,000+ trips planned</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span>4.9/5 rating</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <span>2,500+ Pro subscribers</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-1">Can I cancel anytime?</h3>
            <p className="text-sm text-muted-foreground">
              Yes, you can cancel your subscription at any time. You'll continue to have Pro access until the end of your billing period.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-1">What happens to my trips if I downgrade?</h3>
            <p className="text-sm text-muted-foreground">
              All your existing trips remain accessible. You'll just be limited to creating 3 new trips per month on the free plan.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-1">Do you offer refunds?</h3>
            <p className="text-sm text-muted-foreground">
              We offer a 30-day money-back guarantee if you're not satisfied with Pro features.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-1">Is my payment information secure?</h3>
            <p className="text-sm text-muted-foreground">
              Yes, all payments are processed securely through Razorpay. UPI payments are convenient and secure! We never store your payment information.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UpgradeContent />
    </Suspense>
  );
}