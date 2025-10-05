/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/inventory',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
