/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: [
          '"Plus Jakarta Sans"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        sans: [
          '"Inter"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      colors: {
        brand: {
          primary: '#0EA5E9', // Vibrant cyan arrow
          hover: '#0284C7', // Darker cyan
          secondary: '#0D9488', // Petrol teal monogram
          accent: '#0F766E', // Deep teal accent
          dark: '#0F172A', // Steel slate text/borders
          light: '#F8FAFC', // Clean surface background
        },
        canvas: {
          light: '#f8fafc',
          white: '#ffffff',
          dark: '#0f172a',
          elevated: '#0f172a',
          card: '#1e293b',
        },
        ink: {
          DEFAULT: '#0f172a',
          secondary: '#6e6e73',
          muted: '#86868b',
          light: '#f8fafc',
        },
        accent: {
          blue: '#0284c7',
          blueHover: '#0369a1',
          link: '#38bdf8',
          green: '#14b8a6',
          amber: '#ff9f0a',
          orange: '#f56300',
          red: '#ff453a',
        },
      },
      borderRadius: {
        pill: '980px',
        bento: '24px',
        'bento-lg': '30px',
      },
      boxShadow: {
        bento: '0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.03)',
        'bento-hover': '0 16px 40px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)',
        'glass-dark': '0 30px 60px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.14)',
      },
    },
  },
  plugins: [],
};
