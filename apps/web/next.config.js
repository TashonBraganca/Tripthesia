/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000", 
        "tripthesia.com", 
        "www.tripthesia.com",
        "*.vercel.app"
      ],
    },
  },
  images: {
    domains: [
      "images.unsplash.com", 
      "plus.unsplash.com",
      "fastly.4sqi.net", 
      "foursquare.com",
      "ss3.4sqi.net",
      "maps.googleapis.com",
      "lh3.googleusercontent.com"
    ],
    minimumCacheTTL: 86400, // 24 hours
    formats: ['image/webp', 'image/avif'],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options", 
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel-analytics.com *.posthog.com *.clerk.accounts.dev",
              "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
              "img-src 'self' data: https:",
              "font-src 'self' fonts.gstatic.com",
              "connect-src 'self' *.vercel.app *.anthropic.com api.mapbox.com *.foursquare.com *.clerk.accounts.dev *.posthog.com",
              "frame-src 'self' js.stripe.com",
              "media-src 'self'",
            ].join("; "),
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, s-maxage=3600", // 5min client / 1hour CDN
          },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable", // 1 year
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/webhooks/:path*",
        destination: "/api/webhooks/:path*",
      },
    ];
  },
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Optimize bundle size
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    return config;
  },
  // Output standalone for better Docker builds if needed
  output: 'standalone',
};

module.exports = nextConfig;