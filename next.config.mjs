/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.E_SIKHO_BUILD_DIR || '.next',
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
  },
};

export default nextConfig;
