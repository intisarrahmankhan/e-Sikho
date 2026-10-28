// Shared by the Node authentication handler and Edge middleware.
const configuredSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
export const AUTH_SECRET = configuredSecret === 'e-sikho-auth-super-secret-key-cse314-2026'
  ? undefined
  : configuredSecret;
