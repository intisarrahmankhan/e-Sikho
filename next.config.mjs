import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

/** @type {import('next').NextConfig} */
const nextConfig = (phase) => ({
  // Keep dev recompiles and production builds from replacing each other's assets.
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : process.env.E_SIKHO_BUILD_DIR || '.next',
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
  },
});

export default nextConfig;
