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
        canvas: {
          light: '#f5f5f7',
          white: '#ffffff',
          dark: '#000000',
          elevated: '#161617',
          card: '#1c1c1e',
        },
        ink: {
          DEFAULT: '#1d1d1f',
          secondary: '#6e6e73',
          muted: '#86868b',
          light: '#f5f5f7',
        },
        accent: {
          blue: '#0071e3',
          blueHover: '#0077ed',
          link: '#2997ff',
          green: '#30d158',
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
