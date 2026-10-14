/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = {
        type: 'memory',
      };
    }
    return config;
  },
};

export default nextConfig;
