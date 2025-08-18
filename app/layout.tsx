import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/toaster";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
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
        className={`${inter.variable} ${jetbrainsMono.variable}`}
        suppressHydrationWarning
      >
        <head>
          <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
          <script dangerouslySetInnerHTML={{
            __html: `
              // Suppress Clerk warnings in production
              if (typeof window !== 'undefined') {
                const originalWarn = console.warn;
                console.warn = function(...args) {
                  const message = args[0] && typeof args[0] === 'string' ? args[0] : '';
                  if (message.includes('Clerk has been loaded with development keys') ||
                      message.includes('afterSignInUrl') ||
                      message.includes('afterSignUpUrl') ||
                      message.includes('deprecated')) {
                    return;
                  }
                  originalWarn.apply(console, args);
                };
              }
            `
          }} />
        </head>
        <body className="min-h-screen bg-background font-sans antialiased">
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              <div className="relative flex min-h-screen flex-col">
                {children}
              </div>
              <Toaster />
            </QueryProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}