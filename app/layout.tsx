import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/toaster";
import { ProductionErrorBoundary } from "@/components/error-boundary/ProductionErrorBoundary";
import { ErrorTrackingInit } from "@/components/monitoring/ErrorTrackingInit";
import { PerformanceMonitor } from "@/components/monitoring/PerformanceMonitor";
import { AccessibilityTester } from "@/components/accessibility/AccessibilityTester";
import { SkipLink } from "@/components/accessibility/SkipLink";
import { generateMetadata as generateSEOMetadata, generateStructuredData } from "@/lib/seo/meta-generator";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

// Enhanced SEO metadata - Phase 7 Production Excellence
export const metadata: Metadata = generateSEOMetadata({
  title: "Tripthesia - AI-Powered Travel Planning with Real Pricing",
  description: "Plan perfect trips with AI-powered recommendations, real-time pricing from multiple providers, and comprehensive booking integration. Compare flights, hotels, and activities in one place.",
  keywords: [
    "travel planning", "AI travel assistant", "flight booking", "hotel booking", 
    "trip planner", "travel comparison", "vacation planner", "booking platform",
    "real-time pricing", "multi-provider comparison", "travel AI", "smart travel"
  ],
  url: process.env.NEXT_PUBLIC_APP_URL || "https://tripthesia.vercel.app",
  type: "website"
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // iOS safe area support
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      afterSignInUrl="/trips"
      afterSignUpUrl="/trips"
      signInFallbackRedirectUrl="/trips"
      signUpFallbackRedirectUrl="/trips"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      appearance={{
        variables: {
          colorPrimary: '#15B37D',
          colorBackground: '#030B14',
          colorInputBackground: '#0A2540',
          colorInputText: '#E6F0F8',
          colorText: '#E6F0F8'
        }
      }}
      localization={{
        signIn: {
          start: {
            title: 'Welcome back to Tripthesia',
            subtitle: 'Sign in to continue planning your trips'
          }
        }
      }}
    >
      <html
        lang="en"
        className={`${inter.variable} ${sourceSerif.variable} ${jetbrainsMono.variable}`}
        suppressHydrationWarning
      >
        <head>
          <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
          
          {/* Structured Data - Phase 7 SEO Enhancement */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(generateStructuredData('organization'))
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(generateStructuredData('website'))
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(generateStructuredData('travel'))
            }}
          />
        </head>
        <body className="min-h-screen bg-background font-sans antialiased">
          <SkipLink targetId="main-content">Skip to main content</SkipLink>
          <SkipLink targetId="main-navigation">Skip to navigation</SkipLink>
          
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              <ProductionErrorBoundary showReportButton={true}>
                <ErrorTrackingInit />
                <PerformanceMonitor />
                <AccessibilityTester />
                
                <div className="relative flex min-h-screen flex-col">
                  <main id="main-content">
                    {children}
                  </main>
                </div>
              </ProductionErrorBoundary>
              <Toaster />
            </QueryProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}