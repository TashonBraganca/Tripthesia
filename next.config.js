const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['postgres']
  },
  images: {
    domains: ['images.unsplash.com', 'foursquare.com'],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  transpilePackages: ['framer-motion'],
  
  // Enhanced build optimization
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // Build output configuration
  // output: 'standalone', // Disabled due to Windows symlink permissions
  
  // Enhanced error handling during build
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  // Webpack configuration for better build stability and advanced code splitting
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Handle potential build issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }
    
    // Advanced bundle optimization for production
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 250000,
        cacheGroups: {
          // React framework chunk
          framework: {
            chunks: 'all',
            name: 'framework',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true,
          },
          // AI components chunk (heavy components)
          ai: {
            chunks: 'all',
            name: 'ai-components',
            test: /[\\/]components[\\/]ai[\\/]/,
            priority: 30,
            enforce: true,
          },
          // Planning components chunk
          planning: {
            chunks: 'all',
            name: 'planning-components', 
            test: /[\\/]components[\\/]planning[\\/]/,
            priority: 30,
            enforce: true,
          },
          // Forms chunk
          forms: {
            chunks: 'all',
            name: 'forms',
            test: /[\\/]components[\\/]forms[\\/]/,
            priority: 25,
            minChunks: 2,
          },
          // Third-party libraries
          lib: {
            chunks: 'all',
            name: 'lib',
            test: /[\\/]node_modules[\\/](?!(react|react-dom|scheduler|prop-types|use-subscription)[\\/])/,
            priority: 20,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          // Maps and location services
          maps: {
            chunks: 'all',
            name: 'maps-services',
            test: /[\\/]node_modules[\\/](@googlemaps|@google|mapbox|leaflet)[\\/]/,
            priority: 35,
            enforce: true,
          },
          // Animation libraries
          animations: {
            chunks: 'all', 
            name: 'animations',
            test: /[\\/]node_modules[\\/](framer-motion|@radix-ui|lucide-react)[\\/]/,
            priority: 25,
            minChunks: 2,
          },
          // Default group
          default: {
            chunks: 'all',
            name: 'common',
            priority: 10,
            minChunks: 2,
            reuseExistingChunk: true,
          }
        }
      }

      // Add module concatenation for better performance
      config.optimization.concatenateModules = true;
      
      // Tree shaking optimization
      config.optimization.usedExports = true;
      config.optimization.providedExports = true;
      config.optimization.sideEffects = false;
    }
    
    return config
  },
}

module.exports = withBundleAnalyzer(nextConfig)