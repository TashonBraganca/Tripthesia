/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['postgres']
  },
  images: {
    domains: ['images.unsplash.com', 'foursquare.com']
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  transpilePackages: ['framer-motion']
}

module.exports = nextConfig