/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#0a0e1a',
          surface: '#0f1629',
          border: '#1e293b',
          text: '#e2e8f0',
          muted: '#64748b',
          green: '#22c55e',
          red: '#ef4444',
          accent: '#3b82f6',
          yellow: '#eab308',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
