/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.E_SIKHO_BUILD_DIR || '.next',
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
