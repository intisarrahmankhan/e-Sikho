import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          900: '#1e3a8a',
        },
        slate: {
          50: '#f8fafc',
          200: '#e2e8f0',
          500: '#64748b',
          900: '#0f172a',
        }
      },
    },
  },
  plugins: [],
};
export default config;
