import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

import "./globals.css";

import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import { CommandPalette } from "@/components/command-palette";
import { Navbar } from "@/components/navbar";

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
  ],
  authors: [
    {
      name: "Tripthesia Team",
    },
  ],
  creator: "Tripthesia",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "http://localhost:3000",
    title: "Tripthesia - AI Travel Planner",
    description:
      "Generate perfect travel itineraries in seconds with AI. Real prices, availability, and booking links.",
    siteName: "Tripthesia",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Tripthesia - AI Travel Planner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tripthesia - AI Travel Planner",
    description:
      "Generate perfect travel itineraries in seconds with AI. Real prices, availability, and booking links.",
    images: ["/og-image.png"],
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
    <ClerkProvider>
      <html
        lang="en"
        className={`${inter.variable} ${jetbrainsMono.variable}`}
        suppressHydrationWarning
      >
        <head>
          <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        </head>
        <body className="min-h-screen bg-background font-sans antialiased">
          <Providers>
            <div className="relative flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
            </div>
            <CommandPalette />
            <Toaster />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}