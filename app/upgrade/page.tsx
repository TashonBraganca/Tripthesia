"use client";

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { CheckIcon } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: { inr: '₹800', usd: '$10' },
    description: 'Perfect for frequent travelers who want more planning power.',
    features: [
      '10 trips per month',
      'Advanced AI planning',
      'Real-time pricing',
      'Interactive maps',
      'Priority support',
      'Export to PDF/Calendar',
    ],
    razorpayPlanId: 'plan_starter_monthly',
    popular: true,
  },
  {
    name: 'Pro',
    price: { inr: '₹2000', usd: '$20' },
    description: 'For travel agencies and power users who need premium features.',
    features: [
      '30 trips per month',
      'Premium AI features',
      'Collaboration tools',
      'Advanced analytics',
      'Custom branding',
      'Phone support',
      'API access',
      'White-label options',
    ],
    razorpayPlanId: 'plan_pro_monthly',
    popular: false,
  },
];

export default function UpgradePage() {
  const { isLoaded, isSignedIn, user } = useUser();

  const handleUpgrade = (planId: string, planName: string, price: string) => {
    if (!isSignedIn) {
      window.location.href = '/sign-up';
      return;
    }

    // For now, show alert - in production this would integrate with Razorpay
    alert(`Upgrade to ${planName} plan (${price}/month) - Coming soon! This will integrate with Razorpay payment gateway.`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">
            Upgrade Your Travel Planning
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Unlock premium features and plan unlimited trips with our advanced AI-powered platform.
          </p>
          
          {isLoaded && isSignedIn && (
            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg inline-block">
              <p className="text-blue-300">
                👋 Hey {user.firstName}! Ready to supercharge your travel planning?
              </p>
            </div>
          )}
        </div>

        {/* Current Plan Status */}
        {isLoaded && isSignedIn && (
          <div className="mb-12 text-center">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold mb-2">Current Plan</h3>
              <p className="text-2xl font-bold text-green-400 mb-2">Free</p>
              <p className="text-gray-400">2 trips per month</p>
              <div className="mt-4 bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full w-1/4"></div>
              </div>
              <p className="text-sm text-gray-400 mt-2">0 of 2 trips used this month</p>
            </div>
          </div>
        )}

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 ${
                plan.popular
                  ? 'bg-gradient-to-br from-blue-900/50 to-purple-900/50 border-2 border-blue-500'
                  : 'bg-gray-800 border border-gray-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">{plan.price.inr}</span>
                  <span className="text-gray-400 ml-2">/ month</span>
                  <p className="text-sm text-gray-400 mt-1">
                    or {plan.price.usd} USD
                  </p>
                </div>
                <p className="text-gray-300">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.razorpayPlanId, plan.name, plan.price.inr)}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                  plan.popular
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                {isSignedIn ? `Upgrade to ${plan.name}` : `Sign Up for ${plan.name}`}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-300">
                Yes! You can cancel your subscription at any time. You&apos;ll continue to have access to premium features until the end of your billing period.
              </p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-300">
                We accept all major credit cards, debit cards, UPI, and digital wallets through Razorpay for secure payments.
              </p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Do you offer refunds?</h3>
              <p className="text-gray-300">
                We offer a 7-day money-back guarantee. If you&apos;re not satisfied with your upgrade, contact us for a full refund.
              </p>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link
            href="/"
            className="inline-flex items-center text-blue-400 hover:text-blue-300"
          >
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}