import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/error-boundary/ErrorBoundary";
import { ErrorTrackingInit } from "@/components/monitoring/ErrorTrackingInit";
import { PerformanceMonitor } from "@/components/monitoring/PerformanceMonitor";

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

export const metadata: Metadata = {
  title: {
    default: "Tripthesia - AI Travel Planner",
    template: "%s | Tripthesia",
  },
  description:
    "Generate perfect travel itineraries in seconds with AI. Real prices, availability, and booking links for flights, hotels, and activities.",
  keywords: [
    "travel",
    "itinerary", 
    "ai",
    "travel planning",
    "vacation",
    "trip planner",
    "india",
    "international travel",
  ],
  authors: [{ name: "Tripthesia Team" }],
  creator: "Tripthesia",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    title: "Tripthesia - AI Travel Planner",
    description: "Generate perfect travel itineraries with AI. Real prices and booking links.",
    siteName: "Tripthesia",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tripthesia - AI Travel Planner",
    description: "Generate perfect travel itineraries with AI. Real prices and booking links.",
    creator: "@tripthesia",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:; frame-src 'self' https://checkout.razorpay.com;",
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      afterSignInUrl="/trips"
      afterSignUpUrl="/trips"
      signInFallbackRedirectUrl="/trips"
      signUpFallbackRedirectUrl="/trips"
    >
      <html
        lang="en"
        className={`${inter.variable} ${sourceSerif.variable} ${jetbrainsMono.variable}`}
        suppressHydrationWarning
      >
        <head>
          <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
        </head>
        <body className="min-h-screen bg-background font-sans antialiased">
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              <ErrorBoundary>
                <ErrorTrackingInit />
                <PerformanceMonitor />
                <div className="relative flex min-h-screen flex-col">
                  {children}
                </div>
              </ErrorBoundary>
              <Toaster />
            </QueryProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}