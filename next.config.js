/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Enable automatic image optimization
    formats: ['image/avif', 'image/webp'],
    // Quality setting (1-100, default is 75)
    // Higher quality = larger file size
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Enable remote images if needed in the future
    remotePatterns: [],
  },
}

module.exports = nextConfig





