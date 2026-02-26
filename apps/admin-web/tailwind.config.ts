import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2563EB', dark: '#1D4ED8', light: '#3B82F6' },
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        gray: {
          50: '#F9FAFB', 100: '#F3F4F6', 200: '#E5E7EB', 300: '#D1D5DB',
          400: '#9CA3AF', 500: '#6B7280', 600: '#4B5563', 700: '#374151',
          800: '#1F2937', 900: '#111827',
        },
      },
      fontFamily: { sans: ['Pretendard', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
export default config;
