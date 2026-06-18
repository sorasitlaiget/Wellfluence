/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com', // For dummy images
      },
      // Add other image hosts as needed for logos, profile pictures etc.
    ],
  },
};

module.exports = nextConfig;