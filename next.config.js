/** @type {import('next').NextConfig} */
const nextConfig = {
  // Monaco Editor requires these for web workers
  experimental: {
    esmExternals: 'loose',
  },
  // Suppress hydration warnings from dynamic Monaco content
  reactStrictMode: true,
}

module.exports = nextConfig
