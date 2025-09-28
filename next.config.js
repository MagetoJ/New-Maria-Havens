/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has TypeScript errors.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Enable experimental features for better compatibility
    esmExternals: true,
    serverComponentsExternalPackages: [],
  },
  swcMinify: true,
  reactStrictMode: false, // Disable strict mode for better compatibility
  images: {
    domains: ['localhost'],
  },
  // Disable source maps in development for faster builds
  productionBrowserSourceMaps: false,
  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    // Ignore TypeScript errors during webpack compilation
    config.stats = 'errors-warnings'
    config.infrastructureLogging = { level: 'error' }
    
    return config
  },
}

module.exports = nextConfig